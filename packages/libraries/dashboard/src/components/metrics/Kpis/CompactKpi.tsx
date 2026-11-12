"use client";
import { formatValue } from "../../../shared/format";
import { useFirstFetch } from "../../../shared/queryState";
import { useViewState } from "../../../shared/viewState";
import { DeltaBadge } from "../../shared/DeltaBadge";
import { Sheen, StateFrame } from "../../shared/States";
import { StatusIcon } from "../../shared/StatusIcon";
import type { KpiProps } from "../Kpi";
/**
 * One compact item (strips past six tiles): value on top, label and change
 * below. Takes the same states as a full tile; while one shows, the change is
 * left out so no number leaks past the placeholder.
 */
export function CompactKpi({
  fact,
  streaming,
}: {
  fact: Omit<KpiProps, "streaming">;
  streaming: boolean;
}) {
  const override = useViewState();
  // As on the full tile: the model is writing it, or the first query fetch is under way.
  const firstFetch = useFirstFetch();
  const writing = (streaming && fact.value == null) || firstFetch;
  const inState = !!override && override !== "partial" && override !== "refreshing";
  return (
    <section
      className="openui-dashboard-kpi-compact"
      aria-label={fact.label}
      title={fact.hint ?? undefined}
    >
      {(override ?? (writing ? "loading" : null)) === "loading" ? <Sheen /> : null}
      <StateFrame compact auto={writing ? "loading" : null}>
        <div className="openui-dashboard-kpi-compact-value">
          <span className="openui-dashboard-kpi-text-value">
            {typeof fact.value === "number"
              ? formatValue(fact.value, fact.format)
              : fact.value || "—"}
          </span>
          {fact.tone ? <StatusIcon tone={fact.tone} /> : null}
        </div>
      </StateFrame>
      <div className="openui-dashboard-kpi-compact-meta">
        <span className="openui-dashboard-kpi-compact-label" title={fact.label}>
          {fact.label}
        </span>
        {!inState &&
        !writing &&
        typeof fact.value === "number" &&
        typeof fact.previous === "number" ? (
          <DeltaBadge
            current={fact.value}
            previous={fact.previous}
            format={fact.format}
            goodWhen={fact.goodWhen}
            inline
          />
        ) : null}
      </div>
    </section>
  );
}
