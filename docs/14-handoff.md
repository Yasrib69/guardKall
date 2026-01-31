# Guardkall Handoff (Jan 30, 2026)

## Where we are
- **DigitalOcean droplet** is live at `159.65.169.230`.
- **Domain** `guardkall.site` now resolves to the droplet.
- **Caddy** is configured and running with HTTPS.
- **Telephony service** is running via **systemd** and reachable at `https://guardkall.site/health` (HTTP 200).
- Telephony app lives on droplet at `/opt/guardkall-telephony`.

## What’s configured on the droplet
- **Caddyfile**: `/etc/caddy/Caddyfile`
  ```
  guardkall.site {
    reverse_proxy localhost:4000
  }
  ```
- **Systemd service**: `/etc/systemd/system/guardkall-telephony.service`
- **Telephony service** listens on port `4000` and is proxied by Caddy on `443`.

## How to verify status
- Check telephony service:
  ```bash
  systemctl status guardkall-telephony --no-pager
  ```
- Check HTTPS:
  ```bash
  curl -I https://guardkall.site/health
  ```
- Check Caddy:
  ```bash
  systemctl status caddy --no-pager
  ss -tulpn | grep caddy
  ```

## What’s done in repo
- **Gateway site** (React + Vite): `gateway/`
- **Services**: `services/telephony`, `services/brain`, `services/voice`, `services/data`
- **Docs**: product, architecture, backend flow, user stories, compliance, sponsor mapping, demo plan

## Known fixes applied
- Twilio import bug fixed in telephony service:
  - uses `import twilioPkg from "twilio"; const { twiml } = twilioPkg;`
- Telephony app is compiled and running on droplet.

## What still needs to be done (next agent)

### 1) Twilio webhook configuration (not done yet)
- In Twilio Console → Phone Numbers → Active numbers → **Voice & Fax**
- Set **A Call Comes In** to:
  ```
  https://guardkall.site/twilio/incoming
  ```
- Method: **POST**

### 2) Confirm Media Streams
- Make a test call to the Twilio number.
- Verify `/twilio/incoming` is hit and Media Stream connects to:
  ```
  wss://guardkall.site/media
  ```

### 3) Add real Speech-to-Text (STT)
- Required for Gemini detection.
- Choose a provider and stream `/media` audio into STT, then send transcript chunks to `/analyze`.

### 4) Gemini integration
- Replace stub in `services/brain` with Gemini 1.5 Pro (Google AI Studio).
- Return SAFE / SUSPICIOUS / SCAM with confidence.

### 5) ElevenLabs integration
- Replace stub in `services/voice` and return audio URL/stream.
- Telephony should play TTS into conference when SCAM detected.

### 6) Snowflake REST
- Implement insert/query for scam fingerprints in `services/data`.

### 7) Optional: systemd for other services
- If hosting brain/voice/data on the droplet, create systemd services for them too.

## Key commands (droplet)
- Restart telephony:
  ```bash
  systemctl restart guardkall-telephony
  ```
- Logs:
  ```bash
  journalctl -u guardkall-telephony -f
  ```

## Local dev
- Gateway frontend:
  ```bash
  cd gateway
  npm install
  npm run dev
  ```

## Environment
- `.env` is expected at `/opt/guardkall-telephony/.env`
- Update with Twilio credentials and service URLs as needed.

