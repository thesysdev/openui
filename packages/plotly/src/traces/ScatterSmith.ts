"use client";
import { defineComponent } from "@openuidev/react-lang";
import type { Data, Layout } from "plotly.js";
import React from "react";
import { z } from "zod/v4";
import { PlotShell } from "../shell/PlotShell";

const ScatterSmithSchema = z.object({
  real: z.array(z.number()),
  imag: z.array(z.number()),
  text: z.array(z.string()).optional(),
  mode: z.enum(["markers", "lines", "lines+markers"]).optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  height: z.number().positive().optional(),
});

export const ScatterSmith = defineComponent({
  name: "ScatterSmith",
  props: ScatterSmithSchema,
  description:
    "Smith chart — complex impedance / reflection coefficient scatter. Used in RF/microwave engineering. Pass parallel `real` and `imag` arrays of normalized impedance values.",
  component: ({ props }) => {
    const trace = {
      type: "scattersmith",
      real: props.real,
      imag: props.imag,
      mode: props.mode ?? "markers",
      text: props.text,
      marker: props.color ? { color: props.color } : undefined,
      line: props.color ? { color: props.color } : undefined,
    } as unknown as Data;
    const layout: Partial<Layout> = {
      title: props.title ? { text: props.title } : undefined,
    };
    return React.createElement(PlotShell, { data: [trace], layout, height: props.height ?? 420 });
  },
});
