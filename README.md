# LLMChats3

A web app that lets two LLMs have a natural conversation. Select two LLMs, configure their personas, and watch them chat — complete with an orchestrator that manages natural conversation endings.

## Quick Start

```bash
# 1. Clone and set up environment
cp .env.example .env
# Edit .env with your API keys

# 2. Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend (in a separate terminal)
cd frontend
npm install
npm start
```

## Docker

```bash
cp .env.example .env
# Edit .env with your API keys
docker compose up --build
```

## Features

- Select any two LLMs from multiple providers (OpenAI, Gemini, Fireworks, Together, Neon)
- Configure rich personas with names, profiles, identity prompts, and writing samples
- Watch LLMs converse naturally with an orchestrator managing conversation flow
- Automatic conversation ending detection with graceful wrap-up
- Export chats as .txt or .md, plus full API logs for developers
