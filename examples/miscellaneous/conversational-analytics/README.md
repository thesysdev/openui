# Conversational analytics

A runnable companion to the [conversational analytics cookbook](https://www.openui.com/docs/cookbooks/conversational-analytics). Ask a sales question, stream an OpenUI dashboard, then change country or month to query real data again without another model call.

Stack: Next.js App Router, React, OpenUI Lang and built-in React UI components, OpenAI Responses streaming, and local SQLite. Python imports the original UCI workbook once. This is a standalone example, not part of the repository's package workspace.

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

The **Example dashboard** loads a checked-in OpenUI Lang program with live database queries. Its country and month filters work without credentials. It is not a simulated model response.

To ask the model questions, configure `OPENAI_API_KEY` privately in `.env.local` and restart. Optional `OPENAI_MODEL` selects another Responses-compatible model; the default is `gpt-5.5`. Never put the key in a `NEXT_PUBLIC_` variable. Try:

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
Question + current filters -> /api/generate -> streamed OpenUI Lang -> Renderer
Renderer Query -> /api/analytics -> validated, parameterized SQL -> local SQLite
Select changes -> reactive Query arguments -> refreshed values (no model call)
```

| File                             | Purpose                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `scripts/prepare_data.py`        | Download, checksum, filter, and import the original workbook        |
| `src/lib/analytics.ts`           | Read-only database, aggregates, comparisons, and display strings    |
| `src/app/api/analytics/route.ts` | Validated data boundary exposed to the browser                      |
| `src/library.ts`                 | Shared subset of the built-in OpenUI library                        |
| `src/lib/example-program.ts`     | Credential-free layout and model prompt example                     |
| `src/lib/prompt.ts`              | Generate model instructions from the actual component specification |
| `src/app/api/generate/route.ts`  | Responses stream, abort handling, explicit completion/errors        |
| `src/lib/read-stream.ts`         | Decode NDJSON across arbitrary UTF-8 chunk boundaries               |
| `src/app/page.tsx`               | Question UI, renderer, tool provider, current filters, and recovery |

`npm run generate` creates the ignored component spec before dev/build/verify. The server imports this serialized spec; it does not import client components. Follow-ups include the current reactive filters and up to five previous questions. Conversations are in memory only.

The example binds to loopback and is intended for local use. Deployment requires authentication and rate limits for the model route, dataset authorization for private data, and persistent SQLite storage or a hosted database. Raw invoice rows and customer IDs are not sent to the model; the prompt includes the question, previous questions, filter context, country names, and component/tool instructions.

## Verify

```bash
npm run verify
python -m unittest discover -s scripts -p 'test_*.py'
npm run verify:data
```

`verify` is credential-free and needs no dataset: it checks SQL aggregation with in-memory fixtures, date and country validation, empty states, stream decoding/failures, OpenUI parsing against the published schema, and a production build. The Python checks require the environment above. `verify:data` needs the imported dataset.

| February 2011 | Gross sales | Orders | Previous month's gross sales |
| ------------- | ----------: | -----: | ---------------------------: |
| All countries | £523,631.89 |  1,100 |                  £691,364.56 |
| Germany       |   £9,581.05 |     19 |                   £16,910.84 |

Browser checks: switch countries and confirm all outputs change; select Saudi Arabia in April 2011 for an empty result; submit without a key for setup guidance; with a configured key, run the questions above, stop generation, and recover with **Load example dashboard**. Generated layouts may differ, but database totals must agree.

## Extend

Add net-sales accounting, daily-average comparisons, or a full product reconciliation in the server query first. Then update the result contract, prompt, and reference program together. Add components by extending `src/library.ts` and regenerating the spec. To use your own database, replace `queryDashboard` while retaining typed filters and parameter binding.

## Attribution

Chen, D. (2015). [Online Retail](https://doi.org/10.24432/C5BW33) [Dataset]. UCI Machine Learning Repository. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The example filters and aggregates the source and omits customer IDs. Dataset licensing is separate from the repository's code license.
