# Booking assistant

A runnable companion to the [booking assistant cookbook](https://www.openui.com/cookbooks/booking-assistant). Describe a trip in your own words, get a form prefilled with what the assistant understood, fill in what's missing, pick from stays with live prices and photos, and review the stay before continuing to the booking site.

Stays come from [trivago's public MCP server](https://mcp.trivago.com/docs), which compares prices across booking sites for any destination and needs no API key. There is no data to download. It runs on Next.js, Agent Interface, OpenUI Gateway's Chat Completions API, and the MCP TypeScript SDK.

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm ci
```

Configure `THESYS_API_KEY` from the [Thesys Console](https://console.thesys.dev/keys) privately in `.env.local`. Optional `OPENUI_MODEL` selects a supported `provider/model` identifier; the default is `openai/gpt-5.5`.

```bash
npm run dev
```

Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Book a room in Goa for two this weekend.” The form arrives with the destination, dates, and adults filled in, and the budget in rupees.
- “We're two adults and two kids, ages 6 and 9, looking for a hotel in Barcelona with a pool.” The form adds a field for the children's ages.
- After a search, “Make it under ₹3,000 a night.” The assistant searches again and says how many stays were over budget.

## How it works

1. Agent Interface sends the thread's messages to `/api/chat`, which calls OpenUI Gateway's Chat Completions API.
2. For a new request, the model replies with a form prefilled with every detail it understood, with validation rules on the required fields.
3. When the user submits the form, Agent Interface sends the button label and the form's values as the next message, and the model calls `search_stays`.
4. The server validates the arguments, calls `trivago-accommodation-search` on trivago's MCP server, applies the budget, and returns the best matches with prices, ratings, a photo, and a booking link.
5. The model shows the stays as cards with photos, then a summary. **Continue to booking** opens the stay on trivago, where the guest chooses a booking site and pays there.

## Files

| File                                  | Purpose                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/trivago.ts`                  | MCP client for trivago's accommodation search, and its filter options |
| `src/lib/tools/search-stays.ts`       | Function schema, argument validation, budget filter, and results      |
| `src/library.ts`                      | Shared components for the prompt and renderer                         |
| `src/components/date-picker.tsx`      | A DatePicker that the model can prefill with YYYY-MM-DD dates         |
| `src/lib/prompt.ts`                   | Booking rules and one example for each step of the flow               |
| `src/app/api/chat/route.ts`           | Request validation, Chat Completions generation, and SSE response     |
| `src/app/api/frontend-token/route.ts` | Frontend token for Gateway thread storage                             |
| `src/lib/tool-loop.ts`                | Chat Completions function-tool loop that streams AG-UI events         |
| `src/lib/theme.ts`                    | Light and dark theme overrides                                        |
| `src/components/booking-chat.tsx`     | Agent Interface, chat transport, thread storage, theme, and starters  |
| `src/app/styles.css`                  | Page layout and full-width photos on the stay cards                   |

`npm run generate` creates the ignored component specification before dev/build/verify. The server passes that specification to `generateSystemPrompt({ cloud: true, library: spec, promptOptions })`, and Agent Interface renders responses with the same component library.

## The MCP server

`search_stays` is a function tool that runs on this server and calls trivago's MCP server with the MCP SDK's Streamable HTTP client. trivago's search result embeds every photo as image data, about 665 KB per search, and includes formatting instructions for the model. The tool keeps only the structured hotel list and returns the fields the cards need, a few thousand tokens, and it never forwards the third-party instructions.

trivago has no price filter, so the tool applies the budget and reports how many stays it left out and the cheapest of them. Prices are live and can change until the guest books. Check [trivago's MCP documentation](https://mcp.trivago.com/docs) for its terms before you deploy.

## Forms

The model prefills fields with literal values. Submitted form state contains only the fields the user changed, so the prompt tells the model to use its prefilled value for any field missing from the state.

React UI's `DatePicker` stores `Date` objects, which a model cannot write and which reach the model as UTC timestamps. `src/components/date-picker.tsx` keeps the same name and props but reads and writes `YYYY-MM-DD` strings, so a prefilled date shows in the picker and a submitted date is the calendar day the user picked.

## Conversations

The OpenAI SDK sends requests to `https://api.thesys.dev/v1/embed/chat/completions` using `THESYS_API_KEY`. Chat Completions does not store conversations, so Agent Interface keeps each thread's messages in memory and `fetchLLM` sends them with every turn.

Agent Interface stores the thread list with Gateway's [Conversations API](https://www.openui.com/docs/gateway/api/conversations) through `useOpenuiCloudStorage()`. The browser calls Gateway directly with a short-lived [frontend token](https://www.openui.com/docs/gateway/authentication#frontend-tokens) from `/api/frontend-token`, which mints it with `THESYS_API_KEY` for one local user (`DEMO_USER_ID`, default `demo-user`) and app (`APP_ID`, default `booking-assistant-cookbook`), so the key stays on the server and the browser reaches only those threads. Threads stay listed after a reload, but Chat Completions doesn't write turns to a conversation, so Gateway keeps each thread's title and not its messages; a thread you open again from the sidebar is empty. To store the messages too, append each finished turn to the conversation with `storeChatCompletionHistory()` from [`@openuidev/server`](https://www.openui.com/docs/api-reference/server#conversation-history), or keep threads in your own database with `restStorage`.

The chat route forwards only user messages and assistant answers from the browser. It drops browser-supplied tool calls and results, so the model sees only search results the server produced for the current turn. Later steps therefore use what the stay cards show: each card's value is the stay's booking link, so choosing a card sends the link back with the form, and the summary's **Continue to booking** button opens it. A submitted form arrives as one message with the form's values, so the route accepts user messages of up to 4,000 characters.

The tool loop streams AG-UI events, which `agUIAdapter()` reads, because Chat Completions has no chunk for a tool result. The tool and prompt can also run on an agent framework such as LangGraph, the Vercel AI SDK, Mastra, or Google ADK; see the [agent runtime integrations](https://www.openui.com/docs/agent/agent-runtimes/langgraph-platform) and the [agent framework examples](../../agent-frameworks).

The app binds to loopback, and the chat and frontend-token routes accept browser requests only from its own local page. Every browser shares one local user's threads. For deployment, add [authentication](https://www.openui.com/docs/gateway/authentication), mint each frontend token for the signed-in user, and add rate limits to both routes.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs no credentials and makes no network calls to trivago.

In the browser, submit a form with a required field cleared to see validation, expand **Behind the scenes** to inspect `search_stays`, open a stay's summary and follow **Continue to booking**, and switch the operating system between light and dark mode.
