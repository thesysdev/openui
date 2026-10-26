"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useState } from "react";
import { z } from "zod/v4";
import { passed, type Action } from "../core/schemas";
import { Pending } from "./Pending";

// Recommended actions a person approves or dismisses. Deciding only writes to
// the card's own log: a kit shows what it would do, the host app does it.

const KIND_LABEL = {
  task: "Task",
  audience: "Flag audience",
  experiment: "Experiment",
  change: "Change",
} as const;

/** Open actions shown before "Show more": enough to decide on, short enough to sit beside other cards. */
const SHOWN = 3;

function ActionList({ actions }: { actions: Action[] }) {
  const [decided, setDecided] = useState<Record<string, "approved" | "dismissed">>({});
  const [log, setLog] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const time = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const decide = (action: Action, choice: "approved" | "dismissed") => {
    setDecided((d) => ({ ...d, [action.id]: choice }));
    setLog((l) => [
      choice === "approved" && action.effect
        ? `${time()} · Approved: ${action.effect}`
        : `${time()} · ${choice === "approved" ? "Approved" : "Dismissed"}: ${action.title}`,
      ...l,
    ]);
  };
  const undo = (action: Action) => {
    setDecided(({ [action.id]: _undone, ...rest }) => rest);
    setLog((l) => [`${time()} · Undid: ${action.title}`, ...l]);
  };

  // Open actions first, in rank order, then the decided ones, each on one line.
  const open = actions.filter((a) => !decided[a.id]);
  const done = actions.filter((a) => decided[a.id]);
  const shown = expanded ? open : open.slice(0, SHOWN);
  const hidden = open.length - shown.length;
  const approved = done.filter((a) => decided[a.id] === "approved").length;

  return (
    <div className="kit-actions">
      <ul className="kit-actions__list">
        {shown.map((a) => (
          <li key={a.id} className="kit-action">
            <div className="kit-action__body">
              <span className="kit-action__title">
                {a.kind && (
                  <span className={`kit-action__kind kit-action__kind--${a.kind}`}>
                    {KIND_LABEL[a.kind]}
                  </span>
                )}
                {a.title}
              </span>
              <span className="kit-action__detail" title={a.detail}>
                {a.detail}
              </span>
              <span className="kit-action__meta">
                <span className="kit-action__impact">{a.impactText}</span>
                <span className="kit-muted">
                  {a.owner} · {a.effort} effort
                </span>
              </span>
            </div>
            <div className="kit-action__buttons">
              <button
                type="button"
                className="kit-action__approve"
                onClick={() => decide(a, "approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className="kit-action__dismiss"
                onClick={() => decide(a, "dismissed")}
              >
                Dismiss
              </button>
            </div>
          </li>
        ))}
        {done.map((a) => (
          <li key={a.id} className={`kit-action kit-action--decided kit-action--${decided[a.id]}`}>
            <span className="kit-action__done">
              <span aria-hidden>{decided[a.id] === "approved" ? "✓" : "–"}</span>{" "}
              {decided[a.id] === "approved" ? "Approved" : "Dismissed"}
            </span>
            <span className="kit-action__done-title">{a.title}</span>
            <button type="button" className="kit-action__undo" onClick={() => undo(a)}>
              Undo
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="kit-actions__more" onClick={() => setExpanded(true)}>
          Show {hidden} more
        </button>
      )}
      {log.length === 0 ? (
        <p className="kit-actions__note">Decisions are recorded here only; nothing is sent.</p>
      ) : (
        <details className="kit-actions__log">
          <summary>
            {approved} approved · {done.length - approved} dismissed · nothing is sent
          </summary>
          <ul aria-live="polite">
            {log.map((line, k) => (
              <li key={`${k}-${line}`}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export const ActionCards = defineComponent({
  name: "ActionCards",
  description:
    "Recommended actions to approve or dismiss, each with why, its expected effect, owner, and effort, and a log of decisions (the demo sends nothing): ActionCards(actions.actions).",
  props: z.object({
    actions: z.array(passed("An action from get_actions")).default([]),
  }),
  component: ({ props }) => {
    const actions = (props.actions ?? []) as unknown as Action[];
    if (actions.length === 0)
      return <Pending kind="cards" rows={3} empty="Nothing needs a decision." />;
    return <ActionList actions={actions} />;
  },
});
