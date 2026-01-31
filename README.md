# Guardkall

AI concierge for phone scams. Unknown callers are screened by an AI agent, verified, and then either connected to you or blocked with a report.

## Hackathon prize targets
- DigitalOcean: telephony server on a DO Droplet
- Gemini API (Google Cloud / AI Studio, optionally via OpenRouter): real-time safety officer
- ElevenLabs: realistic time-waster voice
- Snowflake API: scam script memory
- OpenRouter: model routing and testing (credits)

## Repo layout
- docs/ - product, architecture, APIs, and integration specs
- services/teli/ - Teli adapter (voice agent setup + call status)
- services/brain/ - LLM safety analysis
- services/data/ - Snowflake storage + script matching
- frontend/ - Next.js UI (current demo)
- legacy/ - Twilio prototype + legacy scripts

## Quick start (local)
1) Copy env template and fill in keys

```
cp .env.example .env
```

2) Install deps per service (example Teli adapter)

```
cd services/teli
npm install
npm run dev
```

3) Run the UI (Next.js)

```
cd frontend
npm install
npm run dev
```

## Status
This repo is a starter scaffold. Use the docs/ specs to implement the end-to-end flow.
