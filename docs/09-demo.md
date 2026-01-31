# Demo plan

## Setup
- Telephony service running with public URL (ngrok).
- Twilio number configured to hit `/twilio/incoming`.
- Brain service running locally (stub or Gemini).
- Voice service running (stub or ElevenLabs).
- Data service running (stub or Snowflake).

## Script
1) Call the Twilio number from a phone.
2) Speak a benign sentence (system stays silent).
3) Say a red-flag phrase ("urgent payment", "gift card", etc.).
4) Guardkall takes over with time-waster persona.
5) Show event logged to data service.
