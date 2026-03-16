# Invoice Structured Output Example

A Next.js app demonstrating `@openuidev/structured-output` — the standalone OpenUI Lang library for schema-driven structured output from LLMs.

## What it does

1. **Select an invoice format** — Standard, Freelance, or International
2. **Describe the invoice** — or use the provided sample prompt
3. **Watch the LLM stream** — the raw OpenUI Lang appears on the left as tokens arrive
4. **See parsed JSON** — the streaming parser progressively builds the validated JSON on the right

The backend generates a system prompt from the Zod schema using `schema.prompt()`, sends it to the LLM, and streams back the raw OpenUI Lang. The frontend uses `schema.streamingParser()` to parse and validate the output in real time.

## Setup

```bash
# From the monorepo root
pnpm install

# Add your OpenRouter API key
cp examples/invoices-structured-output/.env.example examples/invoices-structured-output/.env.local
# Edit .env.local with your key

# Run the dev server
pnpm --filter invoices-structured-output dev
```

## Invoice Formats

| Format | Description |
| --- | --- |
| **Standard** | Simple business invoice with line items, tax rate, and totals |
| **Freelance** | Consulting invoice with hourly time entries and project details |
| **International** | Multi-currency invoice with addresses, tax breakdown, and shipping |

## Key files

- `src/app/schemas.ts` — Invoice type definitions using `defineType` and `createSchema`
- `src/app/api/generate/route.ts` — API route that generates the prompt and streams LLM output
- `src/app/page.tsx` — Frontend with format picker, streaming display, and parsed JSON view
