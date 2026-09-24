"use client";

import { useCallback, useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { useThread, type Message } from "@openuidev/react-headless";

import { Orb, type OrbMode } from "@/components/Orb";
import { useVoiceListener } from "@/components/useVoiceListener";

function lastAssistantText(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "assistant") return message.content ?? null;
  }
  return null;
}

export function VoiceCanvas() {
  const { messages, isRunning, processMessage, cancelMessage, setMessages } = useThread();
  const [listening, setListening] = useState(true);

  const onTranscript = useCallback(
    (text: string) => {
      processMessage({ role: "user", content: text });
    },
    [processMessage],
  );

  // Pause capture while the model streams so we don't queue overlapping utterances.
  const { state, error, levelRef } = useVoiceListener({
    enabled: listening,
    paused: isRunning,
    onTranscript,
  });

  const response = lastAssistantText(messages);
  const hasContent = Boolean(response);

  const mode: OrbMode =
    !listening ? "off"
    : isRunning || state === "transcribing" ? "thinking"
    : state === "capturing" ? "hearing"
    : "listening";

  const hint =
    !listening ? "Paused"
    : isRunning ? "Thinking…"
    : state === "transcribing" ? "Heard you…"
    : state === "capturing" ? "Listening…"
    : "Just start speaking";

  const reset = () => {
    cancelMessage();
    setMessages([]);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08080c]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(56,189,248,0.08), transparent 60%), radial-gradient(100% 80% at 50% 100%, rgba(192,132,252,0.07), transparent 55%)",
        }}
      />

      {hasContent ? (
        <div className="absolute inset-0 overflow-y-auto px-4 pb-36 pt-10">
          <div className="mx-auto max-w-3xl">
            <Renderer response={response} library={openuiLibrary} isStreaming={isRunning} />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-8">
            <Orb mode={mode} levelRef={levelRef} size={260} />
            <p className="text-lg font-light tracking-wide text-white/70">{hint}</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
          {hasContent && (
            <div className="flex items-center gap-2 pl-1 pr-2">
              <Orb mode={mode} levelRef={levelRef} size={34} />
              <span className="text-xs font-light text-white/60">{hint}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setListening((value) => !value)}
            className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            {listening ? "Stop listening" : "Start listening"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!hasContent && !isRunning}
            className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            Reset
          </button>
        </div>
        {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
