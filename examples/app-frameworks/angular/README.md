# Angular chat with OpenUI

A standalone Angular chat example using [`@openuidev/angular-lang`](https://www.npmjs.com/package/@openuidev/angular-lang) and [NG-ZORRO X](https://github.com/NG-ZORRO/ng-zorro-antd). Ask a question and receive streamed, model-generated charts, tables, checklists, forms, and follow-up suggestions.

NG-ZORRO X owns the conversation list, message bubbles, composer, auto-scroll, and send/stop controls. OpenUI renders each assistant bubble through its `messageRender` template. Angular signals manage conversation history and streaming state. This demonstrates the Angular runtime introduced in [#1167](https://github.com/thesysdev/openui/pull/1167), using published packages without a repository build.

## Prerequisites

- Node.js **22.22.3+, 24.15.0+, or 26.x**, within those supported major versions ([Angular compatibility](https://angular.dev/reference/versions)). Node 24 LTS is recommended.
- pnpm, npm, or Bun as the package manager. The backend and development scripts run on Node.
- An OpenAI API key with access to the configured model.

The example pins OpenUI Angular and Lang Core to **0.3.0**, NG-ZORRO Ant Design to **22.1.0**, and NG-ZORRO X to **0.6.0-alpha.1**. The NG-ZORRO X alpha is used for Angular 22 compatibility. Angular and its build tools resolve through the included lockfiles. The example is zoneless and does not need `zone.js` or `@angular/platform-browser-dynamic`.

## Run

```bash
cd examples/app-frameworks/angular
pnpm install --ignore-workspace
# or: npm ci
# or: bun install
```

Create a gitignored `.env.local` in this directory:

```dotenv
OPENAI_API_KEY=your_key_here
# Optional, defaults shown:
OPENAI_MODEL=gpt-5.2
OPENAI_BASE_URL=https://api.openai.com/v1
```

```bash
pnpm dev
# or: npm run dev
# or: bun run dev
```

Open **http://127.0.0.1:4200**. The development command generates the system prompt, starts the loopback-only backend on port 4300, and starts Angular with an `/api` proxy. Only the backend reads the key; browser requests contain conversation messages.

For different ports, pass `PORT` and `API_PORT` to the development command:

```bash
PORT=4220 API_PORT=4320 pnpm dev
```

You can instead set `OPENUI_ENV_FILE` to an existing server-side environment file. Shell environment variables take precedence over values loaded from files. These settings are for a local example; deployment needs an authenticated backend, request limits, and a production frontend host.

## Try it

- **Chart:** “Show quarterly revenue as a labeled bar chart: Q1 120, Q2 180, Q3 150, Q4 240. End with two relevant follow-up suggestions.” The response should stream into a labeled chart. Click a suggestion to send its text as the next turn in the same conversation.
- **Form:** “Create a validated project estimate form with fields for project name, team size, and notes. Add a Submit button that sends the completed values to you.” An empty submission is blocked by native required-field validation. Fill in `Aurora-731`, `7`, and `Prioritize accessibility and charts`, then submit. The next assistant response should use those values.
- **Conversation controls:** stop an in-flight response, retry the last response, start another conversation, and switch back using the sidebar.

Conversation messages persist in this browser's local storage. Form drafts and checklist selections are local component state and reset when their message is remounted or the page reloads. The model has no web search or external-action tools. Generated sample data is labeled illustrative.

## How it works

```text
NG-ZORRO X sender → Angular send() → /api/chat → model
                                              ↓
NG-ZORRO X assistant bubble ← OpenUI Renderer ← streamed OpenUI Lang
           ↓
follow-up / form action → the same Angular send() path
```

- `src/app/app.ts` and `app.html` connect `NxConversations`, `NxBubbleList`, and `NxSender` to Angular state. The assistant bubble's `messageRender` template contains `<openui-renderer>`.
- `src/app/openui/schema.ts` is the shared source of component names, ordered Zod props, and prompt options. `library.ts` binds those definitions to Angular components. `server/library.mjs` uses the same schemas with the framework-independent Lang Core package to generate the prompt and validate final output.
- `src/app/openui/components.ts` implements the small component library. Follow-ups call `triggerAction`; forms serialize their title and edited, labeled values into the same action path. `(action)` becomes one ordinary user turn and one backend request.
- `server/index.mjs` validates the conversation envelope, streams an OpenAI-compatible completion, and checks the final OpenUI program. It allows one correction attempt for parser errors or unresolved references. Disconnects abort upstream work.
- `server/transport.mjs` handles provider SSE framing, Unicode, aborts, truncation, and provider errors without forwarding private diagnostic bodies.
- `src/styles.css` supplies a shared CSS variable theme to the chat shell and rendered Angular descendants. Angular Lang has no React `ThemeProvider` or `AgentInterface`; NG-ZORRO X supplies the native Angular shell.

`pnpm generate` regenerates `generated/system-prompt.txt` and the library schema. `dev`, `build`, `test`, and `verify` do this automatically. Keep generated files out of Git.

## Verify

No credentials or live model calls are needed:

```bash
pnpm verify
# or: npm run verify
# or: bun run verify
pnpm format:check
```

Verification checks action serialization, request validation, provider streaming/error handling, and canned OpenUI parsing, then compiles the Angular application with strict template checks. The production frontend is written to `dist/openui-angular/browser`; the backend remains a separate Node process.

For a live check, exercise the chart, follow-up, form, stop/retry, and conversation controls above. A completed response should have no renderer errors in its optional “View OpenUI source” disclosure and the backend should report `parser errors=0`.

## Extend

Add a Zod definition in `schema.ts`, implement the Angular component, and register it in `library.ts`. The generated prompt and parser schema will follow that same definition. Keep strings and arrays tolerant of partial streamed props. Use the [Angular API reference](https://www.openui.com/docs/api-reference/angular-lang) for nested rendering, form state, validation, and tool providers.
