"use client";

import { GrokBuildInteractionDialog } from "@/components/grok-build-interaction-dialog";
import { useGrokBuildInteraction } from "@/hooks/use-grok-build-interaction";
import { createGrokBuildChatProps } from "@/lib/grok-build-chat";
import { AgentInterface, useSystemThemeMode } from "@openuidev/react-ui";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useMemo, useState } from "react";

export default function Page() {
  const mode = useSystemThemeMode();
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const { llm, storage } = useMemo(
    () => createGrokBuildChatProps({ onThreadChange: setActiveThreadId }),
    [],
  );
  const { error, interaction, respond, submitting } = useGrokBuildInteraction(activeThreadId);

  return (
    <div className="app-shell">
      <AgentInterface
        llm={llm}
        storage={storage}
        componentLibrary={openuiLibrary}
        agentName="Grok Build + OpenUI"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Launch checklist",
            prompt: "Create a launch checklist for a new AI feature.",
          },
          {
            displayText: "Onboarding flow",
            prompt: "Design a customer onboarding flow for a B2B SaaS product.",
          },
          {
            displayText: "Support case",
            prompt: "Summarize a support case as an action dashboard.",
          },
        ]}
      />
      {interaction ? (
        <GrokBuildInteractionDialog
          key={interaction.id}
          interaction={interaction}
          error={error}
          submitting={submitting}
          onRespond={respond}
        />
      ) : error ? (
        <p className="grok-interaction-poll-error">{error}</p>
      ) : null}
    </div>
  );
}
