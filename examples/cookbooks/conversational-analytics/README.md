# Conversational analytics

A runnable companion to the [conversational analytics cookbook](https://www.openui.com/docs/cookbooks/conversational-analytics). Ask a sales question, stream an OpenUI dashboard, then change country or month to query real data again without another model call.

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

Click **Example dashboard** in the toolbar or sidebar. This reference conversation loads a checked-in OpenUI Lang program with live database queries. Its country and month filters work without credentials. It is not a simulated model response.

To enable OpenUI Cloud questions, create an inference key in the [Thesys Console](https://console.thesys.dev/keys), configure `THESYS_API_KEY` privately in `.env.local`, and restart. Optional `OPENUI_MODEL` selects another supported `provider/model` identifier; the default is `openai/gpt-5.5`. Never put the key in a `NEXT_PUBLIC_` variable. Try:

- “Why did gross sales fall in February 2011?”
- “Now show Germany as a bar chart.”
- “Show France in November 2011.”

The model selects query arguments and layout. All displayed financial values and interpretation strings should reference the server's query result. Unsupported dates or concepts such as profit should receive an explanation of the supported scope. Layout generation is probabilistic; inspect the OpenUI Lang and compare the results with the expected totals below.

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
- Selectable months are January through November 2011. December 2010 supplies the first baseline; the incomplete December 2011 is excluded. Month lengths differ, and no seasonal adjustment is applied.
- The product table includes the union of stock codes across both periods, sorted by ascending sales change, limited to ten. It does not reconcile the entire sales difference.

## Architecture and files

```text
Agent Interface composer + history + filters -> /api/chat -> OpenUI Cloud Gateway
Cloud Responses SSE -> openAIResponsesAdapter -> Agent Interface messages
Renderer Query -> /api/analytics -> validated, parameterized SQL -> local SQLite
Select changes -> reactive Query arguments -> refreshed values (no model call)
```

| File                                   | Purpose                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| `scripts/prepare_data.py`              | Download, checksum, filter, and import the original workbook        |
| `src/lib/analytics.ts`                 | Read-only database, aggregates, comparisons, and display strings    |
| `src/app/api/analytics/route.ts`       | Validated data boundary exposed to the browser                      |
| `src/library.ts`                       | Shared subset of the built-in OpenUI library                        |
| `src/lib/example-program.ts`           | Credential-free layout and model prompt example                     |
| `src/lib/prompt.ts`                    | Generate model instructions from the actual component specification |
| `src/app/api/chat/route.ts`            | OpenUI Cloud Responses request and cancellation                     |
| `src/lib/cloud-stream.ts`              | Forward SSE and report failed or incomplete responses               |
| `src/lib/chat-request.ts`              | Validate message history and current filters                        |
| `src/lib/chat-session.ts`              | Agent Interface transport, session storage, and per-message filters |
| `src/components/retail-chat.tsx`       | Agent Interface shell, composer, starters, and reference navigation |
| `src/components/dashboard-message.tsx` | Assistant message renderer, query provider, filters, and recovery   |

`npm run generate` creates the ignored component spec before dev/build/verify. The server passes it to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, which produces Cloud's managed configuration with the same schema used by the renderer. Cloud accepts `additionalRules` and `examples` for the query contract and reference layout. Local-only prompt flags such as `toolCalls` and `toolExamples` are not Cloud wire options.

The `openai` dependency is the compatible SDK transport. Its base URL is explicitly `https://api.thesys.dev/v1/embed` and it authenticates with `THESYS_API_KEY`. The example uses Cloud generation with `store: false`; follow-ups include the latest dashboard filters and up to 12 non-empty user and assistant messages. Agent Interface uses `fetchLLM` with `openAIResponsesAdapter` to read the Responses SSE stream. Conversations and filter state are stored in memory for the mounted app: switching threads preserves them, and reloading clears them. There is no Cloud conversation or frontend-token route.

`sales_dashboard` is a renderer-side `Query` handled by the browser's `toolProvider`, not a model-side Responses function tool. Cloud generates its expression; the app executes the database query. Filter changes stay local to the app and do not call Cloud. See the [Gateway quickstart](https://www.openui.com/docs/gateway/generate-openui-lang) and [Responses API](https://www.openui.com/docs/gateway/api/responses) for the supported Cloud contracts.

The example binds to loopback and is intended for local use. Deployment requires authentication and rate limits for the model route, dataset authorization for private data, and persistent SQLite storage or a hosted database. Raw invoice rows and customer IDs are not sent to the model; the prompt includes the user and assistant messages, filter context, country names, and component/tool instructions.

## Verify

```bash
npm run verify
python -m unittest discover -s scripts -p 'test_*.py'
npm run verify:data
```

`verify` is credential-free and needs no dataset: it checks SQL aggregation with in-memory fixtures, date and country validation, empty states, the published Responses adapter, stream failures and cancellation, conversation storage and filter context, OpenUI parsing against the published schema, and a production build. The Python checks require the environment above. `verify:data` needs the imported dataset.

| February 2011 | Gross sales | Orders | Previous month's gross sales |
| ------------- | ----------: | -----: | ---------------------------: |
| All countries | £523,631.89 |  1,100 |                  £691,364.56 |
| Germany       |   £9,581.05 |     19 |                   £16,910.84 |

Browser checks: open **Example dashboard**; switch countries and confirm all outputs change; start a **New Chat** and reopen the reference conversation to check that filters are preserved; select Saudi Arabia in April 2011 for an empty result; submit without a key for setup guidance; with a configured key, run the questions above, stop generation, and recover with **Example dashboard**. Generated layouts may differ, but database totals must agree.

## Extend

Add net-sales accounting, daily-average comparisons, or a full product reconciliation in the server query first. Then update the result contract, prompt, and reference program together. Add components by extending `src/library.ts` and regenerating the spec. To use your own database, replace `queryDashboard` while retaining typed filters and parameter binding.

## Attribution

Chen, D. (2015). [Online Retail](https://doi.org/10.24432/C5BW33) [Dataset]. UCI Machine Learning Repository. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The example filters and aggregates the source and omits customer IDs. Dataset licensing is separate from the repository's code license.
