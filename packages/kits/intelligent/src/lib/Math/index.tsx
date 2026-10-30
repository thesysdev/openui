"use client";

import { defineComponent } from "@openuidev/react-lang";
import { MathBlock as MathView } from "../../components/Math";
import { str } from "../../shared/style";
import { MathSchema } from "./schema";

export * from "./schema";

export const MathBlock = defineComponent({
  name: "Math",
  props: MathSchema,
  description: 'LaTeX formula, e.g. Math("E = mc^2"); inline true to sit in a Text list.',
  component: ({ props }) => <MathView tex={str(props.tex)} inline={props.inline} />,
});
