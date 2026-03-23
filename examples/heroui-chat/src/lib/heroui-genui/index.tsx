"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { Accordion, AccordionItem } from "./components/accordion";
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";
import { Callout } from "./components/callout";
import { CheckBoxGroup, CheckBoxItem } from "./components/checkbox-group";
import { FollowUpBlock, FollowUpItem } from "./components/follow-up";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { Input } from "./components/input";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { NumberField } from "./components/number-field";
import { RadioGroup, RadioItem } from "./components/radio-group";
import { Select, SelectItem } from "./components/select";
import { Separator } from "./components/separator";
import { Slider } from "./components/slider";
// TODO: HeroUI's Switch causes scroll/layout breakage on long forms when toggled.
// The root cause is unclear — the same pattern works fine with Radix switches in
// @openuidev/react-ui. Disabled until the HeroUI v3 Switch interaction is resolved.
// import { SwitchGroup, SwitchItem } from "./components/switch-group";
import { Col, Table } from "./components/table";
import { Tag, TagBlock } from "./components/tag";
import { TabItem, Tabs } from "./components/tabs";
import { TextArea } from "./components/textarea";
import { TextContent } from "./components/text-content";
import { ChatContentChildUnion } from "./unions";

const ChatCardChildUnion = z.union([
  ...ChatContentChildUnion.options,
  Tabs.ref,
  Accordion.ref,
  Form.ref,
]);

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <div className="flex flex-col gap-3 border rounded-3xl p-4">{renderNode(props.children)}</div>
  ),
});

// ── Component Groups ──

export const herouiComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: ["TextContent", "MarkDownRenderer", "Callout", "Separator"],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Data",
    components: ["Col", "Table", "Tag", "TagBlock"],
  },
  {
    name: "Layout",
    components: ["TabItem", "Tabs", "AccordionItem", "Accordion"],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "NumberField",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      // "SwitchGroup",
      // "SwitchItem",
    ],
  },
  {
    name: "Chat",
    components: ["FollowUpItem", "FollowUpBlock"],
  },
];

// ── Prompt Options ──

export const herouiExamples: string[] = [
  `Example 1 — Markdown with formatting:
root = Card([md])
md = MarkDownRenderer("## Summary\\n\\nHere are the key points:\\n\\n- **First** item\\n- **Second** item\\n- [Learn more](https://example.com)")`,

  `Example 2 — Form with inputs:
root = Card([title, form])
title = TextContent("Contact Us", "h2")
form = Form("contact", btns, [fc1, fc2, fc3])
fc1 = FormControl("Name", input1)
fc2 = FormControl("Email", input2, "We'll never share your email.")
fc3 = FormControl("Message", ta1)
input1 = Input("name", "Your name", "text", { required: true })
input2 = Input("email", "you@example.com", "email", { required: true, email: true })
ta1 = TextArea("message", "How can we help?", 4)
btns = Buttons([b1])
b1 = Button("Submit", { type: "continue_conversation" }, "primary")`,
];

export const herouiAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically.",
  "Card is the only layout container.",
  "Use TextContent for titles and short plain text; use optional level for headings (omit for body). Use MarkDownRenderer for formatted content with links, bold, lists, tables, code.",
  "Callout description supports markdown.",
  "Table columns are defined with Col, rows are a 2D array of primitives.",
  "FollowUpBlock items become new user messages on click.",
  "For Form fields, define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.",
  "NEVER nest Form inside Form — each Form should be a standalone container.",
  "Form requires explicit buttons. Always pass a Buttons(...) reference as the buttons argument.",
];

export const herouiPromptOptions: PromptOptions = {
  examples: herouiExamples,
  additionalRules: herouiAdditionalRules,
};

// ── Library ──

export const herouiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: herouiComponentGroups,
  components: [
    ChatCard,
    TextContent,
    MarkDownRenderer,
    Callout,
    Separator,
    Button,
    Buttons,
    Col,
    Table,
    Tag,
    TagBlock,
    TabItem,
    Tabs,
    AccordionItem,
    Accordion,
    Form,
    FormControl,
    Input,
    TextArea,
    Select,
    SelectItem,
    NumberField,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    // SwitchGroup,
    // SwitchItem,
    FollowUpItem,
    FollowUpBlock,
  ],
});
