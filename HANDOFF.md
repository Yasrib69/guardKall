# Guardkall Handoff Document

## Project Overview
Guardkall is an AI-powered scam interception and prevention system. It listens to live phone calls, detects scam patterns, verifies caller legitimacy using contextual questioning, and can take over calls to waste a scammer's time with a "Relentless Agent" persona.

## Current Progress & Status
- **Backend Services:** Fully deployed to DigitalOcean (**159.65.169.230**).
- **Frontend:** Modern, Apple-inspired UI with typewriter effects and audio visualizer.
- **Core Logic:** Smart Verification System is implemented and live.

---

## Service Architecture

### 1. Gateway (Frontend)
- **Path:** `/gateway`
- **Stack:** React, Vanilla CSS (Refactored from Tailwind for stability).
- **Features:** "Get Protected" onboarding, real-time status UI.

### 2. Telephony Service
- **Path:** `/services/telephony`
- **Stack:** Node.js, Express, Twilio, Deepgram.
- **Responsibility:** Inbound call handling, media streaming (wss), conference management, and verification state machine.
- **Key Logic:** `src/index.ts` contains the state machine for asking questions and triggering takeovers.

### 3. Brain Service
- **Path:** `/services/brain`
- **Stack:** Node.js, Express, OpenRouter (Gemini 2.0 Flash).
- **Responsibility:** Transcript analysis, organization detection, and response scoring.
- **Key Files:** 
    - `src/questions.ts`: Database of context-aware questions (Bank, IRS, etc.).
    - `src/index.ts`: The analysis prompt and scoring endpoints.

### 4. Voice & Data Services
- **Voice:** `/services/voice` (ElevenLabs integration for bot speech).
- **Data:** `/services/data` (Snowflake integration for event logging).

---

## Smart Verification System (The Moat)
Unlike simple filters, Guardkall actively challenges callers:
1. **Org Detection:** AI detects if a caller claims to be from a known entity (e.g., "Chase Bank").
2. **Contextual Questions:** AI announces questions into the call (e.g., "Which branch are you calling from?").
3. **Behavioral Scoring:** Responses are scored for red flags (urgency, threats, refusal to give ID).
4. **User Control:** User can say **"Guardkall, take over"** or **"Guardkall, hang up"** to manually trigger actions.
5. **Relentless Agent:** Once takeover happens, the AI engages in multi-turn time-wasting dialogue (`src/dialogue.ts`).

---

## Deployment & Monitoring

### Local Scripts:
- `scripts/deploy.sh`: Syncs code and `.env` files to the production server.
- `scripts/finalize_server.sh`: Runs `npm install`, `npm run build`, and `systemctl restart` on all services.

### Server Connection:
- **SSH Command:** `ssh -i private/sshstuff.md root@159.65.169.230`
- **Passphrase:** `kobby123`
- **Password:** `sparThacks`

### Watching Logs (On Server):
- Brain: `journalctl -u guardkall-brain -f`
- Telephony: `journalctl -u guardkall-telephony -f`

---

## Next Steps for the Incoming Agent
1. **User Notification System:** Implement real SMS/Push notifications to the user during the verification phase.
2. **Bank Integration:** Explore Plaid integration for real-world transaction verification (Privacy-safe).
3. **A/B Performance:** Refine the scoring weights in `services/brain/src/questions.ts` based on real-world scam trends.
4. **Visualizer Sync:** Connect the frontend audio visualizer to real-time conference events (muted vs speaking).

---

## Important Credentials
- **Twilio Number:** +1 (855) 774-9107
- **Base URL:** https://guardkall-telephony.kandm.rocks (Proxied to server)
- **Deepgram/OpenRouter/ElevenLabs:** Keys are in the `.env` files on the server.

Good luck! Guardkall is ready for the demo.
