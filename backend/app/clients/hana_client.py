from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config import settings

LOG = logging.getLogger(__name__)


class HanaClient:
    """Handles HANA API authentication, model/persona discovery, and inference."""

    def __init__(self) -> None:
        self._base = settings.hana_base_url.rstrip("/")
        self._access_token: str = ""
        self._refresh_token: str = ""
        self._token_expiry: float = 0
        self._client = httpx.AsyncClient(timeout=30.0)
        self._persona_cache: dict[str, str | None] = {}

    async def authenticate(self) -> None:
        resp = await self._client.post(
            f"{self._base}/auth/login",
            json={
                "username": settings.hana_username,
                "password": settings.hana_password,
                "token_name": "LLMChats3",
                "client_id": "llm-chat-tool",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        self._access_token = data["access_token"]
        self._refresh_token = data["refresh_token"]
        self._token_expiry = data.get("expiration", time.time() + 3600)
        LOG.info("HANA auth success (user=%s)", data.get("username"))

    async def _ensure_token(self) -> None:
        if time.time() >= self._token_expiry - 60:
            try:
                resp = await self._client.post(
                    f"{self._base}/auth/refresh",
                    json={
                        "access_token": self._access_token,
                        "refresh_token": self._refresh_token,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                self._access_token = data["access_token"]
                self._refresh_token = data["refresh_token"]
                self._token_expiry = data.get("expiration", time.time() + 3600)
                LOG.info("HANA token refreshed")
            except Exception:
                LOG.warning("Token refresh failed, re-authenticating")
                await self.authenticate()

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

    async def get_models(self) -> list[dict[str, Any]]:
        await self._ensure_token()
        resp = await self._client.post(
            f"{self._base}/brainforge/get_models",
            headers=self._headers,
            json={},
        )
        resp.raise_for_status()
        data = resp.json()
        models = []
        for m in data.get("models", []):
            model_id = f"{m['name']}@{m['version']}"
            personas = []
            for p in m.get("personas", []):
                pname = p.get("persona_name", "")
                sp = p.get("system_prompt") or ""
                cache_key = f"{model_id}:{pname}"
                self._persona_cache[cache_key] = sp if sp else None
                personas.append({
                    "id": p.get("id", p.get("persona_name", "")),
                    "persona_name": pname,
                    "description": p.get("description"),
                    "system_prompt": p.get("system_prompt"),
                    "enabled": p.get("enabled", True),
                })
            models.append({
                "name": m["name"],
                "version": m["version"],
                "model_id": model_id,
                "personas": personas,
            })
        return models

    def get_persona_system_prompt(self, model_id: str, persona_name: str) -> str | None:
        """Look up a persona's built-in system_prompt from the cache."""
        return self._persona_cache.get(f"{model_id}:{persona_name}")

    async def get_inference(
        self,
        query: str,
        model_id: str,
        persona_name: str,
        system_prompt: str | None = None,
        history: list[tuple[str, str]] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        await self._ensure_token()
        hist = [[role, content] for role, content in (history or [])]

        persona_payload: dict[str, Any] = {"persona_name": persona_name}
        if system_prompt:
            persona_payload["system_prompt"] = system_prompt

        body = {
            "query": query,
            "history": hist,
            "persona": persona_payload,
            "model": model_id,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "extra_body": {},
            "llm_name": model_id.split("@")[0] if "@" in model_id else model_id,
            "llm_revision": model_id.split("@")[1] if "@" in model_id else "",
        }

        t0 = time.time()
        resp = await self._client.post(
            f"{self._base}/brainforge/get_inference",
            headers=self._headers,
            json=body,
        )
        elapsed = time.time() - t0
        resp.raise_for_status()
        data = resp.json()
        return {
            "response": data.get("response", ""),
            "elapsed_seconds": round(elapsed, 2),
            "finish_reason": data.get("finish_reason", "stop"),
        }

    async def close(self) -> None:
        await self._client.aclose()


hana_client = HanaClient()
