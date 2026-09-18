"use client";

import { readReply } from "@/lib/autofix-chat";
import type { RepairReport } from "@/lib/contract";
import { findErrors, type Diagnostic } from "@/lib/validation";
import { library } from "@/library";
import type { AssistantMessage } from "@openuidev/react-headless";
import { Renderer } from "@openuidev/react-lang";
import { useMemo, useState } from "react";

const statusLabels = {
  valid: "Valid UI · Autofix skipped",
  already_valid: "Validated by Autofix",
  fixed: "Repaired automatically",
  fix_failed: "Repair incomplete",
};

function Diagnostics({
  errors,
  empty,
}: {
  errors: Diagnostic[];
  empty: string;
}) {
  if (!errors.length) return <p className="repair-muted">{empty}</p>;
  return (
    <ul className="repair-diagnostics">
      {errors.map((error, index) => (
        <li key={`${error.code}-${index}`}>
          <code>{error.code}</code>
          {error.statementId && <span> at {error.statementId}</span>}
          <p>{error.message}</p>
        </li>
      ))}
    </ul>
  );
}

function RepairResult({ report }: { report: RepairReport }) {
  const { generation, output, status, fixedErrors, remainingErrors, usage } =
    report;
  const before = useMemo(() => findErrors(generation), [generation]);
  const after = useMemo(() => (output ? findErrors(output) : []), [output]);
  const [runtimeErrors, setRuntimeErrors] = useState<Diagnostic[]>([]);
  const [copyState, setCopyState] = useState("");

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("Copied");
    } catch {
      setCopyState("Select the code below to copy it manually.");
    }
  }

  return (
    <article className="repair-message" aria-label="Autofix result">
      <header className="repair-heading">
        <strong className={`repair-status repair-status--${status}`}>
          {statusLabels[status]}
        </strong>
        <span className="repair-muted">
          {status === "valid"
            ? "No repair request made"
            : `${fixedErrors.length} errors fixed`}
        </span>
      </header>
      {status === "fix_failed" ? (
        <div role="status">
          <p>
            Autofix could not complete this repair. The original code is
            preserved below.
          </p>
          <Diagnostics
            errors={remainingErrors}
            empty="No further diagnostics were returned."
          />
        </div>
      ) : output && after.length === 0 ? (
        <div className="repair-preview">
          <Renderer
            response={output}
            library={library}
            isStreaming={false}
            onError={setRuntimeErrors}
          />
          {runtimeErrors.length > 0 && (
            <div role="alert">
              <Diagnostics errors={runtimeErrors} empty="" />
            </div>
          )}
        </div>
      ) : (
        <div role="alert">
          <p>
            The returned code did not pass local validation and cannot be
            previewed.
          </p>
          <Diagnostics
            errors={after}
            empty="No renderable output was returned."
          />
        </div>
      )}
      <details className="repair-details" open={status === "fix_failed"}>
        <summary>Original model output</summary>
        <pre>
          <code>{generation}</code>
        </pre>
        <Diagnostics
          errors={before}
          empty="The original program passed local validation."
        />
      </details>
      {output && (
        <details className="repair-details">
          <summary>
            {status === "fixed" ? "Repaired code" : "Final code"}
          </summary>
          <pre>
            <code>{output}</code>
          </pre>
          <button className="repair-copy" onClick={copyOutput}>
            Copy code
          </button>
          <span role="status" className="repair-muted">
            {" "}
            {copyState}
          </span>
        </details>
      )}
      <details className="repair-details">
        <summary>
          Repair diagnostics
          {usage ? ` · ${usage.total_tokens} Autofix tokens` : ""}
        </summary>
        <h4>Fixed</h4>
        <Diagnostics errors={fixedErrors} empty="No repairs needed." />
        <h4>Remaining</h4>
        <Diagnostics errors={remainingErrors} empty="No remaining errors." />
      </details>
    </article>
  );
}

export function RepairMessage({
  message,
  isStreaming,
}: {
  message: AssistantMessage;
  isStreaming: boolean;
}) {
  const reply = useMemo(() => {
    try {
      return readReply(message.content ?? "");
    } catch {
      return null;
    }
  }, [message.content]);
  if (!reply) return <p role="alert">The generation could not be displayed.</p>;
  if (reply.report)
    return <RepairResult key={message.id} report={reply.report} />;
  if (!isStreaming)
    return (
      <p role="status">
        Generation stopped before a validated result was ready.
      </p>
    );
  return (
    <article className="repair-message">
      <p role="status" className="repair-muted">
        {reply.repairing
          ? "Repairing the generated interface…"
          : "Generating your interface…"}
      </p>
      {reply.generation && !reply.repairing && (
        <Renderer response={reply.generation} library={library} isStreaming />
      )}
    </article>
  );
}
