# GuardKall

GuardKall is an AI-powered phone scam interception platform designed to screen unknown callers before they reach the user. The system uses conversational AI, behavioral analysis, and real-time safety evaluation to determine whether a caller should be connected, flagged, or blocked.

The project focuses on combining AI-driven decision making with scalable backend infrastructure to improve digital safety and reduce scam-related risks.

---

## Features

* AI-assisted screening for unknown callers
* Real-time conversational safety analysis
* Behavioral risk scoring and verification workflows
* Scam pattern detection and reporting
* Data storage and script matching for repeated scam behaviors
* Modular backend architecture for future scalability

---

## Tech Stack

### Backend & Infrastructure

* Python
* Node.js
* REST APIs
* Snowflake
* DigitalOcean

### AI & Analysis

* Gemini API
* OpenRouter
* Conversational AI workflows
* Behavioral analysis and risk scoring

### Frontend

* Next.js

### Development Tools

* Git & GitHub

---

## Architecture

### Repository Structure

* `docs/` — Product specifications, architecture diagrams, API documentation
* `services/teli/` — Voice call integration and telephony workflows
* `services/brain/` — AI safety analysis and conversational evaluation
* `services/data/` — Snowflake integration and scam behavior storage
* `frontend/` — Next.js frontend application
* `legacy/` — Earlier Twilio-based prototype implementations

---

## System Overview

GuardKall analyzes incoming calls using AI-assisted conversational workflows and behavioral signals. The platform evaluates suspicious patterns in real time and generates dynamic risk assessments before forwarding calls to the user.

The long-term goal is to build a scalable security-focused communication platform capable of identifying and adapting to evolving scam behaviors.

---

## Future Improvements

* Advanced NLP integration
* Real-time voice transcription
* Expanded scam detection datasets
* Mobile application support
* Dashboard analytics and reporting
* Cloud-native deployment scaling

---

## Local Development

### Environment Setup

```bash
cp .env.example .env
```

### Start Telephony Service

```bash
cd services/teli
npm install
npm run dev
```

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Status

GuardKall is currently under active development as a research and engineering project focused on AI-assisted cybersecurity and scam prevention systems.

---

## Author

Salma Ibrahim
Computer Science Student — Eastern Michigan University
