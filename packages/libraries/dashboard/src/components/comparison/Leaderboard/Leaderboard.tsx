"use client";
import { useState } from "react";
import { rowsNote } from "../../../components/shared/PartNote";
import { RankedList } from "../../../components/shared/RankedList";
import { useRowHover } from "../../../components/shared/RowHover";
import { Empty } from "../../../components/shared/States";
import { TooltipCard } from "../../../components/shared/TooltipCard";
import { MUTED_COLOR } from "../../../shared/colors";
import type { ValueFormat } from "../../../shared/format";
import { toNumbers, toStrings } from "../../../shared/values";

export interface LeaderboardProps {
  labels: string[];
  values: number[];
  format?: ValueFormat;
  previous?: number[];
  goodWhen?: "up" | "down" | "neutral";
  limit?: number;
}

export function Leaderboard(props: LeaderboardProps) {
  const labels = toStrings(props.labels);
  const values = toNumbers(props.values);
  const previous = toNumbers(props.previous);
  // A missing value is not a zero: it is left out of the ranking and named in a note.
  const all = labels.map((label, i) => ({
    label,
    value: values[i],
    previous: previous[i] ?? null,
  }));
  const dropped = all.filter((item) => item.value === null).map((item) => item.label);
  const items = all
    .filter(
      (item): item is { label: string; value: number; previous: number | null } =>
        item.value !== null,
    )
    .sort((a, b) => b.value - a.value)
    // Every item by default: a long list scrolls inside the card (fade and stepper), so nothing is cut
    // silently. limit, when given, keeps only the top N.
    .slice(0, props.limit ?? undefined);
  const [desc, setDesc] = useState(true);
  const hover = useRowHover();
  if (!items.length) return <Empty />;
  const top = Math.max(...items.map((item) => item.value), 0);
  // Same list as the maps': sort toggle, delta before value, internal scroll once it outgrows its card.
  return (
    <RankedList
      hover={hover}
      items={items.map((item) => ({
        key: item.label,
        name: item.label,
        value: item.value,
        previous: item.previous,
        tip: () => (
          <TooltipCard
            title={item.label}
            format={props.format}
            goodWhen={props.goodWhen}
            rows={[
              {
                // "Now" only reads against a Previous row; alone, it is just the value.
                name: item.previous !== null ? "Now" : "Value",
                color: "var(--openui-dashboard-series-1)",
                value: item.value,
                previous: item.previous,
              },
              ...(item.previous !== null
                ? [{ name: "Previous", color: MUTED_COLOR, value: item.previous }]
                : []),
            ]}
          />
        ),
      }))}
      max={top}
      format={props.format}
      goodWhen={props.goodWhen}
      desc={desc}
      onSort={() => setDesc((value) => !value)}
    >
      {rowsNote(dropped)}
    </RankedList>
  );
}
