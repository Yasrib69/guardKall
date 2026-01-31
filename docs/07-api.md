# Internal API spec

## Telephony -> Brain
POST /analyze
Request:
```json
{
  "callId": "string",
  "timestamp": "ISO-8601",
  "transcript": "string",
  "context": ["string"],
  "metadata": {
    "caller": "string",
    "country": "string"
  }
}
```
Response:
```json
{
  "label": "SAFE" | "SUSPICIOUS" | "SCAM",
  "confidence": 0.0,
  "reasons": ["string"],
  "action": "NONE" | "ALERT" | "TAKEOVER"
}
```

## Telephony -> Voice
POST /speak
Request:
```json
{
  "callId": "string",
  "text": "string",
  "persona": "confused-bureaucrat"
}
```
Response:
```json
{
  "audioUrl": "string"
}
```

## Telephony -> Data
POST /events
Request:
```json
{
  "callId": "string",
  "label": "string",
  "confidence": 0.0,
  "reasons": ["string"],
  "snippet": "string"
}
```
Response:
```json
{ "ok": true }
```
