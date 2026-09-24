"use client";

import type { AssistantMessage } from "@openuidev/react-headless";
import { Renderer } from "@openuidev/react-lang";
import { useState } from "react";
import { extractProgram } from "../lib/openui-content";
import { library } from "../library";

export function AnalyticsMessage({
  message,
  isStreaming,
}: {
  message: AssistantMessage;
  isStreaming: boolean;
}) {
  const [parseError, setParseError] = useState("");
  const program = extractProgram(message.content ?? "");
  if (!program) return null;
  // A stopped tool round can leave planning prose as the last assistant segment.
  if (!/(?:^|\n)\s*root\s*=/.test(program)) {
    return isStreaming ? (
      <p className="streaming-note" role="status">
        Building the answer…
      </p>
    ) : (
      <p>{program}</p>
    );
  }
  return (
    <div className="analytics-message">
      {isStreaming && (
        <p className="streaming-note" role="status">
          Building the answer…
        </p>
      )}
      {!isStreaming && parseError && (
        <p className="query-error" role="alert">
          Could not render this response: {parseError} Please ask again.
        </p>
      )}
      <Renderer
        response={program}
        library={library}
        isStreaming={isStreaming}
        onError={(errors) => setParseError(errors.map((error) => error.message).join(" "))}
      />
      <details className="program-source">
        <summary>Inspect the OpenUI Lang</summary>
        <pre>{program}</pre>
      </details>
      <p className="dataset-note">
        2024 Miami Grand Prix · Recorded lap times from{" "}
        <a href="https://openf1.org/docs/" target="_blank" rel="noreferrer">
          OpenF1
        </a>
        .
      </p>
    </div>
  );
}
