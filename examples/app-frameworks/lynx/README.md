# OpenUI Lynx Example

A full-stack chat application that streams model-generated [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) into a native [ReactLynx](https://lynxjs.org) interface. It uses Lynx's official OpenUI runtime, [`@lynx-js/genui/openui`](https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui), and its OpenUI Chat component library.

## Architecture

```
┌──────────────────────────────┐        ┌────────────────────────────────┐
│  ReactLynx chat app          │  HTTP  │  Next.js backend               │
│                              │ ──────►│                                │
│  • Native message list       │        │  • /api/chat  (POST)           │
│  • Starters and composer     │◄────── │  • OpenUI Chat system prompt   │
│  • <OpenUiRenderer />        │ stream │  • OpenUI Gateway validation   │
│  • @ToAssistant round-trips  │        │  • CORS for the web preview    │
└──────────────────────────────┘        └────────────────────────────────┘
             :8080                                   :3001
```

The client renders with `createOpenUiChatLibrary()` and the backend exports the same Chat library with `createOpenUiChatPromptLibrary()`. Both come from the same `@lynx-js/genui` version, so the prompt the model receives and the components the client renders share one contract.

## Project structure

```
lynx/
├── app/                          # Standalone ReactLynx application (Rspeedy)
│   ├── lynx.config.ts            # Web and native builds, LAN backend URL
│   └── src/
│       ├── App.tsx               # Chat shell, streaming, action handling
│       ├── App.css               # Chat layout styles
│       ├── library.ts            # createOpenUiChatLibrary(), created once
│       ├── config.ts             # Backend URL selection
│       ├── useStreamingChat.ts   # Lynx streaming fetch reader
│       └── types.ts              # View and API message types
└── backend/                      # Standalone Next.js API server
    ├── env.example
    └── src/app/api/chat/route.ts # Streaming OpenUI Lang endpoint
```

The app and the backend are separate install units, so either can be installed, verified, or copied without a workspace.

## Getting started

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm
- An OpenUI Cloud API key (<https://console.thesys.dev/keys>)
- [Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html#preview-on-mobile) for a native device preview

### 1. Install dependencies

From this directory, install each standalone application:

```bash
(cd backend && pnpm install --ignore-workspace)
(cd app && pnpm install --ignore-workspace)
```

### 2. Configure the backend

```bash
cp backend/env.example backend/.env.local
```

Add your key to `backend/.env.local`:

```
THESYS_API_KEY=sk-th-...
```

### 3. Start the backend

```bash
(cd backend && pnpm dev)
```

The API is available at `http://localhost:3001`, and `http://localhost:3001` also serves a status page.

### 4. Start the app

```bash
(cd app && pnpm dev)
```

Rspeedy prints a QR code for Lynx Explorer. The web preview is at <http://localhost:8080/__web_preview?casename=main.web.bundle>. The first non-internal LAN address is compiled into the bundle as the backend URL, so a phone on the same network reaches the development machine. Override it with `PUBLIC_OPENUI_API_URL` in `app/.env`, or for one run:

```bash
OPENUI_API_URL=http://10.0.2.2:3001/api/chat pnpm --prefix app dev
```

Only variables prefixed with `PUBLIC_` are bundled into the app. Never put the provider API key in the client environment.

## What the example demonstrates

- **Cumulative text, not deltas.** `useStreamingChat` accumulates the response and passes the full text to `<OpenUiRenderer response={...} />` with `isStreaming`, which is the contract the renderer's incremental parser expects.
- **One library on both sides.** `app/src/library.ts` builds the client library; the route exports the matching prompt library and hands its spec to the Gateway, which validates and corrects OpenUI Lang while it streams.
- **Plain text streaming.** The route returns `text/plain` chunks rather than SSE, which maps directly to Lynx's streaming body reader (`lynxExtension: { useStreaming: true }`).
- **Actions round-trip.** `@ToAssistant(...)` becomes a real user turn with the existing history; `@OpenUrl(...)` is surfaced to the host so an app can connect its own navigation bridge.
- **Stable message state.** The list uses `recyclable={false}` so generated component state stays mounted while the conversation grows.
- **Theming.** The app imports Luna styles and the OpenUI token adapter, and wraps the renderer in `luna-light`.

## Scripts

| Directory  | Script                 | Description                               |
| ---------- | ---------------------- | ----------------------------------------- |
| `app/`     | `pnpm dev`             | Start the Rspeedy dev server              |
| `app/`     | `pnpm build`           | Build the web and Lynx bundles            |
| `backend/` | `pnpm dev`             | Start the Next.js API server              |
| `backend/` | `pnpm generate:apiKey` | Write an OpenUI Cloud key to `.env.local` |

## Configure the model

`backend/.env.local` accepts:

```
THESYS_API_KEY=sk-th-...
# OPENUI_MODEL=openai/gpt-5
```

The default model is `google/gemini-3.6-flash-free`. `OPENUI_GATEWAY_URL` points the route at another Gateway deployment.

## Using your own model instead of the Gateway

The Gateway is optional. To call a model directly, build the prompt from the same Chat library and send it as the system message:

```ts
import { createOpenUiChatPromptLibrary } from "@lynx-js/genui/openui/chat/agent";

const systemPrompt = createOpenUiChatPromptLibrary().prompt();
```

`buildOpenUiSystemPrompt()` from `@lynx-js/genui/openui/prompt` does the same for the default Stack catalog. Keep the prompt library and the client library on the same component set; see the [OpenUI system prompts guide](https://github.com/lynx-family/lynx-stack/blob/main/packages/genui/openui/docs/system-prompts.md).

## Verify

```bash
(cd backend && pnpm verify)
(cd app && pnpm verify)
```

## Learn more

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview)
- [Lynx OpenUI guide](https://lynxjs.org/next/react/genui/openui.html)
- [`@lynx-js/genui/openui` docs](https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui/docs)
- [OpenUI Gateway](https://www.openui.com/docs/gateway)
