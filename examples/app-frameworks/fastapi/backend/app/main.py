"""Minimal FastAPI backend — streams OpenUI Cloud completions as NDJSON."""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, APIStatusError, AsyncOpenAI
from starlette.responses import JSONResponse, StreamingResponse

load_dotenv()

# Embed client: Chat Completions → POST /v1/embed/chat/completions
client = AsyncOpenAI(
    api_key=os.environ.get("THESYS_API_KEY"),
    base_url="https://api.thesys.dev/v1/embed",
)
MODEL = os.environ.get("OPENUI_MODEL", "google/gemini-3.6-flash-free")

SPEC_PATH = Path(__file__).resolve().parents[2] / "frontend" / "src" / "generated" / "spec.json"


# Without these, a request like "when I submit, show a summary" gets a pre-written
# summary revealed locally, so the user's entries never reach the assistant.
FORM_RULES = (
    "A Form's submit button must send the entries to you: its action must be @ToAssistant(...), "
    'e.g. Button("Plan my trip", @ToAssistant("Plan my trip"), "primary"), never @Set or another '
    "local-only action. Don't put what the form produces (a summary, plan or itinerary) in the "
    "same reply, hidden or not; write it in your next reply from the values the user submitted.\n"
    "When a field should only appear for a certain answer (e.g. a company name only for "
    "Business trips), bind the deciding field to a $variable with its value argument, e.g. "
    'RadioGroup("tripType", items, "Leisure", { required: true }, $tripType), and show the '
    'field with $tripType == "Business" ? companyField : null.'
)


def cloud_system_prompt() -> str:
    """Same payload as generateSystemPrompt({ cloud: true, library, instructions }) from @openuidev/lang-core."""
    if not SPEC_PATH.is_file():
        raise RuntimeError(f"Missing {SPEC_PATH}. From frontend/, run: pnpm generate")
    spec = json.loads(SPEC_PATH.read_text())
    chat_library = {
        key: spec[key]
        for key in ("schema", "root", "componentGroups", "id")
        if key in spec and spec[key] is not None
    }
    return "]]>openui:config\n" + json.dumps({"chatLibrary": chat_library}) + "\n" + FORM_RULES


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/api/chat")
async def chat(body: dict):
    messages = body.get("messages") or []
    # A rejected key, rate limit, or bad request fails here, before streaming starts.
    # Return it as JSON so the chat shows the real reason instead of a bare 500.
    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": cloud_system_prompt()}, *messages],
            stream=True,
        )
    except APIStatusError as error:
        body = error.body if isinstance(error.body, dict) else {}
        detail = body.get("error", body) if isinstance(body.get("error", body), dict) else body
        message = detail.get("message") if isinstance(detail.get("message"), str) else error.message
        return JSONResponse({"error": message}, status_code=error.status_code)
    except APIError as error:
        return JSONResponse({"error": error.message}, status_code=502)

    async def ndjson_stream():
        async for chunk in stream:
            yield chunk.model_dump_json(exclude_none=True, exclude_unset=True) + "\n"

    return StreamingResponse(ndjson_stream(), media_type="application/x-ndjson")
