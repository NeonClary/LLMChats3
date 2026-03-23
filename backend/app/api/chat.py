from __future__ import annotations

import json
import logging
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import settings
from app.services.persona import generate_role_prompt
from app.services.orchestrator import (
    Session, Persona, create_session, get_session, run_conversation,
)

router = APIRouter()
LOG = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class GenerateRoleRequest(BaseModel):
    model_id: str
    name: str = ""
    profile: str = ""
    identity: str = ""
    samples: str = ""


class StartChatRequest(BaseModel):
    persona_a_model_id: str
    persona_a_name: str
    persona_a_role: str

    persona_b_model_id: str
    persona_b_name: str
    persona_b_role: str

    starter_text: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat/generate-role")
async def api_generate_role(req: GenerateRoleRequest):
    result = await generate_role_prompt(
        model_id=req.model_id,
        name=req.name,
        profile=req.profile,
        identity=req.identity,
        samples=req.samples,
    )
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/chat/start")
async def api_start_chat(req: StartChatRequest):
    """Create a session and return a streaming SSE response for the conversation."""
    ra = settings.resolve_model(req.persona_a_model_id)
    rb = settings.resolve_model(req.persona_b_model_id)

    if not ra:
        raise HTTPException(400, f"Unknown model: {req.persona_a_model_id}")
    if not rb:
        raise HTTPException(400, f"Unknown model: {req.persona_b_model_id}")

    session = create_session()
    session.persona_a = Persona(
        name=req.persona_a_name or "Persona A",
        model_id=ra["model_id"],
        role_prompt=req.persona_a_role,
        base_url=ra["base_url"],
        api_key=ra["api_key"],
        display_name=ra["display_name"],
    )
    session.persona_b = Persona(
        name=req.persona_b_name or "Persona B",
        model_id=rb["model_id"],
        role_prompt=req.persona_b_role,
        base_url=rb["base_url"],
        api_key=rb["api_key"],
        display_name=rb["display_name"],
    )

    async def event_stream():
        yield f"event: session\ndata: {json.dumps({'session_id': session.session_id})}\n\n"
        async for chunk in run_conversation(session, req.starter_text):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/chat/{session_id}/export")
async def api_export_chat(session_id: str, fmt: str = "txt"):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    if fmt == "md":
        return _export_md(session)
    return _export_txt(session)


@router.get("/chat/{session_id}/api-log")
async def api_export_log(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    return {
        "session_id": session_id,
        "log": session.api_log,
    }


# ---------------------------------------------------------------------------
# Export helpers
# ---------------------------------------------------------------------------

def _export_txt(session: Session) -> dict:
    lines = [f"LLMChats3 Conversation Log", "=" * 40, ""]
    if session.persona_a:
        lines.append(f"Participant 1: {session.persona_a.name} ({session.persona_a.display_name})")
    if session.persona_b:
        lines.append(f"Participant 2: {session.persona_b.name} ({session.persona_b.display_name})")
    lines.append("")
    for m in session.messages:
        lines.append(f"{m['speaker']}: {m['text']}")
        lines.append("")
    return {"filename": "chat_export.txt", "content": "\n".join(lines)}


def _export_md(session: Session) -> dict:
    lines = ["# LLMChats3 Conversation Log", ""]
    if session.persona_a:
        lines.append(f"**Participant 1:** {session.persona_a.name} (*{session.persona_a.display_name}*)")
    if session.persona_b:
        lines.append(f"**Participant 2:** {session.persona_b.name} (*{session.persona_b.display_name}*)")
    lines.append("\n---\n")
    for m in session.messages:
        lines.append(f"**{m['speaker']}:** {m['text']}")
        lines.append("")
    return {"filename": "chat_export.md", "content": "\n".join(lines)}
