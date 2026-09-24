"use client";

import type { AssistantMessage } from "@openuidev/react-headless";
import { Renderer } from "@openuidev/react-lang";
import { useMemo, useRef, useState } from "react";
import { exampleMessageId, type ChatSession } from "../lib/chat-session";
import { filterSchema } from "../lib/filters";
import { extractProgram } from "../lib/openui-content";
import { library } from "../library";

export function DashboardMessage({
  message,
  isStreaming,
  session,
}: {
  message: AssistantMessage;
  isStreaming: boolean;
  session: ChatSession;
}) {
  const saved = session.filters.get(message.id);
  const [initialState, setInitialState] = useState(() =>
    saved ? { $country: saved.country, $month: saved.month } : undefined,
  );
  const [revision, setRevision] = useState(0);
  const [queryError, setQueryError] = useState("");
  const [parseError, setParseError] = useState("");
  const queryRevision = useRef(0);
  const program = extractProgram(message.content ?? "");
  const toolProvider = useMemo(
    () => ({
      sales_dashboard: async (args: Record<string, unknown>) => {
        const current = ++queryRevision.current;
        setQueryError("");
        try {
          const response = await fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load sales data.");
          return data;
        } catch (error) {
          if (current === queryRevision.current)
            setQueryError(error instanceof Error ? error.message : "Could not load sales data.");
          throw error;
        }
      },
    }),
    [],
  );

  return (
    <div className="analytics-message">
      {message.id === exampleMessageId && (
        <p className="reference-note">
          Example dashboard · This layout is included with the cookbook. Its values come from the
          real dataset.
        </p>
      )}
      {queryError && (
        <div className="query-error" role="alert">
          <p>{queryError} Any visible results may belong to the previous filter.</p>
          <button
            type="button"
            className="example-button"
            onClick={() => {
              const current = session.filters.get(message.id);
              setInitialState(
                current ? { $country: current.country, $month: current.month } : undefined,
              );
              setQueryError("");
              setRevision((value) => value + 1);
            }}
          >
            Retry data query
          </button>
        </div>
      )}
      {!isStreaming && parseError && (
        <p className="query-error" role="alert">
          Could not render this response: {parseError} Ask again or open the example dashboard.
        </p>
      )}
      <Renderer
        key={revision}
        response={program}
        library={library}
        isStreaming={isStreaming}
        initialState={initialState}
        toolProvider={toolProvider}
        queryLoader={<p role="status">Refreshing sales data…</p>}
        onStateUpdate={(state) => {
          const parsed = filterSchema.safeParse({ country: state.$country, month: state.$month });
          if (parsed.success) session.filters.set(message.id, parsed.data);
        }}
        onError={(errors) => setParseError(errors.map((error) => error.message).join(" "))}
      />
      <details className="program-source">
        <summary>Inspect the OpenUI Lang</summary>
        <pre>{program}</pre>
      </details>
      <p className="dataset-note">
        Gross sales in GBP, not net revenue. Positive-price, positive-quantity invoice lines;
        cancellations excluded.{" "}
        <a href="https://doi.org/10.24432/C5BW33" target="_blank" rel="noreferrer">
          Chen, D. (2015), UCI Online Retail
        </a>
        ,{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        . Source data is filtered and aggregated locally.
      </p>
    </div>
  );
}
