# Document comparison

A runnable companion to the [document comparison cookbook](https://www.openui.com/cookbooks/document-comparison). Ask what to compare, watch the assistant search each document, and get a page-cited table, charts, and source cards that open each quoted page as the answer streams.

The example compares the latest annual reports (Form 10-K) from **NVIDIA**, **AMD**, and **Intel**. It runs on Next.js, Agent Interface, OpenUI Gateway's Chat Completions API, OpenAI embeddings, and Node's built-in SQLite module.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure two keys privately in `.env.local`:

- `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys), for generation.
- `OPENAI_API_KEY` from the [OpenAI Platform](https://platform.openai.com/api-keys), for embeddings.

Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`.

```bash
npm run prepare:documents
npm run dev
```

The first `prepare:documents` run downloads about 83 MB of PDFs into `data/pdfs/`, which later runs reuse, and embeds 1,564 passages for about a cent. Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Compare revenue and growth.”
- “How has R&D spending changed over three years?”
- “Break down revenue by segment.”
- “Compare each CEO's total compensation.” The reports refer to the proxy statement, so the answer should report the gap.

## How it works

1. Agent Interface sends the thread's messages to `/api/chat`, which calls OpenUI Gateway's Chat Completions API.
2. The model calls `search_documents` once per criterion, with a short description of the information to find.
3. The server embeds the description, ranks each document's passages by similarity, and returns the closest ones with page numbers, links to those pages, and a `found` flag.
4. The tool loop returns the passages to the model and streams tool events and generated OpenUI Lang to the browser as AG-UI events.
5. Agent Interface displays tool activity and progressively renders the comparison: a page-cited table, charts, callouts for gaps and conflicts, and a card for each quoted page.

## Files

| File                                  | Purpose                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `scripts/prepare-documents.ts`        | Download the PDFs, extract pages, split passages, embed, and store            |
| `src/lib/documents.ts`                | Sample document sources, database schema, and document list                   |
| `src/lib/embeddings.ts`               | OpenAI embeddings and similarity                                              |
| `src/lib/tools/search-documents.ts`   | Function schema, argument validation, and passage search                      |
| `src/library.ts`                      | Shared components for the prompt and renderer                                 |
| `src/components/sources.tsx`          | The Sources component, built on React UI's source strip                       |
| `src/lib/prompt.ts`                   | Comparison rules and example answers for Gateway                              |
| `src/app/api/chat/route.ts`           | Request validation, Chat Completions generation, and SSE response             |
| `src/app/api/documents/route.ts`      | Document list for the Documents page                                          |
| `src/app/api/frontend-token/route.ts` | Frontend token for Gateway thread storage                                     |
| `src/lib/local-origin.ts`             | Local-page check shared by the chat and frontend-token routes                 |
| `src/lib/tool-loop.ts`                | Chat Completions function-tool loop that streams AG-UI events                 |
| `src/lib/theme.ts`                    | Light and dark theme overrides                                                |
| `src/components/comparison-chat.tsx`  | Agent Interface, chat transport, thread storage, sidebar, and Documents route |
| `src/components/document-library.tsx` | The Documents page                                                            |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## Documents

`prepare:documents` downloads each report in `sources` (`src/lib/documents.ts`) from the company's investor relations site and checks that the download is complete. It extracts text page by page with `unpdf`, splits each page into 1,200-character passages that overlap by 200 characters, embeds them with `text-embedding-3-small`, and writes `data/documents.sqlite`. Re-running it rebuilds the database.

To compare your own PDFs, add them to `documents/` and run `npm run prepare:documents` again. The importer reads a PDF's text layer, so run OCR on scanned documents first. For large collections, store the embeddings in a vector database and keep the tool's contract.

The downloaded reports and the database are ignored by Git and are not redistributed with this repository.

## Conversations

The OpenAI SDK sends requests to `https://api.thesys.dev/v1/embed/chat/completions` using `THESYS_API_KEY`. Chat Completions does not store conversations, so Agent Interface keeps each thread's messages in memory and `fetchLLM` sends them with every question. Follow-up suggestions are sent the same way, so they build on the earlier answers.

Agent Interface stores the thread list with Gateway's [Conversations API](https://www.openui.com/docs/gateway/api/conversations) through `useOpenuiCloudStorage()`. The browser calls Gateway directly with a short-lived [frontend token](https://www.openui.com/docs/gateway/authentication#frontend-tokens) from `/api/frontend-token`, which mints it with `THESYS_API_KEY` for one local user and the `document-comparison-cookbook` app, so the key stays on the server and the browser reaches only those threads. Threads stay listed after a reload, but Chat Completions doesn't write turns to a conversation, so Gateway keeps each thread's title and not its messages; a thread you open again from the sidebar is empty. To store the messages too, generate with the [Responses API](https://www.openui.com/docs/gateway/api/responses) and pass `conversation` and `store: true`, or keep threads in your own database with `restStorage`.

The chat route forwards only user questions and assistant answers from the browser. It drops browser-supplied tool calls and results, so the model sees only passages the server found for the current question. The tool loop streams AG-UI events, which `agUIAdapter()` reads, because Chat Completions has no chunk for a tool result. It is the same loop as in the [conversational analytics](../conversational-analytics) cookbook.

The app binds to loopback, and the chat and frontend-token routes accept browser requests only from its own local page. Every browser shares one local user's threads. For deployment, add authentication, mint each frontend token for the signed-in user, and add rate limits to both routes.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs neither credentials nor a download.

In the browser, open a card in an answer's Sources to check a value on its page, expand **Behind the scenes** to inspect `search_documents`, open **Documents** in the sidebar, and switch the operating system between light and dark mode.
