"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Artifact } from "@openuidev/react-ui";
import { ArtifactView } from "./ArtifactView";
import { InlinePreview } from "./InlinePreview";
import { ArtifactCodeBlockSchema } from "./schema";

export { ArtifactCodeBlockSchema } from "./schema";
export type { ArtifactCodeBlockProps } from "./schema";

export const ArtifactCodeBlock = defineComponent({
  name: "ArtifactCodeBlock",
  props: ArtifactCodeBlockSchema,
  description:
    "Code block that opens in the artifact side panel for full viewing with syntax highlighting",
  component: Artifact({
    title: (props) => props.title as string,
    preview: (props, { open, isActive }) => (
      <InlinePreview
        language={props.language as string}
        title={props.title as string}
        codeString={props.codeString as string}
        open={open}
        isActive={isActive}
      />
    ),
    panel: (props) => (
      <ArtifactView
        language={props.language as string}
        codeString={props.codeString as string}
        title={props.title as string}
      />
    ),
  }),
});
