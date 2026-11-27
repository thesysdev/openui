# openui-server

Server utilities for [OpenUI Cloud](https://openui.com), in Python: frontend tokens, your users' conversations and saved artifacts, live dashboards built from your own data tools, and Autofix for model output in OpenUI Lang. It's the Python twin of [`@openuidev/server`](https://www.npmjs.com/package/@openuidev/server) and is released with it, at the same version.

```bash
pip install openui-server
```

Python 3.11 or later. The only dependency is `httpx`.

## Quick start

```python
from openui_server import OpenUIClient

openui = OpenUIClient()  # reads THESYS_API_KEY

# Return this from your frontend token route as is.
token = openui.create_frontend_token(user_id=session.user_id)

# A conversation belongs to the user who creates it. Calls by id act as your org, so check
# the owner before using an id from the browser.
thread = openui.conversations.create(user_id=session.user_id)
openui.chat.conversations.items.create(thread.id, new_messages)  # store a turn
history = openui.chat.conversations.items.list(thread.id)  # the whole thread, for the next request
```

Use `AsyncOpenUIClient` for asyncio apps (FastAPI, LangGraph): every call is the same, awaited.

## Live dashboards

```python
import json
from openui_server import AsyncOpenUIClient, DataTool

openui = AsyncOpenUIClient()


async def get_sales(args, context):
    return await db.sales(region=args.get("region"), user=context["user_id"])


dashboards = openui.define_dashboard(
    library=json.load(open("openui.spec.json")),  # from `openui generate --spec`
    model="anthropic/claude-sonnet-4.6",
    tools={
        "get_sales": DataTool(
            description="Sales by region",
            parameters={"type": "object", "properties": {"region": {"type": "string"}}},
            execute=get_sales,
        )
    },
)

context = {"user_id": session.user_id}
reply = await dashboards.create(title="Q3 sales", prompt="Sales by region for Q3", context=context)

# Your interpreter route: the renderer sends each data request here.
result = await dashboards.interpreter.execute(await request.json(), context)
```

Agents get the dashboard tools ready-made: `await dashboards.tools(context)` returns `create_dashboard`, `edit_dashboard` and `get_dashboard` (name, description, JSON Schema, `execute`), and `dashboards.mcp_server(context)` serves the same tools as an MCP server (`pip install 'openui-server[mcp]'`).

## Autofix

```python
autofix = openui.chat.create_autofix(library=json.load(open("openui.spec.json")))

result = autofix.fix(generation=text, messages=history)

# Or wrap a Chat Completions stream: an invalid UI answer gets its repair before the stream ends.
fixed = autofix.stream(stream=openai_stream, messages=history)
response = StreamingResponse(fixed.sse(), media_type="text/event-stream")
```

The JavaScript package parses each generation locally and sends only broken ones to the Autofix API. Python has no OpenUI Lang parser, so every UI generation is checked by the API; a valid one comes back `already_valid` and isn't billed.

## Docs

The full reference is at [openui.com/docs/api-reference/server-python](https://openui.com/docs/api-reference/server-python).

## Versions

`openui-server` and `@openuidev/server` always have the same version, so `openui-server==0.6.0` has the features of `@openuidev/server@0.6.0`. A change to one goes in the other in the same release. To release a Python change, add a changeset for `@openuidev/server`: the version step bumps both.

## Develop

```bash
uv sync
uv run ruff check && uv run ruff format --check && uv run mypy
```
