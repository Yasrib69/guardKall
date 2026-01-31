# User stories

## Primary user (consumer)
1) **As a user**, I want to merge Guardkall into a suspicious call with one action so I can avoid talking to a scammer.
2) **As a user**, I want Guardkall to stay silent unless it’s confident, so legitimate calls aren’t disrupted.
3) **As a user**, I want a clear signal when Guardkall takes over, so I know I can hang up safely.
4) **As a user**, I want minimal setup, so I can use it even when I’m stressed.

## Secondary user (caregiver)
5) **As a caregiver**, I want to onboard a family member quickly to protect them from scams.
6) **As a caregiver**, I want a summary after calls, so I can see if they were targeted.

## System/ops
7) **As the system**, I need to detect scam patterns quickly so I can take over before money is lost.
8) **As the system**, I need to avoid false positives, so I don’t interrupt real emergencies.
9) **As the system**, I need to remember scam scripts so spoofed numbers can’t bypass protection.

# Backend story mapping
- Stories 1–4 → Telephony + Brain + Voice
- Stories 5–6 → Data + reporting
- Stories 7–9 → Brain + Data fingerprinting

# Phone connection flow (for UX copy)
- Save your Guardkall number
- On a suspicious call, tap **Add Call**
- Dial Guardkall
- Guardkall listens silently and steps in only when needed
