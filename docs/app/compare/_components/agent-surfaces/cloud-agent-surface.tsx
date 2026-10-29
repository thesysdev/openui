"use client";

import { createCloudChatLLM } from "@/lib/openui-cloud/chat-llm";
import { CLOUD_USER_ID_HEADER, getOrCreateCloudUserId } from "@/lib/openui-cloud/user-id";
import { AgentInterface } from "@openuidev/react-ui";
import { artifactRenderers, chatLibrary, useOpenuiCloudStorage } from "@openuidev/thesys";
import { useMemo, useState } from "react";
import type { ComparisonControllerRegistry } from "../comparison-mode-controller";
import { ComparisonModeControllerBridge } from "../comparison-mode-controller";
import { ComparisonSurfaceWelcome } from "./comparison-surface-welcome";

interface CloudAgentSurfaceProps {
  registry: ComparisonControllerRegistry;
}

export function CloudAgentSurface({ registry }: CloudAgentSurfaceProps) {
  const [userId] = useState(getOrCreateCloudUserId);
  const [llm] = useState(createCloudChatLLM);
  const cloudFetch = useMemo<typeof fetch>(() => {
    return async (input, init) => {
      if (typeof input !== "string" || input !== "/api/openui-cloud/frontend-token") {
        return fetch(input, init);
      }

      const headers = new Headers(init?.headers);
      headers.set(CLOUD_USER_ID_HEADER, userId);
      return fetch(input, { ...init, headers });
    };
  }, [userId]);
  const cloudStorage = useOpenuiCloudStorage({
    token: "/api/openui-cloud/frontend-token",
    fetch: cloudFetch,
  });

  return (
    <div className="chat-agent-surface">
      <AgentInterface
        storage={cloudStorage}
        llm={llm}
        componentLibrary={chatLibrary}
        artifactRenderers={artifactRenderers}
        scrollVariant="always"
      >
        <AgentInterface.Sidebar />
        <AgentInterface.Welcome>
          <ComparisonSurfaceWelcome mode="cloud" />
        </AgentInterface.Welcome>
        <AgentInterface.Composer>
          <ComparisonModeControllerBridge mode="cloud" registry={registry} />
        </AgentInterface.Composer>
      </AgentInterface>
    </div>
  );
}
