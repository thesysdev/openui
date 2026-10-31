"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Code as CodeView } from "../../components/Code";
import { str } from "../../shared/style";
import { CodeSchema } from "./schema";

export * from "./schema";

export const Code = defineComponent({
  name: "Code",
  props: CodeSchema,
  description: "Code block with a copy button.",
  component: ({ props }) => <CodeView code={str(props.code)} language={str(props.language)} />,
});
