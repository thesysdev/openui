"use client";

import {
  AgentInterface,
  fetchLLM,
  openAIMessageFormat,
  openAIReadableStreamAdapter,
  useOpenuiCloudStorage,
  useSystemThemeMode,
} from "@openuidev/react-ui";
import { Footprints, Gift, Shirt, Store } from "lucide-react";
import { useMemo } from "react";
import { darkTheme, lightTheme } from "../lib/theme";
import { library } from "../library";

// Send the thread's messages in Chat Completions format and read the runner's stream from the route.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIReadableStreamAdapter(),
  messageFormat: openAIMessageFormat,
});

// Most starters are for shoppers who don't know what they want yet; one names a product.
const starters = [
  {
    displayText: "Show me what you sell",
    prompt: "What do you sell? Show me a few favorites.",
    icon: <Store size={16} />,
  },
  {
    displayText: "Something cozy to wear",
    prompt: "I want something cozy to wear this winter. What would you recommend?",
    icon: <Shirt size={16} />,
  },
  {
    displayText: "A gift set under $100",
    prompt: "Put together a gift set under $100 for a friend who loves OpenUI.",
    icon: <Gift size={16} />,
  },
  {
    displayText: "Shoes under $100 in size 9",
    prompt: "Find shoes under $100 in size 9.",
    icon: <Footprints size={16} />,
  },
];

export default function ShopChat({ store }: { store: string }) {
  const mode = useSystemThemeMode();
  const theme = useMemo(() => ({ mode, lightTheme, darkTheme }), [mode]);
  // Store threads as Gateway conversations, which the browser reaches with a short-lived token
  // from /api/frontend-token. The chat route appends each turn to the thread's conversation, so
  // a thread opened again loads its messages.
  const storage = useOpenuiCloudStorage({
    token: "/api/frontend-token",
    features: { artifact: false },
  });
  return (
    <div className="shop-app">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={library}
        agentName="Shop assistant"
        logoUrl="/logo.svg"
        theme={theme}
        starters={starters}
        starterVariant="long"
      >
        <AgentInterface.ThreadHeader>
          <span className="thread-context">
            Products and cart from{" "}
            <a href={`https://${store}`} target="_blank" rel="noreferrer">
              {store}
            </a>{" "}
            · You check out on the store
          </span>
        </AgentInterface.ThreadHeader>
        <AgentInterface.Welcome
          image={{ url: "/logo.svg" }}
          title="What are you shopping for?"
          description="Tell me what you're looking for, or just ask what we have. I'll find products, help you pick sizes and colors, keep your cart up to date, and design a printable gift card to go with it."
        />
        <AgentInterface.Composer placeholder="Search the store…" />
      </AgentInterface>
    </div>
  );
}
