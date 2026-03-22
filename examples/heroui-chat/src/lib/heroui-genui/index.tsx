"use client";

import { Card } from "@heroui/react";
import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { TextContent } from "./components/text-content";
import { ChatContentChildUnion } from "./unions";

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatContentChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <Card className="p-4 space-y-3">{renderNode(props.children)}</Card>
  ),
});

// ── Component Groups ──

export const herouiComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: ["TextContent", "MarkDownRenderer"],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
];

// ── Prompt Options ──

export const herouiExamples: string[] = [];

export const herouiAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically.",
  "Card is the only layout container.",
];

export const herouiPromptOptions: PromptOptions = {
  examples: herouiExamples,
  additionalRules: herouiAdditionalRules,
};

// ── Library ──

export const herouiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: herouiComponentGroups,
  components: [ChatCard, TextContent, MarkDownRenderer, Button, Buttons],
});
