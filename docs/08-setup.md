# Setup notes

## Local dev
- Use ngrok or cloudflared to expose the telephony webhook.
- Configure Twilio Voice webhook to `https://<public>/twilio/incoming`.
- Configure Twilio Media Streams to `wss://<public>/media`.

## DigitalOcean
- Create a droplet (Ubuntu).
- Install Node.js and deploy telephony service.
- Set env vars in systemd or a process manager (pm2).

## Gemini (Google AI Studio)
- Use streaming responses for low latency.
- Keep prompts short and structured.

## OpenRouter (optional)
- Use for fast model switching during tests.
