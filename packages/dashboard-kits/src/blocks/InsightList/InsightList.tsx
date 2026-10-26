import type { Insight } from "../../core/schemas";

const TONE_LABEL = {
  positive: "Good news",
  negative: "Needs action",
  warning: "Watch",
  info: "Note",
} as const;

function ToneIcon({ tone }: { tone: keyof typeof TONE_LABEL }) {
  return (
    <span className={`kit-tone-icon kit-tone-icon--${tone}`} aria-hidden>
      <svg viewBox="0 0 16 16">
        {tone === "positive" && <path d="M3.5 10.5 7 7l2 2 3.5-3.5M9.5 5.5h3v3" />}
        {tone === "negative" && <path d="M3.5 5.5 7 9l2-2 3.5 3.5M9.5 10.5h3v-3" />}
        {tone === "warning" && <path d="M8 3.2 14 13H2L8 3.2Zm0 4v2.6m0 1.9v.1" />}
        {tone === "info" && <path d="M8 7.2V11.5M8 4.6v.1M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z" />}
      </svg>
    </span>
  );
}

export interface InsightListProps {
  insights: Insight[];
  /** Show at most this many, most important first. */
  limit?: number;
}

/**
 * What changed and why: each insight with its tone (good news, needs action,
 * watch, note), a headline, an explanation, and a key figure.
 */
export function InsightList({ insights, limit = 8 }: InsightListProps) {
  return (
    <ul className="kit-insights">
      {insights.slice(0, limit).map((insight, i) => (
        <li key={i} className="kit-insight">
          <ToneIcon tone={insight.tone} />
          <div className="kit-insight__body">
            <span className={`kit-insight__tone kit-insight__tone--${insight.tone}`}>
              {TONE_LABEL[insight.tone] ?? insight.tone}
            </span>
            <span className="kit-insight__title">{insight.title}</span>
            <span className="kit-insight__detail">{insight.detail}</span>
          </div>
          {insight.metric && <span className="kit-insight__metric">{insight.metric}</span>}
        </li>
      ))}
    </ul>
  );
}
