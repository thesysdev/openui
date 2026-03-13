<div align="center">

<img src="./assets/banner.png" alt="OpenUI — The Open Standard for Generative UI" width="100%">

# OpenUI — The Open Standard for Generative UI

[![Build](https://github.com/thesysdev/openui/actions/workflows/build-js.yml/badge.svg)](https://github.com/thesysdev/openui/actions/workflows/build-js.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Discord](https://img.shields.io/badge/Discord-Chat-7289da?logo=discord&logoColor=white)](https://discord.com/invite/Pbv5PsqUSv)

</div>

OpenUI is a full-stack generative UI framework: a compact streaming-first language, a React runtime with built-in component libraries, and ready-to-use chat interfaces — that is up to 67% more token-efficient than JSON.

---

[Docs](https://openui.com) · [Playground](https://www.openui.com/playground) · [Sample Chat App](./examples/openui-chat) · [Discord](https://discord.com/invite/Pbv5PsqUSv) · [Contributing](./CONTRIBUTING.md) · [Code of Conduct](./CODE_OF_CONDUCT.md) · [Security](./SECURITY.md) · [License](./LICENSE)
---

What is OpenUI
<div align="center">

<img src="./assets/demo.gif" alt="OpenUI Demo" width="100%">
</div>

At the center of OpenUI is **OpenUI Lang**: a compact, streaming-first language for model-generated UI. Instead of treating model output as only text, OpenUI lets you define components, generate prompt instructions from that component library, and render structured UI as the model streams.

**Core capabilities:**

- **OpenUI Lang** — A compact language for structured UI generation designed for streaming output.
- **Built-in component libraries** — Charts, forms, tables, layouts, and more — ready to use or extend.
- **Prompt generation from your component library** — Generate model instructions directly from the components you allow.
- **Streaming renderer** — Parse and render model output progressively in React as tokens arrive.
- **Chat and app surface****s** – Use the same foundation for assistants, copilots, and broader interactive product flows.

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

## How it works

Your components define what the model can generate.


```mermaid
flowchart LR
    A["Component Library"] --> B["System Prompt"]
    B --> C["LLM"]
    C --> D["OpenUI Lang Stream"]
    D --> E["Renderer"]
    E --> F["Live UI"]
```

1. Define or reuse a component library.
2. Generate a system prompt from that library.
3. Send that prompt to your model.
4. Stream OpenUI Lang output back to the client.
5. Render the output progressively with Renderer.

Try it yourself in the [Playground](https://www.openui.com/playground) — generate UI live with the default component library.

## Packages

| Package                     | Description                                                               |
| :-------------------------- | :------------------------------------------------------------------------ |
| `@openuidev/react-lang`     | Core runtime — component definitions, parser, renderer, prompt generation |
| `@openuidev/react-headless` | Headless chat state, streaming adapters, message format converters        |
| `@openuidev/react-ui`       | Prebuilt chat layouts and two built-in component libraries                |
| `@openuidev/cli`            | CLI for scaffolding apps and generating system prompts                    |


```bash
npm install @openuidev/react-lang @openuidev/react-ui
```

## Why OpenUI Lang

OpenUI Lang is designed for model-generated UI that needs to be both structured and streamable.

- **Streaming output** — Emit UI incrementally as tokens arrive.
- **Token efficiency** — Up to 67% fewer tokens than equivalent JSON (see [benchmarks](./benchmarks)).
- **Controlled rendering** — Restrict output to the components you define and register.
- **Typed component contracts** — Define component props and structure up front with Zod schemas.

### Token efficiency benchmarks

Measured with `tiktoken` (GPT-5 encoder). OpenUI Lang vs two JSON-based streaming formats across seven UI scenarios:

| Scenario           | Vercel JSON-Render | Thesys C1 JSON | OpenUI Lang |  vs Vercel |      vs C1 |
| ------------------ | -----------------: | -------------: | ----------: | ---------: | ---------: |
| simple-table       |                340 |            357 |         148 |     -56.5% |     -58.5% |
| chart-with-data    |                520 |            516 |         231 |     -55.6% |     -55.2% |
| contact-form       |                893 |            849 |         294 |     -67.1% |     -65.4% |
| dashboard          |               2247 |           2261 |        1226 |     -45.4% |     -45.8% |
| pricing-page       |               2487 |           2379 |        1195 |     -52.0% |     -49.8% |
| settings-panel     |               1244 |           1205 |         540 |     -56.6% |     -55.2% |
| e-commerce-product |               2449 |           2381 |        1166 |     -52.4% |     -51.0% |
| **TOTAL**          |          **10180** |       **9948** |    **4800** | **-52.8%** | **-51.7%** |

Full methodology and reproduction steps in `benchmarks/`.

## Documentation

Detailed documentation is available at [openui.com](https://openui.com).

## Repository structure


```
openui/
├── packages/
│   ├── react-lang/       # Core runtime (parser, renderer, prompt generation)
│   ├── react-headless/   # Headless chat state & streaming adapters
│   ├── react-ui/         # Prebuilt chat layouts & component libraries
│   └── openui-cli/       # CLI for scaffolding & prompt generation
├── examples/
│   └── openui-chat/      # Full working example app (Next.js)
├── docs/                 # Documentation site (openui.com)
└── benchmarks/           # Token efficiency benchmarks
```

Good places to start:

- [openui.com](https://openui.com) for the full docs
- `examples/openui-chat` for a working app
- `CONTRIBUTING.md` if you want to contribute

## Community

- [Discord](https://discord.com/invite/Pbv5PsqUSv) — Ask questions, share what you're building
- [GitHub Issues](https://github.com/thesysdev/openui/issues) — Report bugs or request features

## Contributing

Contributions are welcome. See `CONTRIBUTING.md` for contribution guidelines and ways to get involved.

## License

This project is available under the terms described in `LICENSE`.
