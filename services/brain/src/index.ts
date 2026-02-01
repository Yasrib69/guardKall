import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { getRandomQuestions, SCORING_WEIGHTS } from "./questions.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 4001);

// Initialize Gemini (Fallback)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
  }
});

const supportModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
});

const SYSTEM_PROMPT = `
You are the Safety Officer for Guardkall, an AI scam interceptor.
Your job is to analyze live transcripts of phone calls and detect if the caller is a scammer.

Output JSON format:
{
  "label": "SAFE" | "SUSPICIOUS" | "SCAM",
  "confidence": number (0.0 to 1.0),
  "threat_score": number (0 to 100),
  "claimed_org": string | null,
  "org_type": "bank" | "government" | "tech_support" | "utility" | "police" | "friend" | "unknown" | null,
  "reasons": string[],
  "action": "NONE" | "VERIFY" | "ALERT" | "TAKEOVER" | "HANGUP"
}

Field Definitions:
- threat_score: 0-100 score indicating danger level.
  - 0-20: Safe (Friends, verified businesses)
  - 21-50: Low Risk (Unknown numbers, surveys)
  - 51-79: Suspicious (Unsolicited offers, vague claims)
  - 80-100: High Risk (Threats, urgent money demands, impersonation)

Action Rules:
- "NONE": Score < 40. Transcript seems safe.
- "VERIFY": Score 40-75. Caller claims to be from an organization or story is vague.
- "ALERT": Score 76-85. suspicious patterns detected.
- "TAKEOVER": Score > 85. Confirmed scam markers present.

Voice Commands (Override Everything):
- If the transcript contains "Guardkall, takeover", IMMEDIATELY return action: "TAKEOVER".
- If the transcript contains "Guardkall, stop", IMMEDIATELY return action: "HANGUP".

Scam Heuristics (+ Score):
- Urgent demands for payment (gift cards, crypto) (+50 score)
- Threats of arrest/legal action (+40 score)
- Requests for sensitive info (SSN, OTPs) (+40 score)
- Pretending to be tech support/Gov (+30 score)

Verification Triggers (Action: VERIFY):
- Caller says "I'm calling from [organization]"
- Caller claims to be from a bank, IRS, police, or tech support
`;

const SUPPORT_SYSTEM_PROMPT = `
You are the Support Bot for GuardKall, an AI concierge for phone scams.
Your goal is to help users set up their account, understand how GuardKall protecs them, and usage instructions.

GuardKall features:
- Screens unknown callers using an AI agent.
- Verifies callers and connects them if safe, or blocks them if scam.
- Features 'Silence Unknown Callers' to redirect calls to GuardKall.
- Provides real-time transcripts of screened calls.

Common questions:
- How to enable? Turn on "Silence Unknown Callers" in iPhone settings and set up Call Forwarding to the GuardKall number.
- Is it free? Currently in beta/hackathon mode.
- Does it work on Android? Currently focused on iOS but works with any carrier that supports conditional call forwarding.

Be helpful, concise, and friendly. Use emojis occasionally.
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
  const result = await jsonModel.generateContent([
    SYSTEM_PROMPT,
    `Transcript: "${transcript}"`
  ]);

  const responseText = result.response.text();
  const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(jsonStr);
}

async function chatWithGemini(userMessage: string) {
  const result = await supportModel.generateContent([
    SUPPORT_SYSTEM_PROMPT,
    `User: "${userMessage}"`
  ]);

  return result.response.text();
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


app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`[Brain] Chat request: "${message}"`);
    const response = await chatWithGemini(message);
    console.log(`[Brain] Chat response: "${response}"`);

    res.json({ response });
  } catch (error) {
    console.error("[Brain] Chat Error:", error);
    res.status(500).json({ error: "Chat processing failed", details: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`brain service listening on :${PORT}`);
});
