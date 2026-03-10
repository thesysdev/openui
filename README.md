# OpenUI

[Docs](https://openui.com) · [Example App](./examples/openui-chat) · [Contributing](./CONTRIBUTING.md) · [License](./LICENSE)

Build **LLM-powered user interfaces** with OpenUI Lang, streaming rendering, and generative UI.

OpenUI gives you a fast path from model output to structured, streamable UI in React.

<!-- Hero image placeholder -->
<!-- [![OpenUI Hero](./docs/static/readme/hero.png)](https://openui.com) -->

---

## What is OpenUI

OpenUI is an open source toolkit for building AI-native product interfaces in React.

At the center of OpenUI is **OpenUI Lang**: a compact, streaming-first language for model-generated UI. Instead of treating model output as only text, OpenUI lets you define components, generate prompt instructions from that component library, and render structured UI as the model streams.

**Core capabilities:**

- **OpenUI Lang** - A compact language for structured UI generation that is designed for streaming output.
- **Prompt generation from your component library** - Generate model instructions directly from the components you allow.
- **Streaming renderer** - Parse and render model output progressively in React as tokens arrive.
- **Generative UI** - Turn model output into real UI components instead of plain text responses.
- **Chat and app surfaces** - Use the same foundation for assistants, copilots, and broader interactive product flows.

<!-- Product overview video placeholder -->
<!-- https://openui.com/assets/readme/overview-demo.mp4 -->

## Quick Start

```bash
npx @openuidev/cli@latest create
cd genui-chat-app
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

## Why OpenUI Lang

OpenUI Lang is designed for model-generated UI that needs to be both structured and streamable.

It is built for:

- **Streaming output** - Emit UI incrementally as tokens arrive.
- **Token efficiency** - Use a compact representation instead of verbose JSON payloads.
- **Controlled rendering** - Restrict output to the components you define and register.
- **Typed component contracts** - Define component props and structure up front.

## Built for real product surfaces

OpenUI is intended for more than demo chat windows.

Use it to build:

- structured AI interfaces
- assistants that render forms, charts, tables, and actions
- embedded copilots inside existing products
- full-page AI workflows
- custom applications backed by your own model APIs

## Chat is one application layer

OpenUI also includes ready-made chat surfaces and integration patterns, but chat is only one way to use the platform.

If you want a complete starting point with backend wiring, streaming, and a built-in UI, use:

```bash
npx @openuidev/cli@latest create
```

From there, you can keep the built-in experience or move toward more custom OpenUI Lang-driven interfaces.

## Documentation

Detailed documentation is available at [openui.com](https://openui.com).

The docs cover:

- OpenUI Lang quick start
- component definitions and library design
- prompt generation and customization
- renderer behavior and streaming semantics
- end-to-end app setup
- backend connection patterns and API contracts

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
