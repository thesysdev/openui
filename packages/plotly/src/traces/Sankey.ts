"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const NodeSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  color: z.string().optional(),
});
const LinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

const SankeySchema = z.object({
  nodes: z.array(NodeSchema),
  links: z.array(LinkSchema),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const Sankey = defineComponent({
  name: "Sankey",
  props: SankeySchema,
  description:
    "Sankey flow diagram. `nodes`: [{ id, label?, color? }, ...]; `links`: [{ source, target, value, color? }] where source/target reference node ids. Width of each link is proportional to value.",
  component: ({ props }) => {
    const nodes = props.nodes ?? [];
    const links = props.links ?? [];
    if (nodes.length === 0) return null;
    const idToIndex = new Map(nodes.map((n, i) => [n.id, i]));
    const validLinks = links.filter(
      (l) => idToIndex.has(l.source) && idToIndex.has(l.target) && l.value > 0,
    );
    if (validLinks.length === 0) return null;

    const trace: Data = {
      type: "sankey",
      orientation: "h",
      arrangement: "snap",
      node: {
        label: nodes.map((n) => n.label ?? n.id),
        color: nodes.map((n) => n.color ?? undefined) as never,
        pad: 14,
        thickness: 16,
        line: { color: "rgba(15,23,42,0.10)", width: 0.5 },
      },
      link: {
        source: validLinks.map((l) => idToIndex.get(l.source) as number),
        target: validLinks.map((l) => idToIndex.get(l.target) as number),
        value: validLinks.map((l) => l.value),
        color: validLinks.map((l) => l.color ?? "rgba(76,120,168,0.45)"),
      },
    };
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
      margin: { t: props.title ? 40 : 8, l: 8, r: 8, b: 8 },
      font: { size: 11 },
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height });
  },
});
