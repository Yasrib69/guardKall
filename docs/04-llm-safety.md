# LLM Safety Officer spec (Gemini via Google AI Studio or OpenRouter)

## Goal
Classify live conversation text as SAFE / SUSPICIOUS / SCAM. Provide concise reasons and confidence.

## Inputs
- Rolling transcript chunks (2-10 seconds of text)
- Conversation context window (last N turns)
- Optional metadata (caller country, known scam script fingerprint)

## Output schema
```json
{
  "label": "SAFE" | "SUSPICIOUS" | "SCAM",
  "confidence": 0.0,
  "reasons": ["string"],
  "action": "NONE" | "ALERT" | "TAKEOVER"
}
```

## Heuristics (examples)
- Urgent payment demands, gift cards, wire transfers
- Threats of arrest, service shutoff, legal action
- Requests for passwords, OTPs, SSN, banking info

## Prompting guidelines
- Prioritize false negatives over false positives (do not hijack legitimate calls).
- If unclear, return SUSPICIOUS with moderate confidence.
- Keep reasons short and machine-actionable.

## Integration notes
- For the prize, prefer Gemini 1.5 Pro via Google AI Studio.
- Use OpenRouter only if you need fast model switching during testing.
