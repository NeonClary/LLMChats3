from __future__ import annotations

import logging

from app.clients.openai_compat import openai_chat_completion
from app.config import settings

LOG = logging.getLogger(__name__)

ROLE_GENERATION_PROMPT = (
    'Write a concise but highly informative 3-5 sentence prompt which when used as the '
    '"role" input will enable an LLM to respond in a way that sounds like the authentic '
    "voice of the person/character whose writing and/or speaking samples are provided here. "
    "Consider personality, speech patterns, identity, interests, motivation, and "
    "conversational style. Integrate the identity statement, profile information and name "
    "provided.\n"
    "The name is: {name}\n"
    "The identity statement is: {identity}\n"
    "The profile is: {profile}\n"
    "Here are the writing and/or speech samples: {samples}"
)


async def generate_role_prompt(
    model_id: str,
    name: str,
    profile: str,
    identity: str,
    samples: str,
) -> dict:
    """Use the selected LLM to distill persona inputs into a role prompt."""
    resolved = settings.resolve_model(model_id)
    if not resolved:
        return {"role_prompt": "", "error": f"Unknown model: {model_id}"}

    prompt_text = ROLE_GENERATION_PROMPT.format(
        name=name or "(not provided)",
        identity=identity or "(not provided)",
        profile=profile or "(not provided)",
        samples=samples or "(not provided)",
    )

    messages = [
        {"role": "system", "content": "You are a helpful assistant that creates character prompts."},
        {"role": "user", "content": prompt_text},
    ]

    result = await openai_chat_completion(
        base_url=resolved["base_url"],
        api_key=resolved["api_key"],
        model=resolved["model_id"],
        messages=messages,
        temperature=0.7,
        max_tokens=512,
    )

    if result.get("error"):
        return {"role_prompt": "", "error": result["response"]}

    return {
        "role_prompt": result["response"],
        "elapsed_seconds": result["elapsed_seconds"],
    }
