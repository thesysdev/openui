"use client";

import { createLibrary, defineComponent, type PromptOptions } from "@openuidev/react-lang";
import { Card, MarkDownRenderer } from "@openuidev/react-ui";
import { z } from "zod/v4";
import { HtmlArtifact } from "./html-artifact";
import { promptOptions as sharedPromptOptions } from "./lib/prompt-options";

const Markdown = defineComponent({
  name: "Markdown",
  description: "Renders conversational markdown text. Use this for normal replies.",
  props: z.object({
    text: z.string(),
  }),
  component: ({ props }) => <MarkDownRenderer textMarkdown={props.text} />,
});

const Response = defineComponent({
  name: "Response",
  description: "Root container for every reply. Children stack vertically.",
  props: z.object({
    children: z.array(z.union([Markdown.ref, HtmlArtifact.ref])),
  }),
  component: ({ props, renderNode }) => (
    <Card
      width="full"
      style={{ display: "flex", flexDirection: "column", gap: "var(--openui-space-m)" }}
    >
      {renderNode(props.children)}
    </Card>
  ),
});

export const library = createLibrary({
  root: "Response",
  components: [Response, Markdown, HtmlArtifact],
});

export const promptOptions: PromptOptions = sharedPromptOptions;
