import { useMemo, useRef } from "react";
import type { TooltipItem } from "../../shared/core/PortalTooltip/ChartTooltip";
import type { ChartData } from "../../types";

export interface TooltipPayload {
  label: string;
  items: TooltipItem[];
}

/**
 * Content equality for tooltip payloads — the memo key `useTooltipPayload`
 * uses to keep a stable object identity across data ticks. Pure; unit-tested.
 */
export function tooltipPayloadEqual(a: TooltipPayload | null, b: TooltipPayload | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.label !== b.label || a.items.length !== b.items.length) return false;
  for (let i = 0; i < a.items.length; i++) {
    const x = a.items[i]!;
    const y = b.items[i]!;
    if (x.name !== y.name || x.value !== y.value || x.color !== y.color) {
      return false;
    }
  }
  return true;
}

export function useTooltipPayload<T extends ChartData>(
  hoveredIndex: number | null,
  data: T,
  dataKeys: string[],
  catKey: string,
  chartConfig: Record<string, { color?: string } | undefined>,
): TooltipPayload | null {
  // Content-keyed identity: under streaming, `data` identity changes every
  // tick, which used to rebuild the payload (new `items` array) even when the
  // hovered row's values hadn't changed — defeating ChartTooltip's memo and
  // re-rendering the portal + re-running floating-ui layout reads per frame.
  // Reuse the previous object whenever the CONTENT is unchanged.
  const lastRef = useRef<TooltipPayload | null>(null);
  return useMemo(() => {
    if (hoveredIndex === null || hoveredIndex >= data.length) return null;
    const row = data[hoveredIndex]!;
    const next: TooltipPayload = {
      label: String(row[catKey]),
      items: dataKeys.map((key) => ({
        name: key,
        value: Number(row[key]) || 0,
        color: chartConfig[key]?.color ?? "#000",
      })),
    };
    if (tooltipPayloadEqual(lastRef.current, next)) return lastRef.current;
    lastRef.current = next;
    return next;
  }, [hoveredIndex, data, dataKeys, catKey, chartConfig]);
}
