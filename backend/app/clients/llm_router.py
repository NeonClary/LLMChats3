from __future__ import annotations

import logging
from typing import Any

from app.clients.openai_compat import openai_chat_completion
from app.clients.hana_client import hana_client

LOG = logging.getLogger(__name__)


async def chat_completion(
    resolved: dict,
    messages: list[dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1024,
    timeout: float | None = None,
) -> dict[str, Any]:
    """Unified LLM call that routes Neon models through HANA and others through OpenAI-compat."""
    if resolved.get("is_neon"):
        return await _call_hana(resolved, messages, temperature, max_tokens)
    return await openai_chat_completion(
        base_url=resolved["base_url"],
        api_key=resolved["api_key"],
        model=resolved["model_id"],
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
    )


async def _call_hana(
    resolved: dict,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    system_context = ""
    query = ""
    history: list[tuple[str, str]] = []

    for msg in messages:
        if msg["role"] == "system":
            system_context = msg["content"]
        elif msg["role"] == "user":
            query = msg["content"]
        elif msg["role"] == "assistant":
            history.append(("assistant", msg["content"]))

    if system_context:
        query = f"[Context: {system_context}]\n\n{query}"

    builtin_sp = hana_client.get_persona_system_prompt(
        resolved["hana_model_id"], resolved["persona_name"]
    )

    try:
        result = await hana_client.get_inference(
            query=query,
            model_id=resolved["hana_model_id"],
            persona_name=resolved["persona_name"],
            system_prompt=builtin_sp,
            history=history if history else None,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return {
            "response": result.get("response", ""),
            "elapsed_seconds": result.get("elapsed_seconds", 0),
            "model": resolved["model_id"],
        }
    except Exception as exc:
        LOG.exception("HANA inference failed for %s: %s", resolved["model_id"], exc)
        return {
            "response": f"[Error]: {exc}",
            "elapsed_seconds": 0,
            "model": resolved["model_id"],
            "error": True,
        }
