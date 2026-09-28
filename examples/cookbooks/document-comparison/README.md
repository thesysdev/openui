# Document comparison

A runnable companion to the [document comparison cookbook](https://www.openui.com/cookbooks/document-comparison). Ask what to compare, watch the assistant search each document, and get a page-cited table, charts, and source cards that open each quoted page as the answer streams.

The example compares the latest annual reports (Form 10-K) from **NVIDIA**, **AMD**, and **Intel**. It runs on Next.js, Agent Interface, OpenUI Gateway, OpenAI embeddings, and Node's built-in SQLite module.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure two keys privately in `.env.local`:

- `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys), for generation and saved conversations.
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

1. Agent Interface sends the latest user message to `/api/chat`.
2. OpenUI Gateway calls `search_documents` once per criterion, with a short description of the information to find.
3. The server embeds the description, ranks each document's passages by similarity, and returns the closest ones with page numbers, links to those pages, and a `found` flag.
4. The tool loop returns the passages to the saved Gateway conversation and forwards tool events and generated OpenUI Lang to the browser.
5. Agent Interface displays tool activity and progressively renders the comparison: a page-cited table, charts, callouts for gaps and conflicts, and a card for each quoted page.

## Files

| File                                  | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `scripts/prepare-documents.ts`        | Download the PDFs, extract pages, split passages, embed, and store          |
| `src/lib/documents.ts`                | Sample document sources, database schema, and document list                 |
| `src/lib/embeddings.ts`               | OpenAI embeddings and similarity                                            |
| `src/lib/tools/search-documents.ts`   | Function schema, argument validation, and passage search                    |
| `src/library.ts`                      | Shared components for the prompt and renderer                               |
| `src/components/sources.tsx`          | The Sources component, built on React UI's source strip                     |
| `src/lib/prompt.ts`                   | Comparison rules and example answers for Gateway                            |
| `src/app/api/chat/route.ts`           | Request validation, Gateway generation, and SSE response                    |
| `src/app/api/documents/route.ts`      | Document list for the Documents page                                        |
| `src/lib/tool-loop.ts`                | The Gateway template's function-tool loop                                   |
| `src/lib/gateway-session.ts`          | Local identity, frontend tokens, conversation ownership, stopped tool calls |
| `src/lib/theme.ts`                    | Light and dark theme overrides                                              |
| `src/components/comparison-chat.tsx`  | Agent Interface, custom sidebar, Documents route, and starters              |
| `src/components/document-library.tsx` | The Documents page                                                          |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## Documents

`prepare:documents` downloads each report in `sources` (`src/lib/documents.ts`) from the company's investor relations site and checks that the download is complete. It extracts text page by page with `unpdf`, splits each page into 1,200-character passages that overlap by 200 characters, embeds them with `text-embedding-3-small`, and writes `data/documents.sqlite`. Re-running it rebuilds the database.

To compare your own PDFs, add them to `documents/` and run `npm run prepare:documents` again. The importer reads a PDF's text layer, so run OCR on scanned documents first. For large collections, store the embeddings in a vector database and keep the tool's contract.

The downloaded reports and the database are ignored by Git and are not redistributed with this repository.

## Gateway conversations

Generation uses `conversation: threadId` and `store: true`, so the client sends only the latest user message and continuations submit only new function outputs. `useOpenuiCloudStorage` loads the sidebar and messages using short-lived tokens from `/api/frontend-token`. `DEMO_USER_ID` defaults to `local-demo` and `APP_ID` to `document-comparison-cookbook`; keep them stable to retain history.

Stopping a response while `search_documents` runs can leave a stored function call without its output, which Gateway rejects on the next turn. The chat route sends a "stopped" output for any such call ahead of the next question.

The app binds to loopback and its routes reject production requests. For deployment, replace the local guard with authentication and rate limits, derive user identity from the session, retain conversation ownership checks, and keep both API keys on the server.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs neither credentials nor a download.

In the browser, open a card in an answer's Sources to check a value on its page, expand **Behind the scenes** to inspect `search_documents`, open **Documents** in the sidebar, and switch the operating system between light and dark mode.
