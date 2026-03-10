# OpenUI

[Docs](https://openui.com) · [Example App](./examples/openui-chat) · [Discord](https://discord.com/invite/Pbv5PsqUSv) · [Contributing](./CONTRIBUTING.md) · [License](./LICENSE)

Build **LLM-powered user interfaces** with OpenUI Lang, streaming rendering, and generative UI.

OpenUI gives you a fast path from model output to structured, streamable UI in React.

<!-- Hero image placeholder -->
<!-- [![OpenUI Hero](./docs/static/readme/hero.png)](https://openui.com) -->

---

## What is OpenUI

OpenUI is an open source toolkit for building AI-native product interfaces in React.

At the center of OpenUI is **OpenUI Lang**: a compact, streaming-first language for model-generated UI. Instead of treating model output as only text, OpenUI lets you define components, generate prompt instructions from that component library, and render structured UI as the model streams.

**Core capabilities:**

- **OpenUI Lang** — A compact language for structured UI generation designed for streaming output.
- **Built-in component libraries** — Charts, forms, tables, layouts, and more — ready to use or extend.
- **Prompt generation from your component library** — Generate model instructions directly from the components you allow.
- **Streaming renderer** — Parse and render model output progressively in React as tokens arrive.
- **Chat and app surfaces** - Use the same foundation for assistants, copilots, and broader interactive product flows.


<!-- Product overview video placeholder -->
<!-- https://openui.com/assets/readme/overview-demo.mp4 -->

## Quick Start

```bash
npx @openuidev/cli@latest create --name genui-chat-app
cd genui-chat-app
echo "OPENAI_API_KEY=sk-your-key-here" > .env
npm run dev
```

This is the fastest way to start with OpenUI. The scaffolded app gives you an end-to-end starting point with streaming, built-in UI, and OpenUI Lang support.

What this gives you:

- **OpenUI Lang support** - Start with structured UI generation built into the app flow.
- **Library-driven prompts** - Generate instructions from your allowed component set.
- **Streaming support** - Update the UI progressively as output arrives.
- **Working app foundation** - Start from a ready-to-run example instead of wiring everything manually.

[Detailed docs at openui.com ->](https://openui.com)

<!-- Quick start demo placeholder -->
<!-- ![Quick Start Demo](./docs/static/readme/quick-start.gif) -->

## How it works

OpenUI turns your component library into a contract the model can target.

1. Define or reuse a component library.
2. Generate a system prompt from that library.
3. Send that prompt to your model.
4. Stream OpenUI Lang output back to the client.
5. Render the structured output progressively with `<Renderer />`.

This creates a direct path from model output to UI without relying on brittle text parsing or ad hoc JSON rendering layers.

<!-- Architecture diagram placeholder -->
<!-- ![OpenUI Architecture](./docs/static/readme/architecture.png) -->

## Packages

| Package | Description |
| :--- | :--- |
| [`@openuidev/react-lang`](./packages/react-lang) | Core runtime — component definitions, parser, renderer, prompt generation |
| [`@openuidev/react-headless`](./packages/react-headless) | Headless chat state, streaming adapters, message format converters |
| [`@openuidev/react-ui`](./packages/react-ui) | Prebuilt chat layouts and two built-in component libraries |
| [`@openuidev/cli`](./packages/openui-cli) | CLI for scaffolding apps and generating system prompts |

```bash
npm install @openuidev/react-lang @openuidev/react-ui
```

## Why OpenUI Lang

OpenUI Lang is designed for model-generated UI that needs to be both structured and streamable.

- **Streaming output** — Emit UI incrementally as tokens arrive.
- **Token efficiency** — Up to 67% fewer tokens than equivalent JSON.
- **Controlled rendering** — Restrict output to the components you define and register.
- **Typed component contracts** — Define component props and structure up front with Zod schemas.

## Built for real product surfaces

OpenUI is intended for more than demo chat windows. Use it to build:

- Assistants that render forms, charts, tables, and actions
- Embedded copilots inside existing products
- Full-page AI workflows
- Custom applications backed by your own model APIs

## Documentation

Detailed documentation is available at [openui.com](https://openui.com).

## Explore the repo

This repository contains the OpenUI monorepo, including the implementation, example app, and documentation source.

Good places to start:

- [openui.com](https://openui.com) for the full docs
- [`examples/openui-chat`](./examples/openui-chat) for a working app
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) if you want to contribute

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for contribution guidelines and ways to get involved.

## License

This project is available under the terms described in [`LICENSE`](./LICENSE).
