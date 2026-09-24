# Conversational analytics

A runnable companion to the [conversational analytics cookbook](https://www.openui.com/docs/cookbooks/conversational-analytics). Ask a question, inspect the database tool call, and watch a chart or table take shape as the answer streams.

The example uses recorded lap times from the **2024 Miami Grand Prix**, provided by [OpenF1](https://openf1.org/docs/). It runs on Next.js, Agent Interface, OpenUI Cloud, and Node's built-in SQLite module.

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

1. Agent Interface sends the latest user message to `/api/chat`.
2. OpenUI Cloud requests `query_race` with a view, driver numbers, and lap range.
3. The server validates the arguments and queries the local SQLite snapshot.
4. The tool loop returns the result to the saved Cloud conversation and forwards tool events and generated OpenUI Lang to the browser.
5. Agent Interface displays tool activity and progressively renders the visual answer.

The tool supports `fastest_laps` (one best recorded lap per driver) and `lap_times` (one to four drivers on matching lap numbers). Rankings can include all drivers by passing an empty `driver_numbers` array. The final ten race laps are 48 through 57. Comparisons include absolute times and a per-lap difference from the first selected driver, so the UI can show small differences clearly.

## Files

| File                                   | Purpose                                                     |
| -------------------------------------- | ----------------------------------------------------------- |
| `scripts/prepare-data.ts`              | Download OpenF1's race snapshot and prepare SQLite          |
| `src/lib/race-data.ts`                 | Source validation, importer, and driver catalog             |
| `src/lib/analytics.ts`                 | Read-only queries and aligned chart series                  |
| `src/lib/query-args.ts`                | Driver selection and lap-range validation                   |
| `src/lib/race-tool.ts`                 | Function schema and executor                                |
| `src/library.ts`                       | Shared components for the prompt and renderer               |
| `src/lib/prompt.ts`                    | Cloud instructions and the supported data scope             |
| `src/app/api/chat/route.ts`            | Cloud generation and streamed response                      |
| `src/lib/tool-loop.ts`                 | Function execution and stored continuations                 |
| `src/lib/cloud-stream.ts`              | Forward tool/text events and cancellation                   |
| `src/lib/cloud-session.ts`             | Local identity, frontend tokens, and conversation ownership |
| `src/components/analytics-chat.tsx`    | Agent Interface, Cloud storage, and starter questions       |
| `src/components/analytics-message.tsx` | Progressive rendering and source inspection                 |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`. The renderer uses the same component library.

## Cloud conversations

The OpenAI SDK transports requests to `https://api.thesys.dev/v1/embed` using `THESYS_API_KEY`. Generation uses `conversation: threadId` and `store: true`. Continuations submit only new function outputs because Cloud retains preceding input and response items.

`useOpenuiCloudStorage` from the pinned `@openuidev/react-ui` package loads the sidebar and messages using short-lived tokens from `/api/frontend-token`. `openAIResponsesAdapter` handles streamed tool activity and answers. The client sends only the latest user message; the server rejects injected history or function outputs.

`DEMO_USER_ID` defaults to `local-demo` and `APP_ID` to `conversational-analytics-cookbook`. Keep them stable to retain history across reloads and restarts. The server verifies conversation membership in the same scope before generation.

The app binds to loopback and its chat/token routes reject production requests. For deployment, replace the local guard with authentication and rate limits on both routes, derive user identity from the session, retain conversation ownership checks, and provide persistent SQLite storage or a hosted database. Cloud receives the conversation, component/tool instructions, driver catalog, and requested query results.

## Data notes

The importer reads the `sessions`, `drivers`, and `laps` endpoints for OpenF1 session **9507**. It validates the race identity and writes `data/race.sqlite` plus a manifest containing source URLs, SHA-256 hashes, and the fetch time. Re-running preparation replaces the local snapshot. Downloaded data and credentials are ignored by Git.

Times are stored as integer milliseconds and presented as seconds or `m:ss.sss`. Untimed laps remain missing. The marker after lap 57 is omitted. Comparisons use only lap numbers with a recorded time for every selected driver, listing any omitted laps in the result. Slow laps are retained. These are recorded times, not an official ruling on lap validity; lap times alone do not establish why a driver slowed.

Data is fetched from [OpenF1](https://openf1.org/docs/) at setup time and is not bundled with the code. OpenF1 is an independent project, unaffiliated with Formula 1.

## Verify

```bash
npm run verify
npm run verify:data
```

`verify` needs neither credentials nor a download. It covers source validation, ranking and range queries, missing-time alignment, tool events, stream errors/cancellation, stored continuations, local access boundaries, parsing, and the production build.

`verify:data` requires the prepared snapshot. It checks the fastest drivers against recorded values:

| Driver          | Best recorded lap |
| --------------- | ----------------: |
| Oscar Piastri   |          1:30.634 |
| Alexander Albon |          1:30.849 |
| Sergio Perez    |          1:30.855 |
| Carlos Sainz    |          1:30.928 |
| Lando Norris    |          1:30.980 |

It also checks the Norris/Verstappen series for laps 48 through 57. In the browser, inspect `query_race` under **Behind the scenes**, watch partial responses appear during generation, follow up with a narrower lap range, stop and retry, and reopen the conversation after a reload or server restart.

## Adapt it

Replace `queryRace` with a query to your database or API and update the function schema and prompt. Extend `src/library.ts` to support additional presentations, then regenerate the specification.
