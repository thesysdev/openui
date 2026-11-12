"use client";
import { useId, useMemo, useState } from "react";
import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import { seriesColor } from "../../../shared/chartHelpers";
import { MUTED_COLOR, textureOf } from "../../../shared/colors";
import { useCompare } from "../../../shared/compare";
import { formatValue, type ValueFormat } from "../../../shared/format";
import { columnFormatter } from "../../../shared/scales";
import { PartNote } from "../../shared/PartNote";
import { SrTable } from "../../shared/SrTable";
import { Empty } from "../../shared/States";
import { TextureTile } from "../../shared/TextureTile";
import { TooltipCard } from "../../shared/TooltipCard";
export interface FlowProps {
  links: { from: string; to: string; value: number; previous?: number }[];
  format?: ValueFormat;
}
/** Nodes whose names say "this is where people left" are drawn muted. */
const LOSS = /\b(drop|dropped|exit|exited|lost|churn|churned|bounce|bounced|abandon)/i;

/** A node label: name, then count and share of everyone who entered, on one line, the two parts 6px apart. */
const FLOW_LABEL_GAP = 6;

export function Flow(props: FlowProps) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const flowId = `fl${useId().replace(/:/g, "")}`;
  const compare = useCompare();
  const data = useMemo(() => {
    const given = (Array.isArray(props.links) ? props.links : []).filter(Boolean);
    const unusable: string[] = [];
    const loops: string[] = [];
    // Links only move forward. A link whose target already reaches its source would close a loop,
    // which a Sankey can't draw, so it's skipped and named instead.
    const next = new Map<string, Set<string>>();
    const reaches = (from: string, to: string, seen = new Set<string>()): boolean => {
      if (from === to) return true;
      if (seen.has(from)) return false;
      seen.add(from);
      return [...(next.get(from) ?? [])].some((step) => reaches(step, to, seen));
    };
    const kept: { from: string; to: string; value: number; previous?: number }[] = [];
    for (const link of given) {
      const tag = `${link.from || "?"} → ${link.to || "?"}`;
      if (!link.from || !link.to || typeof link.value !== "number" || !(link.value > 0)) {
        unusable.push(tag);
        continue;
      }
      if (reaches(link.to, link.from)) {
        loops.push(tag);
        continue;
      }
      if (!next.has(link.from)) next.set(link.from, new Set());
      next.get(link.from)!.add(link.to);
      kept.push(link);
    }
    const names: string[] = [];
    const indexOf = (name: string) => {
      let index = names.indexOf(name);
      if (index === -1) index = names.push(name) - 1;
      return index;
    };
    const links = kept.map((link) => ({
      source: indexOf(link.from),
      target: indexOf(link.to),
      value: link.value,
      previous: typeof link.previous === "number" ? link.previous : null,
    }));
    const inbound = names.map((_, n) =>
      links.filter((link) => link.target === n).reduce((sum, link) => sum + link.value, 0),
    );
    const outbound = names.map((_, n) =>
      links.filter((link) => link.source === n).reduce((sum, link) => sum + link.value, 0),
    );
    // Last period's volumes, only when every link carries one: a partial previous would compare unlike totals.
    const comparable = links.length > 0 && links.every((link) => link.previous !== null);
    const sumPrev = (keep: (link: (typeof links)[number]) => boolean) =>
      links.filter(keep).reduce((sum, link) => sum + (link.previous ?? 0), 0);
    const inboundPrev = names.map((_, n) => sumPrev((link) => link.target === n));
    const outboundPrev = names.map((_, n) => sumPrev((link) => link.source === n));
    // Columns by longest path from an entry, so the height can follow the busiest column.
    const depth = names.map(() => 0);
    for (let pass = 0; pass < names.length; pass++)
      for (const link of links)
        depth[link.target] = Math.max(depth[link.target]!, depth[link.source]! + 1);
    const perColumn = new Map<number, number>();
    depth.forEach((d) => perColumn.set(d, (perColumn.get(d) ?? 0) + 1));
    const last = Math.max(0, ...depth);
    return {
      nodes: names.map((name) => ({ name })),
      links,
      inbound,
      outbound,
      comparable,
      inboundPrev,
      outboundPrev,
      depth,
      last,
      busiest: Math.max(1, ...perColumn.values()),
      unusable,
      loops,
    };
  }, [props.links]);

  const notes = (
    <>
      {data.unusable.length ? (
        <PartNote>
          {data.unusable.length === 1
            ? "1 link not drawn, zero or below or unnamed: "
            : `${data.unusable.length} links not drawn, zero or below or unnamed: `}
          {data.unusable.join(", ")}
        </PartNote>
      ) : null}
      {data.loops.length ? (
        <PartNote>
          {data.loops.length === 1
            ? "1 link not drawn, it loops back to an earlier step: "
            : `${data.loops.length} links not drawn, they loop back to an earlier step: `}
          {data.loops.join(", ")}
        </PartNote>
      ) : null}
    </>
  );
  if (!data.links.length)
    return data.unusable.length || data.loops.length ? (
      <div className="openui-dashboard-chart">{notes}</div>
    ) : (
      <Empty />
    );
  const format = props.format ?? "number";
  const isEntry = (index: number) => data.inbound[index]! === 0;
  // Compare: each link's and step's change against last period, in the tooltips only (two flows drawn over each other can't be read).
  const showPrevious = compare.enabled && data.comparable;
  const prevValueOf = (index: number) =>
    showPrevious ? Math.max(data.inboundPrev[index]!, data.outboundPrev[index]!) : null;
  const valueOf = (index: number) => Math.max(data.inbound[index]!, data.outbound[index]!);
  // Shares are of everyone who entered: the sum of the entry nodes.
  const entered =
    data.nodes.reduce((sum, _, index) => sum + (isEntry(index) ? data.outbound[index]! : 0), 0) ||
    1;
  const shareText = columnFormatter(
    data.nodes.map((_, index) => (valueOf(index) / entered) * 100),
    "percent",
  );
  const numbers = (index: number) =>
    `${formatValue(valueOf(index), format)} · ${shareText((valueOf(index) / entered) * 100)}`;
  // Entry nodes take categorical colours in first-seen order; every later step is the primary hue
  // and losses are grey, so colour says "where people came from".
  const entries = data.nodes.map((_, index) => index).filter(isEntry);
  const nodeColor = (index: number, name: string) => {
    if (LOSS.test(name)) return MUTED_COLOR;
    const entry = entries.indexOf(index);
    return entry === -1 ? seriesColor(0) : seriesColor(entry + 1);
  };
  // Each colour keeps its own texture, as series do everywhere: the primary hue dots, each source its own,
  // losses vertical lines.
  const nodeTexture = (index: number, name: string) => {
    if (LOSS.test(name)) return 5;
    const entry = entries.indexOf(index);
    return entry === -1 ? 0 : textureOf(entry + 1);
  };
  const lostFrom = (index: number) =>
    data.links
      .filter((link) => link.source === index && LOSS.test(data.nodes[link.target]!.name))
      .reduce((sum, link) => sum + link.value, 0);
  // Hovering a node lights every link into and out of it; hovering a link lights that link and its two ends.
  const linkLit = (index: number) => {
    const link = data.links[index]!;
    if (hoveredNode !== null) return link.source === hoveredNode || link.target === hoveredNode;
    return hoveredLink === null || hoveredLink === index;
  };
  const nodeLit = (index: number) => {
    if (hoveredNode !== null)
      return (
        hoveredNode === index ||
        data.links.some(
          (link) =>
            (link.source === hoveredNode && link.target === index) ||
            (link.target === hoveredNode && link.source === index),
        )
      );
    if (hoveredLink !== null)
      return data.links[hoveredLink]!.source === index || data.links[hoveredLink]!.target === index;
    return true;
  };
  const anyHover = hoveredNode !== null || hoveredLink !== null;
  // Room for the busiest column's labels; past that, the flow fills its card.
  const height = Math.max(280, data.busiest * 56);

  return (
    <div className="openui-dashboard-chart">
      <SrTable
        caption="Flow between stages"
        head={["From", "To", "Volume"]}
        rows={data.links.map((link) => [
          data.nodes[link.source]!.name,
          data.nodes[link.target]!.name,
          formatValue(link.value, format),
        ])}
      />
      <div
        style={{ flex: "1 1 auto", minHeight: height }}
        onMouseLeave={() => [setHoveredNode(null), setHoveredLink(null)]}
      >
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes: data.nodes, links: data.links }}
            nodePadding={24}
            nodeWidth={6}
            linkCurvature={0.5}
            iterations={64}
            margin={{ top: 12, right: 8, bottom: 12, left: 8 }}
            node={(nodeProps: {
              x: number;
              y: number;
              width: number;
              height: number;
              index: number;
              payload: { name: string };
            }) => {
              const { x, y, width, height: h, index, payload } = nodeProps;
              const color = nodeColor(index, payload.name);
              const text = numbers(index);
              const cy = y + h / 2;
              return (
                <g
                  opacity={anyHover && !nodeLit(index) ? 0.35 : 1}
                  style={{ transition: "opacity 150ms" }}
                  onMouseEnter={() => setHoveredNode(index)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect x={x} y={y} width={width} height={Math.max(h, 2)} rx={3} fill={color} />
                  {/* The label beside its node with a halo in the surface colour, so it reads over the links. The last
                        column's labels sit inside, to the left of their nodes, so the chart runs the card's full width. */}
                  <text
                    // End steps (no outgoing links) sit in the rightmost column, whatever their depth.
                    x={data.outbound[index]! === 0 ? x - 8 : x + width + 8}
                    y={cy}
                    dy={4}
                    fontSize={12}
                    textAnchor={data.outbound[index]! === 0 ? "end" : "start"}
                    stroke="var(--openui-dashboard-surface)"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    <tspan fill="var(--openui-dashboard-ink)" fontWeight={500}>
                      {payload.name}
                    </tspan>
                    <tspan
                      dx={FLOW_LABEL_GAP}
                      fill="var(--openui-dashboard-ink-muted)"
                      fontSize={11}
                    >
                      {text}
                    </tspan>
                  </text>
                </g>
              );
            }}
            link={(linkProps: {
              sourceX: number;
              targetX: number;
              sourceY: number;
              targetY: number;
              sourceControlX: number;
              targetControlX: number;
              linkWidth: number;
              index: number;
              payload: { source: { name: string }; target: { name: string } };
            }) => {
              const {
                sourceX,
                targetX,
                sourceY,
                targetY,
                sourceControlX,
                targetControlX,
                linkWidth,
                index,
                payload,
              } = linkProps;
              const lossy = LOSS.test(payload.target.name);
              const sourceIndex = data.nodes.findIndex((node) => node.name === payload.source.name);
              const color = lossy ? MUTED_COLOR : nodeColor(sourceIndex, payload.source.name);
              const texture = lossy ? 5 : nodeTexture(sourceIndex, payload.source.name);
              const lit = linkLit(index);
              const d = `M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`;
              const w = Math.max(linkWidth, 1);
              const top = Math.min(sourceY, targetY) - w;
              return (
                <g
                  onMouseEnter={() => setHoveredLink(index)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {/* The link's own texture, visible only near its source node and gone within the first third of the link. */}
                  <defs>
                    <TextureTile
                      id={`${flowId}-t-${index}`}
                      index={texture}
                      ink={color}
                      opacity="var(--openui-dashboard-tex-ink)"
                    />
                    <linearGradient
                      id={`${flowId}-g-${index}`}
                      gradientUnits="userSpaceOnUse"
                      x1={sourceX}
                      x2={targetX}
                      y1={0}
                      y2={0}
                    >
                      <stop offset="0" stopColor="#fff" stopOpacity="1" />
                      <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                    <mask
                      id={`${flowId}-m-${index}`}
                      maskUnits="userSpaceOnUse"
                      x={sourceX}
                      y={top}
                      width={targetX - sourceX}
                      height={Math.abs(targetY - sourceY) + w * 2}
                    >
                      <rect
                        x={sourceX}
                        y={top}
                        width={targetX - sourceX}
                        height={Math.abs(targetY - sourceY) + w * 2}
                        fill={`url(#${flowId}-g-${index})`}
                      />
                    </mask>
                  </defs>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={w}
                    // Rest 0.28; the lit links 0.5; the rest fade to a third, the 35% fade used across the kit.
                    strokeOpacity={!anyHover ? 0.28 : lit ? 0.5 : 0.1}
                    style={{ transition: "stroke-opacity 150ms" }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={`url(#${flowId}-t-${index})`}
                    strokeWidth={w}
                    mask={`url(#${flowId}-m-${index})`}
                    opacity={!anyHover || lit ? 1 : 0.35}
                    style={{ transition: "opacity 150ms", pointerEvents: "none" }}
                  />
                </g>
              );
            }}
          >
            <Tooltip
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 5 }}
              content={({ active, payload }) => {
                const item = active
                  ? (payload?.[0]?.payload as
                      | {
                          payload?: {
                            source?: { name: string };
                            target?: { name: string };
                            value?: number;
                            name?: string;
                          };
                        }
                      | undefined)
                  : undefined;
                const inner = item?.payload;
                if (!inner) return null;
                const pct = (part: number, whole: number) => (whole ? (part / whole) * 100 : null);
                if (inner.source && inner.target) {
                  // A link reads as a small sum: the source's total, then what went to the target and its share of it,
                  // each row in its own step's colour.
                  const from = data.nodes.findIndex((node) => node.name === inner.source!.name);
                  const to = data.nodes.findIndex((node) => node.name === inner.target!.name);
                  const moved = inner.value ?? 0;
                  const link = data.links.find((l) => l.source === from && l.target === to);
                  const toLoss = LOSS.test(inner.target.name);
                  return (
                    <TooltipCard
                      title={`${inner.source.name} → ${inner.target.name}`}
                      format={format}
                      rows={[
                        {
                          name: inner.source.name,
                          color: nodeColor(from, inner.source.name),
                          value: valueOf(from),
                          previous: prevValueOf(from),
                        },
                        {
                          name: `To ${inner.target.name}`,
                          color: nodeColor(to, inner.target.name),
                          share: pct(moved, valueOf(from)),
                          value: moved,
                          previous: showPrevious ? (link?.previous ?? null) : null,
                          goodWhen: toLoss ? "down" : undefined,
                        },
                      ]}
                      note={showPrevious ? `Change vs ${compare.label.toLowerCase()}` : undefined}
                    />
                  );
                }
                // A step: what came in, what moved on and what was lost (each with its share of what came in),
                // and the step's share of everyone who entered as a footnote.
                const index = data.nodes.findIndex((node) => node.name === inner.name);
                if (index < 0) return null;
                const name = inner.name ?? "";
                const lost = lostFrom(index);
                const base = valueOf(index);
                const onward = data.outbound[index]! - lost;
                const lostPrev = showPrevious
                  ? data.links
                      .filter((l) => l.source === index && LOSS.test(data.nodes[l.target]!.name))
                      .reduce((sum, l) => sum + (l.previous ?? 0), 0)
                  : null;
                const onwardPrev =
                  showPrevious && lostPrev !== null ? data.outboundPrev[index]! - lostPrev : null;
                return (
                  <TooltipCard
                    title={name}
                    format={format}
                    rows={[
                      {
                        name: isEntry(index) ? "Entered" : "In",
                        color: nodeColor(index, name),
                        value: base,
                        previous: prevValueOf(index),
                      },
                      ...(onward > 0
                        ? [
                            {
                              name: "Moved on",
                              color: seriesColor(0),
                              share: pct(onward, base),
                              value: onward,
                              previous: onwardPrev,
                            },
                          ]
                        : []),
                      // Fewer lost is the good news.
                      ...(lost > 0
                        ? [
                            {
                              name: "Lost",
                              color: MUTED_COLOR,
                              share: pct(lost, base),
                              value: lost,
                              previous: lostPrev,
                              goodWhen: "down" as const,
                            },
                          ]
                        : []),
                    ]}
                    note={`${formatValue((base / entered) * 100, "percent")} of everyone who entered`}
                  />
                );
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
      {notes}
    </div>
  );
}
