# Analytics Demo

A conversational analytics app that streams OpenUI Lang charts, tables, and metric cards using OpenAI and server-side tool execution.

It uses `@openuidev/react-ui`'s FullScreen layout and the built-in `openuiChatLibrary` — no custom component definitions needed — to render charts, tables, and metric cards from live tool data.

The example includes:

- A **Next.js frontend** with a FullScreen chat layout and built-in conversation starters
- A **Next.js API route** that calls OpenAI with streaming and automatic tool execution via `runTools()`
- **Four mock analytics tools** with built-in sample data, so nothing external is required

## Architecture

```
Browser (FullScreen) -- POST /api/chat --> Next.js route --> OpenAI
                     <-- SSE stream --                       (OpenUI Lang + tool calls)
```

The client sends a conversation to `/api/chat`. The API route loads a generated `system-prompt.txt`, uses OpenAI's `runTools()` to handle multi-round tool calling automatically, and streams the response as SSE. On the client side, `openAIAdapter()` parses the stream, and `openuiChatLibrary` maps each node to a chart, table, or metric card that renders progressively as tokens arrive.

## Project layout

```
examples/analytics-demo/
|- src/app/              # Next.js app (layout, page, API route)
|- src/data/             # Built-in sample data
|- src/tools/            # Analytics tool definitions and implementations
|- src/generated/        # Generated system prompt
|- src/library.ts        # Re-exports openuiChatLibrary and promptOptions
```

## Getting Started

1. Install dependencies:

```bash
cd examples/analytics-demo
pnpm install
```

2. Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

3. Start the dev server:

```bash
pnpm dev
```

This automatically generates the system prompt from the library definition before starting Next.js.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## What to expect

Try one of the built-in conversation starters:

- "Revenue trends" — a line or area chart of monthly revenue, expenses, and profit
- "Q1 vs Q2 sales" — a grouped bar chart comparing sales by product category across quarters
- "Key metrics" — metric cards for MRR, ARR, churn rate, NPS, CAC, LTV, and more
- "Customer segments" — a pie or bar chart breaking down customers by tier or region

All responses are streamed progressively. The assistant picks the right chart type for the data and can combine multiple visualizations (a summary metric, a chart, and a detail table) in a single response card.

## Key files

### `src/app/page.tsx` — FullScreen chat setup

The page wires up the FullScreen layout with the built-in `openuiChatLibrary`:

```tsx
import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";

export default function Page() {
  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: openAIMessageFormat.toApi(messages),
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={openAIAdapter()}
        componentLibrary={openuiChatLibrary}
        agentName="Analytics Demo"
        theme={{ mode: "light" }}
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Revenue trends",
              prompt: "Show me monthly revenue trends for the past year.",
            },
            {
              displayText: "Q1 vs Q2 sales",
              prompt: "Compare Q1 vs Q2 sales by product category.",
            },
            { displayText: "Key metrics", prompt: "What are our key business metrics right now?" },
            {
              displayText: "Customer segments",
              prompt: "Break down our customer base by segment and show spending patterns.",
            },
          ],
        }}
      />
    </div>
  );
}
```

Because this example uses the standard `openuiChatLibrary`, there is no custom component library to define. The same library is used by the CLI to generate the system prompt.

### `src/library.ts` — library re-export

The library file re-exports the built-in library and prompt options so the CLI can discover them:

```ts
export {
  openuiChatLibrary as library,
  openuiChatPromptOptions as promptOptions,
} from "@openuidev/react-ui/genui-lib";
```

The `generate:prompt` script points the CLI at this file. The exported names `library` and `promptOptions` are the convention the CLI uses for auto-detection.

### `src/app/api/chat/route.ts` — OpenAI streaming with tool execution

The API route uses the OpenAI SDK's `runTools()` to handle multi-round tool calling automatically, streaming content and tool call events as SSE:

```ts
const runner = (client.chat.completions as any).runTools({
  model,
  messages: chatMessages,
  tools,
  stream: true,
});

runner.on("functionToolCall", (fc) => {
  enqueue(sseToolCallStart(encoder, { id, function: { name: fc.name } }, callIdx));
});

runner.on("functionToolCallResult", (result) => {
  enqueue(sseToolCallArgs(encoder, { id: tc.id, function: { arguments: tc.arguments } }, result, resultIdx));
});

runner.on("chunk", (chunk) => {
  const delta = chunk.choices?.[0]?.delta;
  if (delta?.content) enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
});
```

`runTools()` handles the full tool-calling loop internally — calling tools, feeding results back to the model, and repeating until a final text response is produced.

### `src/tools/analytics-tools.ts` — tool definitions

Each tool is defined with a JSON Schema description (for the LLM) and a plain async function (executed server-side):

```ts
{
  type: "function",
  function: {
    name: "query_revenue",
    description: "Query revenue, expenses, and profit data. Can return monthly or quarterly breakdowns.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", description: "Time period: 'monthly' or 'quarterly'." },
      },
    },
    function: queryRevenue,
  },
}
```

## Tools

The API route defines four server-side tools with built-in sample data:

| Tool              | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `query_revenue`   | Monthly or quarterly revenue, expenses, and profit. Includes YoY growth.               |
| `query_sales`     | Sales grouped by product category (per quarter), region, or individual product.        |
| `query_metrics`   | Key business metrics: MRR, ARR, churn, NPS, conversion rate, CAC, LTV, customer count. |
| `query_customers` | Customer segmentation by tier (Enterprise, Mid-Market, SMB, Individual) or region.     |

No external API keys or data sources are needed. In a production app, replace the mock implementations with real database queries or API calls.

## Learn More

- [OpenUI Documentation](https://openui.com/docs) — learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) — your feedback and contributions are welcome!
