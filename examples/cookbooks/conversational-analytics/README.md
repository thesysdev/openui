# Conversational analytics

A runnable companion to the [conversational analytics cookbook](https://www.openui.com/docs/cookbooks/conversational-analytics). Ask a sales question, inspect the database tool call, and watch an OpenUI dashboard appear as the answer streams. Change country or month by asking a follow-up question.

Stack: Next.js App Router, React, OpenUI Agent Interface, OpenUI Lang and built-in React UI components, OpenUI Cloud's Gateway Responses API, and local SQLite. Python imports the original UCI workbook once. This is a standalone example, not part of the repository's package workspace.

## Run

Requirements: Node.js 22.13+, Python 3.9+, and npm (or pnpm with `--ignore-workspace` when installing inside this repository).

```bash
npm ci
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
python scripts/prepare_data.py
npm run dev
```

On Windows, activate with `.venv\Scripts\Activate.ps1` in PowerShell. Open http://localhost:3000. Use `npm run dev -- --port 3001` if port 3000 is occupied.

To enable OpenUI Cloud questions, create an inference key in the [Thesys Console](https://console.thesys.dev/keys), configure `THESYS_API_KEY` privately in `.env.local`, and restart. Optional `OPENUI_MODEL` selects another supported `provider/model` identifier; the default is `openai/gpt-5.5`. Never put the key in a `NEXT_PUBLIC_` variable. Try:

- “Compare February 2011 sales with January.”
- “Chart Germany’s daily sales in February 2011.”
- “Which products lost the most sales in November 2011?”

The model calls a server-side `sales_dashboard` function, then generates a layout from its result. There are no filter widgets or browser-side data queries. All displayed financial values and interpretation strings should reference the server's query result. Unsupported dates or concepts such as profit should receive an explanation of the supported scope. Layout generation is probabilistic; inspect the OpenUI Lang and compare the results with the expected totals below.

## Dataset and accounting

Source: [UCI Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail), 541,909 invoice lines covering 2010-12-01 through 2011-12-09. The importer verifies the original archive's SHA-256:

```text
f5385cbb54bbebf7196389109c6b0621faab0c304e3702548165e71c84aede8b
```

The resulting `data/manifest.json` records the import. The archive and SQLite database are local, ignored artifacts. Rerunning the importer atomically replaces the database using the cached, verified archive.

- Gross sales sum `Quantity × UnitPrice` for non-C-prefixed invoices with positive quantities and prices. There are **530,104** retained lines.
- Exclusions, applied in order: **9,288** cancellations, **1,336** other non-positive quantities, **1,181** other non-positive prices.
- This is **gross sales**, not net revenue: an original positive line remains even if later canceled. No outlier removal or deduplication is performed. Positive-priced postage and other charge lines remain.
- Missing customer IDs do not remove a sale; customer IDs are not stored. Missing descriptions fall back to stock codes.
- Money is stored in integer £0.0001 units; rounding occurs at display time.
- Orders count distinct invoices; average order value divides gross sales by orders.
- Supported months are January through November 2011. December 2010 supplies the first baseline; the incomplete December 2011 is excluded. Month lengths differ, and no seasonal adjustment is applied.
- The product table includes the union of stock codes across both periods, sorted by ascending sales change, limited to ten. It does not reconcile the entire sales difference.

## Architecture and files

```text
Agent Interface -> /api/chat -> OpenUI Cloud Gateway
Cloud function_call -> sales_dashboard -> validated read-only SQLite query
function_call_output -> Cloud continuation -> streamed OpenUI Lang
Responses SSE -> openAIResponsesAdapter -> tool timeline + progressive dashboard
Follow-up question -> new tool call and answer
```

| File                                   | Purpose                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `scripts/prepare_data.py`              | Download, checksum, filter, and import the original workbook             |
| `src/lib/analytics.ts`                 | Read-only SQL, aggregates, comparisons, and display strings              |
| `src/lib/query-args.ts`                | Supported months and validated country/month arguments                   |
| `src/lib/sales-tool.ts`                | Responses function schema and database executor                          |
| `src/lib/tool-loop.ts`                 | First-party Cloud tool loop, stored continuations, and completion checks |
| `src/library.ts`                       | Shared subset of built-in components, without filter controls            |
| `src/lib/example-program.ts`           | Illustrative syntax example for prompting and parser tests               |
| `src/lib/prompt.ts`                    | Cloud instructions using the generated component specification           |
| `src/app/api/chat/route.ts`            | OpenUI Cloud request and SSE response                                    |
| `src/lib/cloud-stream.ts`              | Forward tool and text events; propagate cancellation                     |
| `src/lib/chat-request.ts`              | Validate one bounded user question                                       |
| `src/lib/chat-client.ts`               | Latest-message transport with the published Responses adapter            |
| `src/lib/cloud-session.ts`             | Local demo identity, token minting, and scoped conversation membership   |
| `src/app/api/frontend-token/route.ts`  | Short-lived Cloud storage tokens                                         |
| `src/components/retail-chat.tsx`       | Agent Interface shell, composer, and starters                            |
| `src/components/dashboard-message.tsx` | Progressive renderer and source inspection                               |
| `src/lib/openui-content.ts`            | Incrementally remove Cloud envelopes and code fences                     |

`npm run generate` creates the ignored component spec before dev/build/verify. The server passes it to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, which produces Cloud's managed configuration with the same schema used by the renderer. Cloud accepts `additionalRules` and `examples` for the tool contract and illustrative layout. Local-only prompt flags such as `toolCalls` and `toolExamples` are not Cloud wire options.

The `openai` dependency is the compatible SDK transport. Its base URL is explicitly `https://api.thesys.dev/v1/embed` and it authenticates with `THESYS_API_KEY`. Cloud generation uses `conversation: threadId` and `store: true`. The tool loop submits only new function outputs to that conversation; Cloud already has the preceding input and response items. Only the declared app tool runs, and calls already settled by Cloud are skipped.

Agent Interface uses `openAIResponsesAdapter` with `openAIConversationMessageFormat` for native tool activity and streamed messages. Each request sends only the latest user question. The server rejects browser-submitted history and tool outputs. `useOpenuiCloudStorage` from the pinned `@openuidev/react-ui` package reads and edits Cloud conversations with a short-lived frontend token. Threads, messages, and tool activity survive reloads and local server restarts.

The local identity defaults to `DEMO_USER_ID=local-demo` and `APP_ID=conversational-analytics-cookbook`. Both routes derive these values on the server. Keep them stable to retain access to the same history; use another `APP_ID` for an independent copy. Generation checks membership through the same scoped Cloud list API before accepting a conversation id.

The message renderer removes the opening OpenUI code fence as soon as it arrives. Waiting for the closing fence would hide otherwise renderable content until generation finishes. The prompt emits `root`, then metric components, then charts and tables. Country and month changes require a follow-up question and a new database tool call.

The example binds to loopback and is intended for single-user local development. Its chat and token routes reject production requests. Deployment requires replacing the local demo guard with authentication and rate limits on both routes, deriving user identity from the signed-in session, retaining conversation ownership checks, authorizing private datasets, and using persistent SQLite storage or a hosted database. Raw invoice rows and customer IDs are not sent to the model. Cloud receives conversation text, component/tool instructions, country names, and the aggregate tool result.

## Verify

```bash
npm run verify
python -m unittest discover -s scripts -p 'test_*.py'
npm run verify:data
```

`verify` is credential-free and needs no dataset: it checks SQL aggregation with in-memory fixtures, date and country validation, empty states, the published Responses adapter, stream failures and cancellation, stored tool continuations, latest-message requests, and local access boundaries, OpenUI parsing against the published schema, and a production build. The Python checks require the environment above. `verify:data` needs the imported dataset.

| February 2011 | Gross sales | Orders | Previous month's gross sales |
| ------------- | ----------: | -----: | ---------------------------: |
| All countries | £523,631.89 |  1,100 |                  £691,364.56 |
| Germany       |   £9,581.05 |     19 |                   £16,910.84 |

Browser checks: ask the questions above; expand **Behind the scenes** to inspect the real tool call and output; confirm cards and a partially built table are visible while generation is running; use a follow-up for Germany and verify the totals; ask about Saudi Arabia in April 2011 for an empty result; stop generation and ask again; reload the page and restart the server, then reopen a sidebar conversation to check that messages, dashboards, and tool activity are retained.

## Extend

Add net-sales accounting, daily-average comparisons, or a full product reconciliation in the server query first. Then update the result contract, prompt, and illustrative layout together. Add components by extending `src/library.ts` and regenerating the spec. To use your own database, replace `queryDashboard` while retaining validated arguments and parameter binding.

## Attribution

Chen, D. (2015). [Online Retail](https://doi.org/10.24432/C5BW33) [Dataset]. UCI Machine Learning Repository. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The example filters and aggregates the source and omits customer IDs. Dataset licensing is separate from the repository's code license.
