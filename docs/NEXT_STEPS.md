# Next Steps (Teli Pivot + Repo Focus)

Goal: Keep the working prototype safe while focusing the repo on the Teli-based flow.

---

## A) Decisions (do these first)
1) Confirm primary demo flow:
   - Live transfer if Teli transfer works
   - Fallback: screen + notify + call back
   - Always notify via SMS; user decides to block (no auto-block)
2) Confirm where live status will display:
   - Gateway UI only
   - SMS/push notifications later

---

## B) Required Setup (Teli)
1) Fill in `teli.env.example` and load it for the Teli adapter.
2) Create agent + number:
   - `POST /teli/setup` (returns agent + number)
3) Configure tools:
   - `POST /teli/tools/update` with `agentId`, `transferNumber`, and `statusWebhookUrl`
4) Ensure `/teli/status/push` is publicly reachable (ngrok ok).

---

## C) Frontend (Live Status)
1) Implement `POST /api/call-status` (store latest call in memory for demo).
2) Add a “Live Call Status” panel in `frontend` (Next.js UI):
   - caller number
   - verdict (SAFE/SCAM/EMERGENCY)
   - transcript snippet
3) Add a “Call Back” button (for screen + notify fallback).

---

## D) Brain (Optional but Recommended)
1) Update persona to “Concierge Agent”.
2) Add `/emergency-verify` (secret question check).
3) Update `/verify` to use `ORG_INTEL.official_callbacks`.

---

## E) Repo Focus / Cleanup (Safe, Non-Destructive)
1) Keep Twilio prototype intact in `legacy/services/telephony`.
2) Add a top-level note in README:
   - “Current demo uses Teli adapter in `services/teli` and UI in `frontend`”
3) Use `CALL_PROVIDER=teli` via `scripts/watch_call_provider.sh`.
4) (Optional) Move Twilio service into `legacy/` folder after demo.

---

## F) Demo Checklist
1) Call personal number → forwarded to Teli number.
2) Caller claims IRS → agent verifies → fails → verdict = SCAM.
3) Gateway shows verdict + transcript summary.
4) Show fallback “Call Back” for SAFE cases.
