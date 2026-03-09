"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/lang-react";
import { createLibrary, defineComponent } from "@openuidev/lang-react";
import { z } from "zod";
import { Card as OpenUICard } from "../components/Card";

// Content
import { Callout } from "./Callout";
import { CardHeader } from "./CardHeader";
import { CodeBlock } from "./CodeBlock";
import { Image } from "./Image";
import { ImageBlock } from "./ImageBlock";
import { ImageGallery } from "./ImageGallery";
import { MarkDownRenderer } from "./MarkDownRenderer";
import { Separator } from "./Separator";
import { TextCallout } from "./TextCallout";
import { TextContent } from "./TextContent";

// Charts
import {
  AreaChartCondensed,
  BarChartCondensed,
  HorizontalBarChart,
  LineChartCondensed,
  PieChart,
  Point,
  RadarChart,
  RadialChart,
  ScatterChart,
  ScatterSeries,
  Series,
  SingleStackedBarChart,
  Slice,
} from "./Charts";

// Forms
import { CheckBoxGroup, CheckBoxItem } from "./CheckBoxGroup";
import { DatePicker } from "./DatePicker";
import { Form } from "./Form";
import { FormControl } from "./FormControl";
import { Input } from "./Input";
import { Label } from "./Label";
import { RadioGroup, RadioItem } from "./RadioGroup";
import { Select, SelectItem } from "./Select";
import { Slider } from "./Slider";
import { SwitchGroup, SwitchItem } from "./SwitchGroup";
import { TextArea } from "./TextArea";

// Buttons
import { Button } from "./Button";
import { Buttons } from "./Buttons";

// Layout (no Stack)
import { Accordion, AccordionItem } from "./Accordion";
import { Carousel } from "./Carousel";
import { Slide } from "./Slide";
import { Steps, StepsItem } from "./Steps";
import { TabItem, Tabs } from "./Tabs";

// Data Display
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

// Chat-specific
import { FollowUpBlock } from "./FollowUpBlock";
import { FollowUpItem } from "./FollowUpItem";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";
import { SectionBlock } from "./SectionBlock";
import { SectionItem } from "./SectionItem";

import { ChatContentChildUnion } from "./unions";

// Tabs and Carousel are added here (not in unions.ts) to avoid the circular dep:
// Tabs/schema.ts imports ContentChildUnion from unions.ts.
const ChatCardChildUnion = z.union([...ChatContentChildUnion.options, Tabs.ref, Carousel.ref]);

// ── Locked Chat Card — no design params, always vertical ──

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically — no layout params needed.",
  component: ({ props, renderNode }) => (
    <OpenUICard
      width="full"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--openui-space-m)",
      }}
    >
      {renderNode(props.children)}
    </OpenUICard>
  ),
});

// ── Component Groups ──

export const openuiChatComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: [
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Callout",
      "TextCallout",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "CodeBlock",
      "Separator",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
  },
  {
    name: "Charts (2D)",
    components: [
      "BarChart",
      "LineChart",
      "AreaChart",
      "RadarChart",
      "HorizontalBarChart",
      "Series",
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
  },
  {
    name: "Charts (Scatter)",
    components: ["ScatterChart", "ScatterSeries", "Point"],
  },
  {
    name: "Forms",
    components: [
      "Form",
      "FormControl",
      "Label",
      "Input",
      "TextArea",
      "Select",
      "SelectItem",
      "DatePicker",
      "Slider",
      "CheckBoxGroup",
      "CheckBoxItem",
      "RadioGroup",
      "RadioItem",
      "SwitchGroup",
      "SwitchItem",
    ],
    notes: [
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.",
      "- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Lists & Follow-ups",
    components: ["ListBlock", "ListItem", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use ListBlock with ListItem references for numbered, clickable lists.",
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- Clicking a ListItem or FollowUpItem sends its text to the LLM as a user message.",
      '- Example: list = ListBlock([item1, item2])  item1 = ListItem("Option A", "Details about A")',
    ],
  },
  {
    name: "Sections",
    components: ["SectionBlock", "SectionItem"],
    notes: [
      "- SectionBlock renders collapsible accordion sections that auto-open as they stream.",
      "- Each section needs a unique `value` id, a `trigger` label, and a `content` array.",
      '- Example: sections = SectionBlock([s1, s2])  s1 = SectionItem("intro", "Introduction", [content1])',
      "- Set isFoldable=false to render sections as flat headers instead of accordion.",
    ],
  },
  {
    name: "Layout",
    components: [
      "Tabs",
      "TabItem",
      "Accordion",
      "AccordionItem",
      "Steps",
      "StepsItem",
      "Carousel",
      "Slide",
    ],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      "- Use Carousel with Slide items for horizontal scrolling content: carousel = Carousel([slide1, slide2])  slide1 = Slide([content...])",
      "- IMPORTANT: Every Slide in a Carousel must have the same structure — same component types in the same order. Inconsistent slides break the visual layout.",
      "- For image carousels use: Slide([title, image, description, tags]) — every slide must follow this exact pattern.",
      "- Use real, publicly accessible image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never hallucinate image URLs.",
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag"],
  },
];

// ── Examples ──

export const openuiChatExamples: string[] = [
  `Example 1 — Table with follow-ups:
root = Card([title, tbl, followUps])
title = TextContent("Top Languages", "large-heavy")
tbl = Table(cols, rows)
cols = [Col("Language", "string"), Col("Users (M)", "number"), Col("Year", "number")]
rows = [["Python", 15.7, 1991], ["JavaScript", 14.2, 1995], ["Java", 12.1, 1995]]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`,

  `Example 2 — Clickable list:
root = Card([title, list])
title = TextContent("Choose a topic", "large-heavy")
list = ListBlock([item1, item2, item3])
item1 = ListItem("Getting started", "New to the platform? Start here.")
item2 = ListItem("Advanced features", "Deep dives into powerful capabilities.")
item3 = ListItem("Troubleshooting", "Common issues and how to fix them.")`,

  `Example 3 — Image carousel with consistent slides + follow-ups:
root = Card([header, carousel, followups])
header = CardHeader("Featured Destinations", "Discover highlights and best time to visit")
carousel = Carousel([slide1, slide2, slide3], "card")
slide1 = Slide([t1, img1, d1, tags1])
t1 = TextContent("Paris, France", "large-heavy")
img1 = ImageBlock("https://picsum.photos/seed/paris/800/500", "Eiffel Tower at night")
d1 = TextContent("City of light — best Apr–Jun and Sep–Oct.", "default")
tags1 = TagBlock(["Landmark", "City Break", "Culture"])
slide2 = Slide([t2, img2, d2, tags2])
t2 = TextContent("Kyoto, Japan", "large-heavy")
img2 = ImageBlock("https://picsum.photos/seed/kyoto/800/500", "Bamboo grove in Arashiyama")
d2 = TextContent("Temples and bamboo groves — best Mar–Apr and Nov.", "default")
tags2 = TagBlock(["Temples", "Autumn", "Culture"])
slide3 = Slide([t3, img3, d3, tags3])
t3 = TextContent("Machu Picchu, Peru", "large-heavy")
img3 = ImageBlock("https://picsum.photos/seed/machupicchu/800/500", "Inca citadel in the clouds")
d3 = TextContent("High-altitude Inca citadel — best May–Sep.", "default")
tags3 = TagBlock(["Andes", "Hike", "UNESCO"])
followups = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Show me only beach destinations")
fu2 = FollowUpItem("Turn this into a comparison table")`,

  `Example 4 — Form with validation:
root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", [nameField, emailField, msgField], btns)
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", { type: "continue_conversation" }, "primary")])`,
];

export const openuiChatAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically. No layout params are needed on Card.",
  "Card is the only layout container. Do NOT use Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "Use ListBlock when presenting a set of options or steps the user can click to select.",
  "Use SectionBlock to group long responses into collapsible sections — good for reports, FAQs, and structured content.",
  "Use SectionItem inside SectionBlock: each item needs a unique value id, a trigger (header label), and a content array.",
  "For Carousel, use Slide items: carousel = Carousel([slide1, slide2])  slide1 = Slide([content...])",
  "IMPORTANT: Every Slide in a Carousel must use the same component structure in the same order — e.g. all slides: Slide([title, image, description, tags]).",
  "For image carousels, always use real accessible URLs like https://picsum.photos/seed/KEYWORD/800/500. Never hallucinate or invent image URLs.",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the third Form argument with Buttons(...) actions.",
  "Never nest Form inside Form.",
];

export const openuiChatPromptOptions: PromptOptions = {
  examples: openuiChatExamples,
  additionalRules: openuiChatAdditionalRules,
};

// ── Library ──

export const openuiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: openuiChatComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
    TextContent,
    MarkDownRenderer,
    Callout,
    TextCallout,
    Image,
    ImageBlock,
    ImageGallery,
    CodeBlock,
    Separator,
    // Tables
    Table,
    Col,
    // Charts (2D)
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    RadarChart,
    HorizontalBarChart,
    Series,
    // Charts (1D)
    PieChart,
    RadialChart,
    SingleStackedBarChart,
    Slice,
    // Charts (Scatter)
    ScatterChart,
    ScatterSeries,
    Point,
    // Forms
    Form,
    FormControl,
    Label,
    Input,
    TextArea,
    Select,
    SelectItem,
    DatePicker,
    Slider,
    CheckBoxGroup,
    CheckBoxItem,
    RadioGroup,
    RadioItem,
    SwitchGroup,
    SwitchItem,
    // Buttons
    Button,
    Buttons,
    // Lists & Follow-ups
    ListBlock,
    ListItem,
    FollowUpBlock,
    FollowUpItem,
    // Sections
    SectionBlock,
    SectionItem,
    // Layout (no Stack)
    Tabs,
    TabItem,
    Accordion,
    AccordionItem,
    Steps,
    StepsItem,
    Carousel,
    Slide,
    // Data Display
    TagBlock,
    Tag,
  ],
});
