"use client";

import "katex/dist/katex.min.css";
import { defineComponent } from "@openuidev/react-lang";
import katex from "katex";
import { str } from "../style";
import { MathSchema } from "./schema";

export * from "./schema";

export const MathBlock = defineComponent({
  name: "Math",
  props: MathSchema,
  description: 'LaTeX formula, e.g. Math("E = mc^2"); inline true to sit in a Text list.',
  component: ({ props }) => {
    const html = katex.renderToString(str(props.tex), { displayMode: !props.inline, throwOnError: false, trust: false, strict: "ignore", output: "htmlAndMathml" });
    // KaTeX escapes its input and is configured without \href or \includegraphics.
    return props.inline ? <span className="iui-math" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="iui-math is-block" dangerouslySetInnerHTML={{ __html: html }} />;
  },
});
