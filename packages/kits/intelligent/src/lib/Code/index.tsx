"use client";

import { CodeBlock } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { CodeSchema } from "./schema";
import { str } from "../../shared/style";

export * from "./schema";

export const Code = defineComponent({
  name: "Code",
  props: CodeSchema,
  description: "Code block with a copy button.",
  component: ({ props }) => (
    <CodeBlock language={str(props.language) || "text"} codeString={str(props.code)} />
  ),
});
