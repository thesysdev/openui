This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start), using a [Vercel Eve](https://github.com/vercel/eve) agent.

## Setup

The CLI writes `.env` for you. If you cloned the generated project elsewhere,
run `pnpm generate:apiKey` to mint `THESYS_API_KEY`, then add `DEMO_USER_ID`
and `APP_ID`.

Optional: set `OPENUI_MODEL` to a Cloud model id such as
`google/gemini-3.6-flash-free`. An unknown id fails when the Eve agent loads —
the app will not sit idle until the first message.

## Prerequisites

- Node.js 24

## Getting Started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Ask "What's the weather in
Berlin?" to exercise the included Eve tool.

## Conversation storage

OpenUI Cloud is the durable conversation store, wired the same way as the other
Cloud scaffolds: `useOpenuiCloudStorage()` with a short-lived token from
`/api/frontend-token` and `features: { artifact: false }`. Each Eve turn
appends to that conversation with `conversation: threadId` and `store: true`.
Provider-executed artifact and search tools are not attached.

## Switching models

This scaffold has no model dropdown. Set `OPENUI_MODEL` in `.env`. The built-in
ids live in `src/lib/models.ts`.

## Eve commands

The normal development command is `pnpm dev`. The package also exposes Eve
directly:

```bash
pnpm eve:dev
pnpm eve:build
pnpm eve:start
```

## SDK packages

- `@openuidev/lang-core` — `generateSystemPrompt({ cloud: true })` used by Eve instructions.
- `@openuidev/thesys` — `chatLibrary` and Cloud conversation storage.
- `@openuidev/react-ui` — `AgentInterface`, `eveAdapter`.

A devtools widget is available automatically in development.

## Learn More

- [OpenUI Documentation](https://openui.com/docs)
- [OpenUI GitHub repository](https://github.com/thesysdev/openui)
- [Vercel Eve](https://github.com/vercel/eve)
