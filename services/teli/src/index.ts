import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 4010);
const TELI_API_BASE_URL = (process.env.TELI_API_BASE_URL || "https://api.teli.ai").replace(/\/$/, "");
const TELI_API_KEY = process.env.TELI_API_KEY || "";
const TELI_ORGANIZATION_ID = process.env.TELI_ORGANIZATION_ID || "";
const TELI_USER_ID = process.env.TELI_USER_ID || "";
const BRAIN_SERVICE_URL = process.env.BRAIN_SERVICE_URL || "";
const GATEWAY_STATUS_URL = process.env.GATEWAY_STATUS_URL || "";
const TELI_STATUS_WEBHOOK_URL = process.env.TELI_STATUS_WEBHOOK_URL || "";
const DATA_SERVICE_URL = process.env.DATA_SERVICE_URL || "http://localhost:4003";

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

// Lookup all registered users (for multi-user call routing)
async function getAllUsers(): Promise<Array<{ id: string; firstName: string; lastName: string; phoneNumber: string }>> {
  try {
    const res = await fetch(`${DATA_SERVICE_URL}/users`);
    const data = await res.json();
    if (data.ok && data.users) {
      return data.users;
    }
  } catch (err) {
    console.warn("[Users] Failed to fetch users:", err);
  }
  return [];
}

// Get the user to route calls/SMS to - uses logged-in user's phone
// When a user signs up, their phone becomes the active destination
async function getTargetUserPhone(): Promise<string> {
  // Get users from database (ordered by CREATED_AT DESC, so newest first)
  const users = await getAllUsers();

  if (users.length > 0) {
    // Use the most recent signup (first in the list = newest)
    const activeUser = users[0];
    console.log(`[Routing] Active user: ${activeUser.firstName} ${activeUser.lastName} → ${activeUser.phoneNumber}`);
    return activeUser.phoneNumber;
  }

  // Fallback if no users registered
  console.warn("[Routing] No users registered - SMS will be skipped");
  return "";
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: "teli" });
});

// Config check endpoint - shows what credentials are configured
app.get("/teli/config", (_req, res) => {
  res.json({
    ok: true,
    configured: {
      apiKey: TELI_API_KEY ? "set" : "missing",
      organizationId: TELI_ORGANIZATION_ID ? TELI_ORGANIZATION_ID.substring(0, 10) + "..." : "missing",
      userId: TELI_USER_ID ? TELI_USER_ID.substring(0, 10) + "..." : "missing",
      apiBaseUrl: TELI_API_BASE_URL,
      brainServiceUrl: BRAIN_SERVICE_URL || "not configured",
      gatewayStatusUrl: GATEWAY_STATUS_URL || "not configured",
      dataServiceUrl: DATA_SERVICE_URL
    }
  });
});

app.post("/teli/setup", async (req, res) => {
  try {
    const body = req.body || {};
    const orgId = body.orgId || TELI_ORGANIZATION_ID;
    const userId = body.userId || TELI_USER_ID;
    const tenantId = body.tenantId || orgId; // Default tenant to org
    const { agentName, areaCode, transferNumber, voiceId } = body;
    requireEnv(orgId, "orgId (set TELI_ORGANIZATION_ID in .env or pass in body)");
    requireEnv(userId, "userId (set TELI_USER_ID in .env or pass in body)");

    const resolvedVoiceId = voiceId || "cartesia-Cleo";
    const resolvedAgentName = agentName || "GuardKall Concierge";
    const mode = (body.guardMode || "personal").toLowerCase();

    // Dynamic Prompt Generator
    const getPromptForMode = (m: string) => {
      const base = `You are GuardKall, a security screening assistant protecting the user from scam calls.`;

      const modes: Record<string, string> = {
        personal: `
${base}
Mode: PERSONAL (Balanced)
1. Greet politely: "Hi, I'm checking who this is for [User]."
2. Ask name/reason.
3. If it's a known contact type (family/friend), transfer immediately.
4. If it's a business/unknown, ask 1-2 verification questions.
5. Watch for red flags (urgency, money).
6. Transfer if low risk. Block if scam.`,

        business: `
${base}
Mode: BUSINESS (Professional)
1. Greet formally: "Good day, this is an automated screening service for [User]."
2. Ask for Name, Company, and Appointment details.
3. If they have an appointment, transfer.
4. If sales/cold call, ask to leave a voicemail or send an email.
5. Strict verification for banks/gov agencies.`,

        max_security: `
${base}
Mode: MAX SECURITY (Skeptical)
1. Greet sternly: "Security screening. Identify yourself."
2. Trust no one. Demand reference numbers and callback numbers.
3. If they claim to be a bank/gov, tell them [User] will call back on the official number.
4. DO NOT TRANSFER unless they provide a specific "Safe Word" (if configured) or pass strict verification.
5. Hang up on any urgency/threats.`
      };

      return modes[m] || modes.personal;
    };

    const defaultPrompt = getPromptForMode(mode);
    const defaultStartingMessage = "Hi, you've reached a secure screening line. May I ask who's calling and what this is regarding?";

    // 1. Try to create Teli voice agent (may fail - their API has issues)
    let teliAgentId: string | null = null;
    try {
      const teliAgent = await teliFetch<any>("/v1/agents", {
        method: "POST",
        body: JSON.stringify({
          organization_id: orgId,
          user_id: userId,
          agent_name: resolvedAgentName,
          agent_type: "voice",
          voice_id: resolvedVoiceId,
          language: "en-US",
          starting_message: defaultStartingMessage,
          prompt: defaultPrompt
        })
      });
      teliAgentId = teliAgent.voice_agent_id || teliAgent.agent_id;
      console.log(`[Teli] Created agent: ${teliAgentId}`);
    } catch (agentErr: any) {
      console.warn(`[Teli] Agent creation failed (known issue): ${agentErr.message}`);
      // Continue without Teli agent - we'll store config locally
    }

    // 2. Provision phone number from Teli
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
    const phoneNumberPretty = phone.phone_number_pretty || phoneNumber;

    // 3. Link phone to agent (if agent was created)
    if (teliAgentId) {
      try {
        await teliFetch<any>(`/v1/voice/phone-numbers/${encodeURIComponent(phoneNumber)}/update-agent`, {
          method: "POST",
          body: JSON.stringify({ agent_id: teliAgentId })
        });
        console.log(`[Teli] Linked ${phoneNumber} to agent ${teliAgentId}`);
      } catch (linkErr: any) {
        console.warn(`[Teli] Phone-agent link failed: ${linkErr.message}`);
      }
    }

    // 4. Store agent config in our Snowflake (always succeeds)
    const localAgentId = teliAgentId || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const dataResponse = await fetch(`${DATA_SERVICE_URL}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: localAgentId,
        userId,
        orgId,
        tenantId,
        agentName: resolvedAgentName,
        voiceId: resolvedVoiceId,
        prompt: defaultPrompt,
        startingMessage: defaultStartingMessage,
        teliPhoneNumber: phoneNumber,
        transferNumber: transferNumber || ""
      })
    });

    if (!dataResponse.ok) {
      const text = await dataResponse.text();
      throw new Error(`Data service error: ${text}`);
    }

    res.json({
      ok: true,
      agentId: localAgentId,
      teliAgentId: teliAgentId || null,
      phoneNumber,
      phoneNumberPretty,
      teliAgentLinked: !!teliAgentId,
      message: teliAgentId
        ? "Agent created in Teli + stored in Snowflake. Phone linked."
        : "Agent stored in Snowflake. Phone provisioned. (Teli agent creation unavailable)"
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "setup_failed" });
  }
});

app.post("/teli/status/pull", async (req, res) => {
  try {
    const body = req.body || {};
    const orgId = body.orgId || TELI_ORGANIZATION_ID;
    const userId = body.userId || TELI_USER_ID;
    const limit = body.limit;
    requireEnv(orgId, "orgId (set TELI_ORGANIZATION_ID in .env or pass in body)");
    requireEnv(userId, "userId (set TELI_USER_ID in .env or pass in body)");

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

      const caller = extractCaller(call);
      const statusPayload = {
        callId,
        caller,
        verdict,
        status: "completed",
        transcript,
        analysis,
        source: "teli"
      };

      // Store call in Snowflake
      await fetch(`${DATA_SERVICE_URL}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          agentId: call.agent_id || call.agentId || "",
          userId: call.user_id || call.userId || "",
          callerNumber: caller,
          teliPhoneNumber: call.to || call.phone_number || "",
          status: "completed",
          transcript,
          verdict,
          analysis
        })
      });

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

    // Store call in Snowflake
    await fetch(`${DATA_SERVICE_URL}/calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callId,
        agentId: payload.agent_id || payload.agentId || "",
        userId: payload.user_id || payload.userId || "",
        callerNumber: extractCaller(payload),
        teliPhoneNumber: payload.to || payload.phone_number || "",
        status: payload.status || "completed",
        transcript,
        verdict,
        analysis
      })
    });

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

    // Build tools payload if not provided
    let toolPayload = tools as Array<Record<string, any>> | undefined;
    if (!toolPayload || toolPayload.length === 0) {
      const statusUrl = statusWebhookUrl || TELI_STATUS_WEBHOOK_URL;
      const includeEnd = includeEndCall !== false;
      const scamTemplate = smsScamTemplate || "GuardKall: Likely scam call from {{phone_number}}. We blocked it. View report: Block/Ignore.";
      const verifiedTemplate = smsVerifiedTemplate || "GuardKall: Verified call from {{customer_name}} about {{reason}}.";
      const resolvedTools: Array<Record<string, any>> = [];

      if (statusUrl) {
        resolvedTools.push({
          type: "custom",
          name: "push_call_status",
          description: "Send live call updates to GuardKall dashboard",
          url: statusUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          speak_after_execution: Boolean(speakAfterExecution)
        });
      }

      if (transferNumber) {
        resolvedTools.push({
          type: "transfer_call",
          name: "transfer_to_user",
          description: "Transfer to user ONLY if caller is verified SAFE",
          transfer_destination: { type: "predefined", number: transferNumber },
          transfer_option: { type: "cold_transfer" }
        });
      }

      resolvedTools.push({
        type: "send_sms",
        name: "notify_user_scam",
        description: "Send SMS when scam detected",
        sms_content: { type: "predefined", content: scamTemplate }
      });

      resolvedTools.push({
        type: "send_sms",
        name: "notify_user_verified",
        description: "Send SMS for verified calls",
        sms_content: { type: "predefined", content: verifiedTemplate }
      });

      if (includeEnd) {
        resolvedTools.push({
          type: "end_call",
          name: "end_call",
          description: "End call when scam detected or verification fails"
        });
      }

      toolPayload = resolvedTools;
    }

    // Try to update tools in Teli (may fail if agent wasn't created)
    let teliUpdated = false;
    try {
      await teliFetch(`/v1/agents/${encodeURIComponent(agentId)}/tools`, {
        method: "PATCH",
        body: JSON.stringify({ tools: toolPayload })
      });
      teliUpdated = true;
      console.log(`[Teli] Tools updated for agent ${agentId}`);
    } catch (teliErr: any) {
      console.warn(`[Teli] Tools update failed (agent may not exist in Teli): ${teliErr.message}`);
    }

    // Update Snowflake with transfer number
    if (transferNumber) {
      await fetch(`${DATA_SERVICE_URL}/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferNumber })
      });
    }

    res.json({
      ok: true,
      agentId,
      transferNumber,
      statusWebhookUrl: statusWebhookUrl || TELI_STATUS_WEBHOOK_URL,
      teliUpdated,
      toolsConfigured: toolPayload.length,
      message: teliUpdated
        ? "Tools configured in Teli + Snowflake"
        : "Tools saved to Snowflake (Teli agent not found - configure manually in Teli dashboard)"
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "tools_update_failed" });
  }
});

// Get agent details from Snowflake
app.get("/teli/agents/:id", async (req, res) => {
  try {
    const response = await fetch(`${DATA_SERVICE_URL}/agents/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// List agents for a user
app.get("/teli/agents", async (req, res) => {
  try {
    const { userId, orgId } = req.query;
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId as string);
    if (orgId) params.set("orgId", orgId as string);

    const response = await fetch(`${DATA_SERVICE_URL}/agents?${params.toString()}`);
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`teli service listening on :${PORT}`);
  console.log(`  API Key: ${TELI_API_KEY ? "configured" : "MISSING"}`);
  console.log(`  Organization ID: ${TELI_ORGANIZATION_ID ? TELI_ORGANIZATION_ID.substring(0, 15) + "..." : "MISSING"}`);
  console.log(`  User ID: ${TELI_USER_ID ? TELI_USER_ID.substring(0, 15) + "..." : "MISSING"}`);
});
