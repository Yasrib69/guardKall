# Guardkall Teli Adapter (Hackathon-Ready) - Implementation Sketch

Goal: Replace the Twilio-centric telephony layer with a minimal Teli adapter that enables
screening calls on a Teli number, producing a verdict, and notifying the user. Live transfer
is a best-effort feature if Teli's transfer tool exists; otherwise we fall back to screen + notify.

This plan is designed so another agent can code it quickly with low risk.

---

## 1) Architecture (Minimal)

Services:
- `services/brain`: keep as-is (analysis + verification + questions).
- `services/teli`: new service (adapter to Teli API).
- `frontend`: Next.js UI with "Live Call Status" panel + a simple status endpoint.

Data:
- `services/data` (if used in repo): store user phone + allowlist + secret challenge.
- For hackathon: OK to store in memory or minimal DB if time is short.

Call Flow (Screen + Notify baseline):
1) Caller dials Teli number (linked to Teli voice agent).
2) Teli agent handles conversation (screening prompt + tool calls).
3) Teli call ends; we fetch call history + transcript.
4) Brain `/analyze` + `/verify` run on transcript to produce verdict.
5) Gateway dashboard shows verdict + transcript summary.

Call Flow (Best-effort Live Transfer):
1) Same as above, but Teli agent uses a "transfer" tool to dial user if SAFE.
2) If transfer fails, fall back to screen + notify.

---

## 1.5) Technical Requirements Checklist

API / Credentials:
- `TELI_API_KEY`
- `org_id`, `user_id`, `tenant_id`
- Teli number provisioning enabled

Services:
- New `services/teli` (Express adapter to Teli API)
- Existing `services/brain` (analysis + questions)
- Gateway backend (for `/api/call-status`)

Routing:
- Call forwarding from personal number -> Teli number (or port number to Teli)

Data (minimum):
- User phone number (for transfer/callback)
- Allowlist of known numbers
- Secret question/answer (optional)

Status Updates:
- Pull mode: poll `GET /v1/voice/calls` after call ends
- Push mode: webhook/tool callback if Teli supports it

Optional (Live Transfer):
- Teli "transfer" tool support for inbound calls
- Fallback to screen + notify if transfer fails

---

## 2) New Service: `services/teli`

### 2.1 Files
- `services/teli/src/index.ts` (Express API)
- `services/teli/package.json`
- `services/teli/tsconfig.json`

### 2.2 Env Vars
- `TELI_API_BASE_URL` (default: https://api.teli.ai)
- `TELI_API_KEY`
- `BRAIN_SERVICE_URL` (existing)
- `GATEWAY_STATUS_URL` (e.g. http://localhost:4003/api/call-status)
- `PUBLIC_APP_URL` (for user-facing links in notifications)

### 2.3 Endpoints (Minimal)

POST `/teli/setup`
- Purpose: Create Teli agent + provision number + link number to agent.
- Body: `{ orgId, userId, tenantId, userPhone, allowlist? }`
- Returns: `{ teliPhoneNumber, agentId, voiceAgentId }`

POST `/teli/status/pull`
- Purpose: Pull recent calls from Teli and update Gateway.
- Body: `{ orgId, userId, limit? }`
- Fetch: `GET /v1/voice/calls?organization_id={orgId}&user_id={userId}&limit={limit}`
- For each new call: run Brain analysis and POST to Gateway.

POST `/teli/status/push` (optional)
- Purpose: If Teli supports webhooks or custom tool callbacks, accept payload and process.
- Body: arbitrary event payload, extract transcript/caller/metadata.

GET `/health`

### 2.4 Teli API Calls (from docs excerpt)

Create agent:
```
POST /v1/agents
{
  "agent_type": "voice",
  "agent_name": "Guardkall Concierge",
  "starting_message": "Welcome to Guardkall Secure Screening. Please state your name and reason for calling.",
  "prompt": "<concierge prompt here>",
  "voice_id": "11labs-Adrian",
  "language": "en-US",
  "organization_id": "{orgId}",
  "user_id": "{userId}"
}
```

Provision number:
```
POST /v1/voice/phone-numbers/create
{
  "area_code": "415",
  "user_id": "{userId}",
  "organization_id": "{orgId}",
  "tenant_id": "{tenantId}"
}
```

Link number to agent:
```
POST /v1/voice/phone-numbers/{number}/update-agent
{
  "agent_id": "{voiceAgentId}"
}
```

Pull call history:
```
GET /v1/voice/calls?organization_id={orgId}&user_id={userId}&limit=10
```

---

## 2.5) Voice Agent Tools (Live Transfer + Real-time Updates)

Teli supports tools via:
`PATCH /v1/agents/{agent_id}/tools`

Minimum tools for Guardkall:
- `custom` (push live status to Guardkall)
- `transfer_call` (handoff to user when SAFE)
- `end_call` (hang up on scam)
- `send_sms` (notify user; user decides to block)

Example payload:
```
PATCH /v1/agents/{agent_id}/tools
{
  "tools": [
    {
      "type": "custom",
      "name": "push_call_status",
      "description": "Send live call updates to Guardkall dashboard when verdict or caller intent is known",
      "url": "https://YOUR_PUBLIC_URL/teli/status/push",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "speak_after_execution": false
    },
    {
      "type": "transfer_call",
      "name": "transfer_to_user",
      "description": "Transfer to the user ONLY if the caller is verified and SAFE or a verified EMERGENCY",
      "transfer_destination": {
        "type": "predefined",
        "number": "+15551234567"
      },
      "transfer_option": {
        "type": "cold_transfer"
      }
    },
    {
      "type": "send_sms",
      "name": "notify_user_scam",
      "description": "Send SMS after a scam is detected to advise the user and link to the report",
      "sms_content": {
        "type": "predefined",
        "content": "Guardkall: Likely scam call from {{phone_number}}. We did not connect you. View report and choose: Block / Ignore."
      }
    },
    {
      "type": "send_sms",
      "name": "notify_user_verified",
      "description": "Send SMS before transfer to confirm verified call details",
      "sms_content": {
        "type": "predefined",
        "content": "Guardkall: Verified call from {{customer_name}} about {{reason}}. Transferring now."
      }
    },
    {
      "type": "end_call",
      "name": "end_call",
      "description": "End the call when a scam is detected or verification fails"
    }
  ]
}
```

Notes:
- `custom` tool calls must be publicly reachable (ngrok is fine for demo).
- If `transfer_call` fails, fall back to screen + notify.
- SMS is advisory; user decides whether to block in the dashboard.

---

## 3) Brain Service Updates (Minimal)

Keep existing endpoints. Add optional helpers:
- `/emergency-verify`: accepts `{ transcript, secretAnswer }` -> `{ pass: boolean }`
- Update `/verify` to use `ORG_INTEL.official_callbacks` if `claimedOrg` is present.
- Update SYSTEM_PROMPT persona to "Concierge Agent".

Hackathon fallback: If time is short, only update the prompt and keep verification logic as-is.

---

## 4) Gateway Updates (Minimal)

### 4.1 New endpoint (backend or mock)
POST `/api/call-status`
- Implement as a Next.js API route (e.g. `frontend/app/api/call-status/route.ts`).
- Input: `{ callId, caller, verdict, status, transcript, source }`
- Store in memory or DB.
- Return `{ ok: true }`

### 4.2 UI panel
Add a "Live Call Status" card showing:
- Caller number
- Verdict (SAFE / SCAM / EMERGENCY)
- Transcript summary
- Timestamp

If live transfer is not supported, show:
> "Call screened. Click to call back."

---

## 5) Agent Prompt (Concierge)

Use a short prompt so it’s reliable:

```
You are the Guardkall Concierge Agent. Your goal is to screen unknown callers.
Ask for name and reason for calling. If a caller claims an organization, ask 1-2 verification questions.
If the caller refuses verification, mark as SCAM. If caller provides details, mark SAFE.
If caller claims emergency, ask the user's secret question and answer. If mismatch, mark UNVERIFIED.
Never request sensitive info like SSN/OTP.
```

---

## 6) Verdict Generation (Minimum)

Since Teli may not provide real-time verdicts:
- When a call ends, fetch transcript + run Brain `/analyze`.
- If `action=VERIFY`, run `/verify` using the final transcript.
- Produce verdict: SAFE / SCAM / EMERGENCY / UNVERIFIED_EMERGENCY.
- Post to Gateway.

---

## 7) Hackathon Demo Script

1) Unknown caller dials Teli number.
2) Agent screens; caller claims "IRS".
3) Agent asks verification; caller fails.
4) Call ends; dashboard shows SCAM verdict + transcript.
5) Show "Call back" button for SAFE cases.

---

## 8) Implementation Tasks (Ordered)

1) Create `services/teli` service (Express + fetch).
2) Implement `/teli/setup` (agent + number + link).
3) Implement `/teli/status/pull` (call history -> Brain -> Gateway).
4) Add `/api/call-status` endpoint in gateway backend (or simple in-memory state in frontend).
5) Add live status card in `gateway/src/App.jsx`.
6) Update Brain prompt to concierge persona (optional).

---

## 9) Notes / Open Questions

- Live transfer depends on Teli "transfer tool" docs, which are not in the current excerpt.
- If transfer tool exists: add to agent tools and call when verdict SAFE.
- Otherwise, screen + notify is the reliable demo for the hackathon.
