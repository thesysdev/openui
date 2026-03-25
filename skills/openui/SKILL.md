---
name: openui
description: "Build generative UI apps with OpenUI and OpenUI Lang — the token-efficient open standard for LLM-generated interfaces. Use when mentioning OpenUI, @openuidev, generative UI, streaming UI from LLMs, component libraries for AI, or replacing json-render/A2UI. Covers scaffolding, defineComponent, system prompts, the Renderer, and debugging OpenUI Lang output."
---

# OpenUI — The Open Standard for Generative UI

OpenUI is a full-stack Generative UI framework by Thesys. At its center is **OpenUI Lang**: a compact, line-oriented language designed for LLMs to generate user interfaces, up to 67% more token-efficient than JSON-based alternatives.

Instead of treating LLM output as only text/markdown, OpenUI lets you define a component library, auto-generate a system prompt from it, and render structured UI progressively as the model streams.

## Core Architecture

OpenUI has four building blocks that form a pipeline:

1. **Library** — Components defined with Zod schemas + React renderers via `defineComponent`. This is the contract between app and AI: it constrains what the LLM can generate.
2. **Prompt Generator** — `library.prompt()` converts the library into a system prompt with syntax rules, component signatures, and streaming guidelines.
3. **Parser** — Parses OpenUI Lang line-by-line (streaming-compatible) into a typed element tree. Validates against the library's JSON Schema.
4. **Renderer** — The `<Renderer />` React component maps parsed elements to your React components, rendering progressively as the stream arrives.

```
Component Library → System Prompt → LLM → OpenUI Lang Stream → Parser → Renderer → Live UI
```

## OpenUI Lang Overview

OpenUI Lang is a compact, declarative, line-oriented DSL. The LLM generates this instead of JSON or markdown.

### Syntax Rules (Critical)

1. **One statement per line:** `identifier = Expression`
2. **Root entry point:** The first statement MUST assign to the identifier `root`.
3. **Top-down generation:** Write Layout → Components → Data for best streaming performance.
4. **Positional arguments:** Arguments map to component props by position, determined by key order in the Zod schema.
5. **Forward references (hoisting):** An identifier can be referenced before it's defined — the renderer shows a skeleton/placeholder until the definition arrives.

Example:

```
root = Stack([header, stats])
header = TextContent("Q4 Dashboard", "large-heavy")
stats = Grid([s1, s2])
s1 = StatCard("Revenue", "$1.2M", "up")
s2 = StatCard("Users", "450k", "flat")
```

## Documentation

For comprehensive reference, fetch the full documentation:

```
https://www.openui.com/llms-full.txt
```

For a topic index (page titles and descriptions only):

```
https://www.openui.com/llms.txt
```

When you need detail on a specific topic, fetch the relevant page:

| Topic                      | URL                                                         |
| -------------------------- | ----------------------------------------------------------- |
| Quickstart & scaffolding   | https://www.openui.com/docs/openui-lang/quickstart          |
| Defining components        | https://www.openui.com/docs/openui-lang/defining-components |
| System prompts             | https://www.openui.com/docs/openui-lang/system-prompts      |
| Renderer                   | https://www.openui.com/docs/openui-lang/renderer            |
| Language specification     | https://www.openui.com/docs/openui-lang/specification       |
| Interactivity              | https://www.openui.com/docs/openui-lang/interactivity       |
| Built-in component library | https://www.openui.com/docs/openui-lang/standard-library    |

## SDK Packages

| Package                     | Purpose                                                                 | When to use               |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `@openuidev/react-lang`     | Core: defineComponent, createLibrary, Renderer, parser                  | Every OpenUI project      |
| `@openuidev/react-headless` | Chat state: ChatProvider, hooks, streaming adapters (OpenAI, AG-UI)     | Custom chat UI            |
| `@openuidev/react-ui`       | Prebuilt layouts (Copilot, FullScreen, BottomTray) + built-in libraries | Fast path to working chat |

## Scaffolding

```bash
npx @openuidev/cli@latest create --name my-genui-app
cd my-genui-app
echo "OPENAI_API_KEY=sk-your-key-here" > .env
npm run dev
```

## Framework Integration

OpenUI works with any LLM framework. The scaffolded app uses Next.js with the OpenAI SDK. Integration patterns exist for: Vercel AI SDK, LangChain, CrewAI, OpenAI Agents SDK, Anthropic Agents SDK, Google ADK, and any framework that produces a text stream.

The core integration point is always the same: send the system prompt (from `library.prompt()`) to your LLM, then feed the streamed text into `<Renderer />`.
