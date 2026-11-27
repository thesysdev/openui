"use client";

import type { PlaybackState } from "@paste/lib/streaming/usePlayback";
import styles from "@paste/paste.module.css";
import { CheckCircle2, Circle, CircleDot, CircleMinus, CirclePlus, XCircle } from "lucide-react";

export function StreamTimeline({ state }: { state: PlaybackState }) {
  if (state.status === "idle") {
    return (
      <div className={styles.panelEmpty}>
        Press <strong>Stream</strong> to replay the current code as simulated LLM output and watch
        the parser converge chunk by chunk.
      </div>
    );
  }
  return (
    <div className={styles.panelScroll}>
      {state.convergence && (
        <div
          className={`${styles.convergence} ${
            state.convergence === "converged"
              ? styles.convergenceConverged
              : styles.convergenceDiverged
          }`}
        >
          {state.convergence === "converged" ? (
            <>
              <CheckCircle2 size={15} /> Streaming result converged with one-shot parse
            </>
          ) : (
            <>
              <XCircle size={15} /> DIVERGED from one-shot parse — parser bug in this version?
            </>
          )}
        </div>
      )}
      {state.fatal && (
        <div className={styles.fatalCard}>
          <strong>Streaming parse threw</strong>
          <pre>{state.fatal}</pre>
        </div>
      )}
      {state.traceTruncated && (
        <p className="toolbar-hint">Trace capped at 5,000 rows — remaining chunks not logged.</p>
      )}
      <table className={styles.traceTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>chunk</th>
            <th>delay</th>
            <th>root</th>
            <th>stmts</th>
            <th>state</th>
            <th>unres</th>
            <th>errs</th>
          </tr>
        </thead>
        <tbody>
          {state.trace.map((row) => (
            <tr
              key={row.i}
              className={
                row.rootAppeared ? styles.rowAppeared : row.rootDropped ? styles.rowDropped : ""
              }
            >
              <td>{row.i}</td>
              <td>
                <code className={styles.chunkPreview}>{visualize(row.chunkPreview)}</code>
              </td>
              <td>{row.delayMs}ms</td>
              <td className={styles.rootCell}>
                {row.rootAppeared ? (
                  <>
                    <CirclePlus size={12} /> appeared
                  </>
                ) : row.rootDropped ? (
                  <>
                    <CircleMinus size={12} /> dropped
                  </>
                ) : row.rootPresent ? (
                  <CircleDot size={12} />
                ) : (
                  <Circle size={12} />
                )}
              </td>
              <td>{row.statementCount}</td>
              <td>{row.incomplete ? "incomplete" : "complete"}</td>
              <td>{row.unresolvedCount}</td>
              <td>{row.errorCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function visualize(text: string): string {
  return text.replace(/\n/g, "⏎").replace(/\t/g, "⇥");
}
