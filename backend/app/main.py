from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.clients.hana_client import hana_client
from app.clients.openai_compat import close_shared_client
from app.api import models, chat

logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    LOG.info("Starting up — authenticating with HANA...")
    try:
        await hana_client.authenticate()
        LOG.info("HANA auth complete.")
    except Exception as exc:
        LOG.warning("HANA auth failed (Neon models will be unavailable): %s", exc)
    yield
    LOG.info("Shutting down — closing HTTP clients...")
    await hana_client.close()
    await close_shared_client()


app = FastAPI(title="LLMChats3", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(models.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
