import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRandomQuestions, RED_FLAG_PATTERNS, SCORING_WEIGHTS } from "./questions.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4001);

// Initialize Gemini (Fallback)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

const SYSTEM_PROMPT = `
You are the Safety Officer for Guardkall, an AI scam interceptor.
Your job is to analyze live transcripts of phone calls and detect if the caller is a scammer.

Output JSON format:
{
  "label": "SAFE" | "SUSPICIOUS" | "SCAM",
  "confidence": number (0.0 to 1.0),
  "claimed_org": string | null,
  "org_type": "bank" | "government" | "tech_support" | "utility" | "police" | "unknown" | null,
  "reasons": string[],
  "action": "NONE" | "VERIFY" | "ALERT" | "TAKEOVER"
}

Field Definitions:
- claimed_org: The specific organization the caller claims to represent (e.g., "Chase Bank", "IRS", "Microsoft"). Null if no claim made.
- org_type: Category of the claimed organization. Use:
  - "bank" for any financial institution
  - "government" for IRS, SSA, or any government agency
  - "tech_support" for Microsoft, Apple, or IT support calls
  - "utility" for electric, gas, water companies
  - "police" for law enforcement
  - "unknown" if organization is claimed but category unclear

Action Rules:
- "NONE": Transcript seems safe, no action needed.
- "VERIFY": Caller claims to be from an organization. Initiate verification questions.
- "ALERT": Suspicious patterns detected but not confirmed scam.
- "TAKEOVER": High-confidence scam detected (>0.85) OR User explicitly requested takeover.

Voice Commands (Override Everything):
- If the transcript contains "Guardkall, takeover" or "Guardkall, take over", IMMEDIATELY return action: "TAKEOVER".
- If the transcript contains "Guardkall, stop" or "Guardkall, hang up", IMMEDATELY return action: "HANGUP".

Scam Heuristics:
- Urgent demands for payment (gift cards, wire transfers, crypto).
- Threats of arrest, legal action, or service disconnection.
- Requests for sensitive info (SSN, OTPs, passwords, bank account numbers).
- Pretending to be tech support (Microsoft/Apple) or government (IRS/Police).

Verification Triggers (use action: "VERIFY"):
- Caller says "I'm calling from [organization]"
- Caller claims to be from a bank, IRS, police, or tech support
- Any institutional affiliation is mentioned

Prioritize FALSE NEGATIVES (do not interrupt safe calls) over false positives.
Only recommend "TAKEOVER" if confidence > 0.85 and clear scam markers are present.
Use "VERIFY" when there's an organization claim that needs validation.
`;

async function analyzeWithOpenRouter(transcript: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key missing");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://guardkall.site",
      "X-Title": "Guardkall"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcript: "${transcript}"` }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter Error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function analyzeWithGemini(transcript: string) {
  const result = await model.generateContent([
    SYSTEM_PROMPT,
    `Transcript: "${transcript}"`
  ]);

  const responseText = result.response.text();
  const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(jsonStr);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});


// ... (existing imports)

// ... (previous code)

app.post("/questions", (req, res) => {
  const { orgType } = req.body;
  const type = orgType || "unknown";
  const questions = getRandomQuestions(type, 3);
  res.json({ questions });
});

app.post("/verify", (req, res) => {
  const { transcript, claimedOrg, orgType } = req.body;

  if (!transcript) {
    return res.json({ score: 0, verdict: "UNCERTAIN", reasons: ["No transcript provided"] });
  }

  let score = 0;
  const reasons: string[] = [];

  const lowerTranscript = transcript.toLowerCase();

  // Check against red flags
  if (lowerTranscript.includes("don't have") && lowerTranscript.includes("id")) {
    score += SCORING_WEIGHTS.REFUSES_ID;
    reasons.push("Refused to provide ID");
  }

  if (lowerTranscript.includes("cannot") && lowerTranscript.includes("call back")) {
    score += SCORING_WEIGHTS.REFUSES_CALLBACK;
    reasons.push("Refused callback verification");
  }

  if (lowerTranscript.includes("customer service") && !lowerTranscript.includes("department")) {
    score += SCORING_WEIGHTS.VAGUE_DEPARTMENT;
    reasons.push("Vague department claim");
  }

  // Check for green flags
  // In a real system, we'd use LLM to semantic match, but simple keywords help for now
  if (lowerTranscript.match(/\d{3,}/)) { // Contains numbers (likely an ID/extension)
    score += SCORING_WEIGHTS.GIVES_SPECIFIC_ID;
    reasons.push("Provided specific number/ID");
  }

  if (lowerTranscript.includes("yes") && lowerTranscript.includes("call back")) {
    score += SCORING_WEIGHTS.AGREES_TO_CALLBACK;
    reasons.push("Agreed to callback");
  }

  // Urgent/Threatening patterns
  if (lowerTranscript.includes("now") || lowerTranscript.includes("immediately") || lowerTranscript.includes("urgent")) {
    score += SCORING_WEIGHTS.PRESSURES_URGENCY;
    reasons.push("Pressured urgency");
  }

  if (lowerTranscript.includes("arrest") || lowerTranscript.includes("police") || lowerTranscript.includes("warrant")) {
    score += SCORING_WEIGHTS.THREATENS;
    reasons.push("Threatened consequences");
  }

  // Final Verdict
  let verdict = "UNCERTAIN";
  if (score > 10) verdict = "SAFE";
  if (score < -15) verdict = "SCAM";

  console.log(`[Verify] Score: ${score} | Verdict: ${verdict} | Reasons: ${reasons.join(", ")}`);

  res.json({
    score,
    verdict,
    reasons,
    action: verdict === "SCAM" ? "TAKEOVER" : "NONE"
  });
});

app.post("/analyze", async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || "");
    // ... (rest of analyze function)
    if (!transcript.trim()) {
      return res.json({ label: "SAFE", confidence: 0, reasons: ["empty input"], action: "NONE" });
    }

    let data;
    try {
      console.log(`[Brain] Attempting analysis with OpenRouter...`);
      data = await analyzeWithOpenRouter(transcript);
    } catch (err) {
      console.warn(`[Brain] OpenRouter failed, falling back to Gemini Direct:`, err);
      data = await analyzeWithGemini(transcript);
    }

    console.log(`[Brain] Analyzed: "${transcript.substring(0, 50)}..." -> ${JSON.stringify(data)}`);
    res.json(data);
  } catch (error) {
    console.error("[Brain] Error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`brain service listening on :${PORT}`);
});
