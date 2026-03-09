"use client";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";

import { vercelAIAdapter, vercelAIMessageFormat } from "@openuidev/react-headless";
import { FullScreen } from "@openuidev/react-ui";
import { defaultExamples, defaultLibrary } from "@openuidev/react-ui/genui-lib";

const systemPrompt = `You are a helpful AI agent with access to tools. Use them when appropriate.

Available tools:
- get_weather: Get current weather for any city
- get_stock_price: Get stock prices by ticker symbol (e.g. AAPL, GOOGL)
- calculate: Evaluate math expressions
- search_web: Search the web for information

Always use the appropriate tool when the user asks about weather, stocks, math, or needs web information. Present results clearly using markdown and GenUI components.

Your response should be in the following vertical format:
don't stack cards horizontally, always stack them vertically.
don't use any other format.
${defaultLibrary.prompt({ examples: defaultExamples })}`;

export default function AgentPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <FullScreen
        processMessage={async ({ messages, abortController }) => {
          return fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: vercelAIMessageFormat.toApi(messages),
              systemPrompt,
            }),
            signal: abortController.signal,
          });
        }}
        streamProtocol={vercelAIAdapter()}
        componentLibrary={defaultLibrary}
        agentName="Vercel AI Agent"
        conversationStarters={{
          variant: "short",
          options: [
            {
              displayText: "Weather in Tokyo",
              prompt: "What's the weather like in Tokyo right now?",
            },
            {
              displayText: "AAPL stock price",
              prompt: "What's the current stock price for AAPL?",
            },
            {
              displayText: "Calculate something",
              prompt: "What is (42 * 17) + sqrt(144)?",
            },
          ],
        }}
      />
    </div>
  );
}
