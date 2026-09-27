"""Minimal FastAPI backend — streams OpenUI Cloud completions as NDJSON."""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from starlette.responses import JSONResponse, StreamingResponse

load_dotenv()

# Embed client: Chat Completions → POST /v1/embed/chat/completions
client = AsyncOpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)
MODEL = "google/gemini-3.6-flash-free"

SPEC_PATH = Path(__file__).resolve().parents[2] / "frontend" / "src" / "generated" / "spec.json"


def cloud_system_prompt() -> str:
    """Same payload as generateSystemPrompt({ cloud: true, library }) from @openuidev/lang-core."""
    if not SPEC_PATH.is_file():
        raise RuntimeError(f"Missing {SPEC_PATH}. From frontend/, run: pnpm generate")
    spec = json.loads(SPEC_PATH.read_text())
    chat_library = {
        key: spec[key]
        for key in ("schema", "root", "componentGroups", "id")
        if key in spec and spec[key] is not None
    }
    return "Forms must submit current field values to the assistant. Bind conditional fields to state; do not reveal pre-written summaries on submit.\n]]>openui:config\n" + json.dumps({"chatLibrary": chat_library})


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    messages = body.get("messages") or []
    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": cloud_system_prompt()}, *messages],
            stream=True,
        )
    except Exception as error:
        return JSONResponse({"error": str(error)}, status_code=getattr(error, "status_code", None) or 500)

    async def ndjson_stream():
        try:
            async for chunk in stream:
                yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"
        except Exception as error:
            yield json.dumps({"error": str(error)}) + "\n"
        finally:
            await stream.close()

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
