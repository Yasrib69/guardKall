import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 4010);
const TELI_API_BASE_URL = (process.env.TELI_API_BASE_URL || "https://api.teli.ai").replace(/\/$/, "");
const TELI_API_KEY = process.env.TELI_API_KEY || "";
const BRAIN_SERVICE_URL = process.env.BRAIN_SERVICE_URL || "";
const GATEWAY_STATUS_URL = process.env.GATEWAY_STATUS_URL || "";
const TELI_STATUS_WEBHOOK_URL = process.env.TELI_STATUS_WEBHOOK_URL || "";

const seenCallIds = new Set<string>();

function requireEnv(value: string, name: string) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
}

function toUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${TELI_API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function teliFetch<T = any>(path: string, options: RequestInit = {}) {
  requireEnv(TELI_API_KEY, "TELI_API_KEY");
  const response = await fetch(toUrl(path), {
    ...options,
    headers: {
      "X-API-Key": TELI_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Teli API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}

function normalizeTranscript(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.filter(Boolean).join(" ");
  if (typeof raw === "object" && raw && "text" in raw) {
    const text = (raw as { text?: string }).text;
    return text || "";
  }
  return "";
}

function extractCallId(call: Record<string, any>, fallbackIndex: number) {
  return (
    call.call_id ||
    call.callId ||
    call.id ||
    call.sid ||
    call.call_sid ||
    `call-${Date.now()}-${fallbackIndex}`
  );
}

function extractCaller(call: Record<string, any>) {
  return (
    call.from ||
    call.caller ||
    call.caller_number ||
    call.phone_number ||
    call.lead_phone_number ||
    "unknown"
  );
}

async function analyzeTranscript(transcript: string) {
  if (!BRAIN_SERVICE_URL) {
    return { label: "UNCERTAIN", confidence: 0, reasons: ["brain_not_configured"], action: "NONE" };
  }

  const analyzeResponse = await fetch(`${BRAIN_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });

  if (!analyzeResponse.ok) {
    const text = await analyzeResponse.text();
    throw new Error(`Brain analyze error: ${text}`);
  }

  const analysis = await analyzeResponse.json();
  if (analysis.action === "VERIFY") {
    const verifyResponse = await fetch(`${BRAIN_SERVICE_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, claimedOrg: analysis.claimed_org, orgType: analysis.org_type })
    });
    if (verifyResponse.ok) {
      const verify = await verifyResponse.json();
      return { ...analysis, verify };
    }
  }

  return analysis;
}

async function pushStatus(payload: Record<string, any>) {
  if (!GATEWAY_STATUS_URL) return;

  await fetch(GATEWAY_STATUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: "teli" });
});

app.post("/teli/setup", async (req, res) => {
  try {
    const { orgId, userId, tenantId, agentName, areaCode } = req.body || {};
    requireEnv(orgId, "orgId");
    requireEnv(userId, "userId");
    requireEnv(tenantId, "tenantId");

    const agent = await teliFetch<any>("/v1/agents", {
      method: "POST",
      body: JSON.stringify({
        agent_type: "voice",
        agent_name: agentName || "Guardkall Concierge",
        starting_message: "Welcome to Guardkall Secure Screening. Please state your name and reason for calling.",
        prompt: "You are the Guardkall Concierge Agent. Screen unknown callers. Ask for name and reason. If caller claims an org, ask verification questions. Mark SCAM if they refuse verification. Never ask for sensitive info.",
        voice_id: "11labs-Adrian",
        language: "en-US",
        organization_id: orgId,
        user_id: userId
      })
    });

    const voiceAgentId = agent.voice_agent_id || agent.agent_id;

    const phone = await teliFetch<any>("/v1/voice/phone-numbers/create", {
      method: "POST",
      body: JSON.stringify({
        area_code: areaCode || "415",
        user_id: userId,
        organization_id: orgId,
        tenant_id: tenantId
      })
    });

    const phoneNumber = phone.phone_number || phone.number;

    await teliFetch<any>(`/v1/voice/phone-numbers/${encodeURIComponent(phoneNumber)}/update-agent`, {
      method: "POST",
      body: JSON.stringify({
        agent_id: voiceAgentId
      })
    });

    res.json({
      ok: true,
      agentId: agent.agent_id,
      voiceAgentId,
      phoneNumber,
      phoneNumberPretty: phone.phone_number_pretty || phoneNumber
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "setup_failed" });
  }
});

app.post("/teli/status/pull", async (req, res) => {
  try {
    const { orgId, userId, limit } = req.body || {};
    requireEnv(orgId, "orgId");
    requireEnv(userId, "userId");

    const query = new URLSearchParams({
      organization_id: orgId,
      user_id: userId,
      limit: String(limit || 10)
    });

    const data = await teliFetch<any>(`/v1/voice/calls?${query.toString()}`, { method: "GET" });
    const calls = data.calls || data.results || data.data || [];

    const processed: any[] = [];

    for (let i = 0; i < calls.length; i += 1) {
      const call = calls[i] || {};
      const callId = extractCallId(call, i);
      if (seenCallIds.has(callId)) continue;

      const transcript = normalizeTranscript(call.transcript || call.full_transcript || call.text);
      if (!transcript) continue;

      const analysis = await analyzeTranscript(transcript);
      const verdict = analysis.label || analysis.verdict || "UNCERTAIN";

      const statusPayload = {
        callId,
        caller: extractCaller(call),
        verdict,
        status: "completed",
        transcript,
        analysis,
        source: "teli"
      };

      await pushStatus(statusPayload);
      processed.push(statusPayload);
      seenCallIds.add(callId);
    }

    res.json({ ok: true, processedCount: processed.length, processed });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "pull_failed" });
  }
});

app.post("/teli/status/push", async (req, res) => {
  try {
    const payload = req.body || {};
    const callId = extractCallId(payload, Date.now());
    if (seenCallIds.has(callId)) return res.json({ ok: true, skipped: true });

    const transcript = normalizeTranscript(payload.transcript || payload.full_transcript || payload.text);
    if (!transcript) {
      return res.json({ ok: true, skipped: true, reason: "no_transcript" });
    }

    const analysis = await analyzeTranscript(transcript);
    const verdict = analysis.label || analysis.verdict || "UNCERTAIN";

    const statusPayload = {
      callId,
      caller: extractCaller(payload),
      verdict,
      status: payload.status || "completed",
      transcript,
      analysis,
      source: "teli"
    };

    await pushStatus(statusPayload);
    seenCallIds.add(callId);

    res.json({ ok: true, status: statusPayload });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "push_failed" });
  }
});

app.post("/teli/tools/update", async (req, res) => {
  try {
    const {
      agentId,
      tools,
      statusWebhookUrl,
      transferNumber,
      includeEndCall,
      speakAfterExecution,
      smsScamTemplate,
      smsVerifiedTemplate
    } = req.body || {};
    requireEnv(agentId, "agentId");

    let toolPayload = tools as Array<Record<string, any>> | undefined;
    if (!toolPayload || toolPayload.length === 0) {
      const statusUrl = statusWebhookUrl || TELI_STATUS_WEBHOOK_URL;
      const includeEnd = includeEndCall !== false;
      const scamTemplate =
        smsScamTemplate ||
        "Guardkall: Likely scam call from {{phone_number}}. We did not connect you. View report and choose: Block / Ignore.";
      const verifiedTemplate =
        smsVerifiedTemplate ||
        "Guardkall: Verified call from {{customer_name}} about {{reason}}. Transferring now.";
      const resolvedTools: Array<Record<string, any>> = [];

      if (statusUrl) {
        resolvedTools.push({
          type: "custom",
          name: "push_call_status",
          description: "Send live call updates to Guardkall dashboard when verdict or caller intent is known",
          url: statusUrl,
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          speak_after_execution: Boolean(speakAfterExecution)
        });
      }

      if (transferNumber) {
        resolvedTools.push({
          type: "transfer_call",
          name: "transfer_to_user",
          description: "Transfer to the user ONLY if the caller is verified and SAFE or a verified EMERGENCY",
          transfer_destination: {
            type: "predefined",
            number: transferNumber
          },
          transfer_option: {
            type: "cold_transfer"
          }
        });
      }

      resolvedTools.push({
        type: "send_sms",
        name: "notify_user_scam",
        description: "Send SMS after a scam is detected to advise the user and link to the report",
        sms_content: {
          type: "predefined",
          content: scamTemplate
        }
      });

      resolvedTools.push({
        type: "send_sms",
        name: "notify_user_verified",
        description: "Send SMS before transfer to confirm verified call details",
        sms_content: {
          type: "predefined",
          content: verifiedTemplate
        }
      });

      if (includeEnd) {
        resolvedTools.push({
          type: "end_call",
          name: "end_call",
          description: "End the call when a scam is detected or verification fails"
        });
      }

      if (resolvedTools.length === 0) {
        return res.status(400).json({ ok: false, error: "tools_missing" });
      }

      toolPayload = resolvedTools;
    }

    const result = await teliFetch(`/v1/agents/${encodeURIComponent(agentId)}/tools`, {
      method: "PATCH",
      body: JSON.stringify({ tools: toolPayload })
    });

    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "tools_update_failed" });
  }
});

app.listen(PORT, () => {
  console.log(`teli service listening on :${PORT}`);
});
