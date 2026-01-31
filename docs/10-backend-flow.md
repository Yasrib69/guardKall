# Backend flow (Guardkall)

## Overview
Guardkall needs three backend layers:
1) Telephony gateway (Twilio + media stream handling)
2) Real-time AI analysis (Gemini via Google AI Studio; OpenRouter optional)
3) Voice takeover + data memory (ElevenLabs + Snowflake API)

This document describes how calls are connected, how audio becomes decisions, and how takeover is triggered.

## How users connect their phone
### Phase 1 (hackathon / beta)
- User saves a dedicated Guardkall number.
- During a suspicious call, user taps **Add Call** and dials Guardkall.
- Twilio merges the user, scammer, and Guardkall into a **Conference**.
- Guardkall listens via Twilio Media Streams without speaking.

### Phase 2 (productized)
- Optional: direct call screening via carrier integrations or device app.
- Optional: single-tap merge using an app + CallKit/Android Telecom.

## Core backend flow (sequence)
1) **Incoming join**: Twilio webhook hits `/twilio/incoming`.
2) **Conference join**: TwiML joins the user to a conference and starts Media Stream.
3) **Audio ingest**: Media Stream frames arrive over WebSocket `/media`.
4) **Speech-to-text**: Audio frames are transcribed in real time.
5) **AI safety**: Transcript chunks sent to Brain service `/analyze`.
6) **Decision**: Brain returns SAFE / SUSPICIOUS / SCAM + confidence.
7) **Takeover**:
   - If SCAM, telephony service requests Voice `/speak`.
   - Telephony service plays TTS back into the conference and optionally mutes user.
8) **Memory**: Telephony posts event + snippet to Data `/events`.

## Required backend services
- **Telephony Service**
  - Twilio webhook endpoints
  - Media Stream WebSocket
  - Conference control + barge-in logic
  - Calls to Brain, Voice, Data

- **Brain Service**
  - Low-latency analysis (Gemini 1.5 Pro streaming)
  - Maintains a rolling conversation window
  - Outputs label + confidence + action

- **Voice Service**
  - Generates “Time‑Waster” audio
  - Supports streaming or quick clip generation

- **Data Service**
  - Stores scam script fingerprints via Snowflake REST API
  - Records detection events for analytics

## Notes on telephony control
- Barge-in can be done by:
  - Playing TTS into the conference, or
  - Muting the user leg and speaking on the Guardkall leg.

## Latency budget (target)
- STT: < 600ms
- AI analysis: < 800ms
- TTS generation: < 700ms
- Total time to takeover: ~2 seconds

## Failure modes
- STT down → revert to silent mode, log failure.
- AI returns low confidence → remain silent.
- Voice error → fallback to pre-recorded responses.
