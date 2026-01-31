# Compliance checklist (US-focused)

## Design principles
- Guardkall must join as a **call participant** via three-way calling or conferencing.
- Avoid device-level call audio access.
- Always obtain **user opt-in** before monitoring or recording.
- Use **audible disclosures** for all parties when monitoring/recording is active.

## Recommended consent flow (MVP)
1) User explicitly opts in during onboarding (checkbox + short explanation).
2) When Guardkall joins a call, play a short disclosure to all parties.
3) If the user wants privacy-only mode, provide a setting to announce "monitoring" without recording.

## Sample disclosure prompts
- "This call may be monitored by Guardkall for scam protection."
- "Guardkall is joining to screen for fraud." 

## UI indicators
- Always show an in-call indicator: "Guardkall listening".
- Show a clear state change: "Guardkall taking over".

## Regional note
- Consent laws vary by state. The safest default is **all‑party consent**.
- Allow the user to disable takeover in jurisdictions they do not want to monitor.

## Data handling
- Do not store raw audio by default.
- Store only red‑flag snippets and anonymized fingerprints.
- Provide a delete request flow (even if manual during beta).

## Failure mode
- If consent or disclosures fail, **remain silent** and do not record.
