# Telephony spec (Twilio)

## Call model
Guardkall joins a live call as a third party. For hackathon scope, use Twilio Conference and Media Streams.

## Endpoints
- POST /twilio/incoming
  - Twilio webhook when Guardkall number is dialed.
  - Respond with TwiML to place caller into a conference and start media streaming.

- POST /twilio/guardkall-join
  - Optional endpoint to have the Guardkall bot join a conference.

- WS /media
  - Twilio Media Streams WebSocket endpoint.
  - Receives base64 audio frames and call metadata.

## TwiML sketch
- Create or join conference (name = callSid or derived).
- Start Media Stream to `wss://PUBLIC_BASE_URL/media`.
- Optional: Say "Connecting Guardkall" for UX.

## Detection actions
- If SCAM detected: unmute Guardkall and start playing generated audio.
- If SAFE: remain silent.

## TODOs
- Decide STT provider (e.g., Deepgram, Whisper streaming, Twilio Speech).
- Decide how to barge-in and take over the call smoothly.
