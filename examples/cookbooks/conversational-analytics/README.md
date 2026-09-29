# Conversational analytics

A runnable companion to the [conversational analytics cookbook](https://www.openui.com/cookbooks/conversational-analytics). Ask a question, inspect the database tool call, and watch a chart or table take shape as the answer streams.

The example uses recorded lap times from the **2024 Miami Grand Prix**, provided by [OpenF1](https://openf1.org/docs/). It runs on Next.js, Agent Interface, OpenUI Gateway, and Node's built-in SQLite module.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
npm run prepare:data
```

Create an inference key in the [Thesys Console](https://console.thesys.dev/keys) and configure `THESYS_API_KEY` privately in `.env.local`. Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`.

```bash
npm run dev
```

Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Which five drivers set the fastest laps in Miami?”
- “Compare Norris and Verstappen lap by lap.”
- “Focus on their final ten laps.”

## How it works

1. Agent Interface sends the thread's messages to `/api/chat`.
2. The server calls OpenUI Gateway's Chat Completions API, which requests `query_lap_times` with a view, driver numbers, and lap range.
3. The server validates the arguments and queries the local SQLite snapshot.
4. `runTools()` returns the result to Gateway, and the route streams the tool calls and generated OpenUI Lang to the browser.
5. Agent Interface displays tool activity and progressively renders the visual answer.

The tool supports `fastest_laps` (one best recorded lap per driver) and `lap_times` (one to four drivers on matching lap numbers). Rankings can include all drivers by passing an empty `driver_numbers` array. The final ten race laps are 48 through 57. Comparisons include absolute times and a per-lap difference from the first selected driver, so the UI can show small differences clearly.

## Files

| File                                  | Purpose                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| `scripts/prepare-data.ts`             | Download OpenF1's race snapshot and prepare SQLite            |
| `src/lib/f1-data.ts`                  | Source validation, importer, database, and driver catalog     |
| `src/lib/tools/lap-times.ts`          | Function schema, argument validation, and read-only query     |
| `src/library.ts`                      | Shared components for the prompt and renderer                 |
| `src/lib/prompt.ts`                   | Gateway instructions and the supported data scope             |
| `src/app/api/chat/route.ts`           | Request validation, `runTools()` generation, and streaming    |
| `src/app/api/frontend-token/route.ts` | Frontend token for Gateway thread storage                     |
| `src/components/analytics-chat.tsx`   | Agent Interface, chat transport, thread storage, and starters |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## Conversations

The OpenAI SDK sends requests to `https://api.thesys.dev/v1/embed/chat/completions` using `THESYS_API_KEY`. Chat Completions does not store conversations, so Agent Interface keeps each thread's messages in memory and `fetchLLM` sends them with every question. Follow-up suggestions are sent the same way, so they build on the earlier answers.

Agent Interface stores the thread list with Gateway's [Conversations API](https://www.openui.com/docs/gateway/api/conversations) through `useOpenuiCloudStorage()`. The browser calls Gateway directly with a short-lived [frontend token](https://www.openui.com/docs/gateway/authentication#frontend-tokens) from `/api/frontend-token`, which mints it with `THESYS_API_KEY` for one local user (`DEMO_USER_ID`, default `demo-user`) and app (`APP_ID`, default `conversational-analytics-cookbook`), so the key stays on the server and the browser reaches only those threads. Chat Completions doesn't write turns to a conversation, so the chat route appends each turn, including the tool calls and their results, with `storeChatCompletionHistory()` from [`@openuidev/server`](https://www.openui.com/docs/api-reference/server#conversation-history). A stopped or failed answer still keeps the user's message. Threads stay listed after a reload, and a thread you open again loads its messages. To keep threads in your own database instead, use `restStorage`.

The chat route forwards only user questions and assistant answers from the browser. It drops browser-supplied tool calls and results, so the model sees only query results the server produced for the current question. The route runs the tool with the OpenAI SDK's [`runTools()`](https://github.com/openai/openai-node#automated-function-calls) and returns the runner's `toReadableStream()`, one JSON chunk per line, which `openAIReadableStreamAdapter()` reads. Chat Completions has no chunk for a tool result, so in a live answer **Behind the scenes** shows each call's arguments but not its result.

The app binds to loopback, and the chat and frontend-token routes accept browser requests only from its own local page. Every browser shares one local user's threads. For deployment, add [authentication](https://www.openui.com/docs/gateway/authentication), mint each frontend token for the signed-in user, check that each `threadId` belongs to that user before storing a turn in it, add rate limits to both routes, and provide persistent SQLite storage or a hosted database for the race data. Gateway receives the conversation, component/tool instructions, driver catalog, and requested query results.

## Data notes

The importer reads the `sessions`, `drivers`, and `laps` endpoints for OpenF1 session **9507**. It validates the race identity and writes `data/f1.sqlite`. Re-running preparation replaces the local snapshot. Downloaded data and credentials are ignored by Git.

Times are stored as integer milliseconds and presented as seconds or `m:ss.sss`. Untimed laps remain missing. The marker after lap 57 is omitted. Comparisons use only lap numbers with a recorded time for every selected driver, listing any omitted laps in the result. Slow laps are retained. These are recorded times, not an official ruling on lap validity; lap times alone do not establish why a driver slowed.

Data is fetched from [OpenF1](https://openf1.org/docs/) at setup time and is not bundled with the code. OpenF1 is an independent project, unaffiliated with Formula 1.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs neither credentials nor a download.

In the browser, inspect `query_lap_times` under **Behind the scenes**, watch partial responses appear during generation, click a follow-up suggestion or ask for a narrower lap range, and stop and retry.

## Adapt it

Replace `queryLapTimes` with a query to your database or API and update the function schema and prompt. Extend `src/library.ts` to support additional presentations, then regenerate the specification.

To run the tool and prompt on an agent framework instead, see the [LangGraph Platform](../../agent-frameworks/langgraph-platform), [Vercel AI SDK](../../agent-frameworks/vercel-ai-sdk), [Vercel Eve](../../agent-frameworks/vercel-eve), [Mastra](../../agent-frameworks/mastra), and [Google ADK](../../agent-frameworks/google-adk) examples.
