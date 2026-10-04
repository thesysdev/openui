"use client";

import type { ComponentGroup } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Card as OpenUICard } from "../components/Card";
import { CardSourceProvider, CardSourceSchema, Sources } from "../components/Sources";

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
import { AccordionRenderer } from "./Accordion";
import { CarouselRenderer } from "./Carousel";
import { Steps, StepsItem } from "./Steps";
import { TabsRenderer } from "./Tabs";

// Data Display
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

// Chat-specific
import { FollowUpBlock } from "./FollowUpBlock";
import { FollowUpItem } from "./FollowUpItem";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";
import { SectionBlock, SectionBlockRenderer } from "./SectionBlock";

// Content & inline composites
import { BoldText } from "./BoldText";
import { EntityList } from "./EntityList";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { IconText } from "./IconText";
import { ImageText } from "./ImageText";
import { ImageTextLarge } from "./ImageTextLarge";
import { InlineHeader } from "./InlineHeader";
import { MetricIndicatorInline, MetricIndicatorWithStrikethrough } from "./MetricIndicator";
import { Text } from "./Text";

// Editable table
import { EditableTable } from "./EditableTable";

// Selection inputs
import { ChipItem, Chips } from "./Chips";
import { OptionCard, OptionCards } from "./OptionCards";

// Card blocks
import { CompositeCardBlock, CompositeCardItem } from "./CompositeCardBlock";
import { ContextCardBlock, ContextCardItem } from "./ContextCardBlock";
import { OverviewCardBlock, OverviewCardItem } from "./OverviewCardBlock";
import { SnippetCardBlock, SnippetCardItem } from "./SnippetCardBlock";
import { VisualCardBlock, VisualCardItem } from "./VisualCardBlock";

import { ChatContentChildUnion } from "./unions";

// ── Chat containers — same renderers as the base Tabs / Accordion / Carousel / SectionItem,
// but their content unions accept every chat block (card blocks, EntityList, EditableTable,
// InlineHeader, ...). Defined here, not in unions.ts, to avoid circular imports; registered
// under the base names so SectionBlock's `SectionItem.ref` resolves to the chat variant.

// Everything a nested container may hold — no SectionBlock nesting.
const ChatNestedContentUnion = z.union(
  ChatContentChildUnion.options.filter((o) => o !== SectionBlock.ref) as [
    z.ZodTypeAny,
    z.ZodTypeAny,
    ...z.ZodTypeAny[],
  ],
);

const ChatAccordionItem = defineComponent({
  name: "AccordionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(ChatNestedContentUnion),
  }),
  description: "value is unique id, trigger is section title",
  component: () => null,
});

const ChatAccordion = defineComponent({
  name: "Accordion",
  props: z.object({ items: z.array(ChatAccordionItem.ref) }),
  description: "Collapsible sections",
  component: AccordionRenderer,
});

const ChatTabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.union([...ChatNestedContentUnion.options, ChatAccordion.ref])),
  }),
  description: "value is unique id, trigger is tab label, content is array of components",
  component: () => null,
});

const ChatTabs = defineComponent({
  name: "Tabs",
  props: z.object({ items: z.array(ChatTabItem.ref) }),
  description: "Tabbed container",
  component: TabsRenderer,
});

const ChatCarousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ChatNestedContentUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
  component: CarouselRenderer,
});

const ChatSectionItem = defineComponent({
  name: "SectionItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.union([...ChatNestedContentUnion.options, ChatTabs.ref, ChatAccordion.ref])),
  }),
  description: "Section with a label and collapsible content — used inside SectionBlock",
  component: () => null,
});

const ChatSectionBlock = defineComponent({
  name: "SectionBlock",
  props: z.object({
    sections: z.array(ChatSectionItem.ref),
    isFoldable: z.boolean().optional(),
  }),
  description:
    "Collapsible accordion sections. Auto-opens sections as they stream in. Use SectionItem for each section.",
  component: SectionBlockRenderer,
});

const ChatCardChildUnion = z.union([
  ...ChatNestedContentUnion.options,
  ChatSectionBlock.ref,
  ChatTabs.ref,
  ChatCarousel.ref,
]);

// ── Locked Chat Card — no design params, always vertical ──

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
    sources: z.array(CardSourceSchema).optional(),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically. Optional sources ([{ title, sourceName, url }]) render as a Sources strip at the bottom and back inline [n] citations in TextContent.",
  component: ({ props, renderNode }) => (
    <CardSourceProvider sources={props.sources}>
      <OpenUICard
        width="full"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--openui-space-m)",
        }}
      >
        {renderNode(props.children)}
        <Sources />
      </OpenUICard>
    </CardSourceProvider>
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
      "InlineHeader",
    ],
    notes: [
      "- InlineHeader is a compact heading + description pair for labelling a block inside the response (lighter than CardHeader).",
      "- Pass sources on Card ([{ title, sourceName, url }]) when the answer relies on references, and cite them inline in TextContent as [1], [2] (1-based index into sources). A Sources strip renders at the bottom of the card.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable"],
    notes: [
      "- EditableTable lets the user edit cells inline. Give it a unique name, columns of { type, key, header } with type one of text | number | date-single | select | url (select also needs options: [{ value, label }]).",
      "- data is an array of { id, values } rows where values are ordered positionally to match columns. Edited data is submitted when the user clicks Save Changes.",
    ],
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
      "Chips",
      "ChipItem",
      "OptionCards",
      "OptionCard",
    ],
    notes: [
      "- Chips: compact single/multiple selection pills. Use ChipItem references for each option.",
      "- OptionCards: larger selectable cards with title, subtitle and an optional Icon or Image on top. Use OptionCard references for each option.",
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument: Form(name, buttons, fields).",
      "- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons", "Icon", "IconButton"],
    notes: [
      "- Icon renders a lucide icon by kebab-case name; it is also used as the icon of IconButton, IconText and OptionCard.",
    ],
  },
  {
    name: "Lists & Follow-ups",
    components: ["ListBlock", "ListItem", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use ListBlock with ListItem references for numbered lists.",
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- A ListItem is clickable ONLY when given an action (5th argument); without one it is plain text.",
      "- Clicking a FollowUpItem, or a ListItem with a continue_conversation action, sends text to the LLM as a user message.",
      '- Example: list = ListBlock([item1, item2])  item1 = ListItem("Option A", "Details about A", null, null, { type: "continue_conversation", context: "Option A" })',
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
    components: ["Tabs", "TabItem", "Accordion", "AccordionItem", "Steps", "StepsItem", "Carousel"],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      "- Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
      "- IMPORTANT: Every slide in a Carousel must have the same structure — same component types in the same order.",
      "- For image carousels use: [[title, image, description, tags], ...] — every slide must follow this exact pattern.",
      "- Use real, publicly accessible image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never hallucinate image URLs.",
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag", "EntityList"],
    notes: [
      "- EntityList is a compact two-column list of { left, right } rows (e.g. name / value). size='default' also supports a header and footer row; size='small' does not.",
    ],
  },
  {
    name: "Cards",
    components: [
      "SnippetCardBlock",
      "SnippetCardItem",
      "OverviewCardBlock",
      "OverviewCardItem",
      "ContextCardBlock",
      "ContextCardItem",
      "CompositeCardBlock",
      "CompositeCardItem",
      "VisualCardBlock",
      "VisualCardItem",
      "Text",
      "BoldText",
      "IconText",
      "ImageText",
      "ImageTextLarge",
      "MetricIndicatorInline",
      "MetricIndicatorWithStrikethrough",
    ],
    notes: [
      "- Card blocks lay out 2+ items in a responsive grid (or carousel where supported). Every item in a block must have the same structure.",
      "- SnippetCardItem: small card with lhs (IconText | ImageText) and optional rhs (Text | BoldText) — good for key/value facts.",
      "- OverviewCardItem: small card with top (IconText | ImageText | Text) and optional bottom MetricIndicatorInline — good for KPIs.",
      "- ContextCardItem: medium card with a title (string or Tag), body text and optional background image — good for summaries.",
      "- CompositeCardItem: rich card with header, body array (Text, BoldText, MetricIndicatorInline, IconText, Image, charts, ListBlock, TagBlock, EntityList) and footer (price + Button) — good for products/offers.",
      "- VisualCardItem: image-first card with a BoldText body and optional Tag.",
      "- Text / BoldText / IconText / ImageText / ImageTextLarge / MetricIndicator* are the inline building blocks used INSIDE card items; do not place them directly in the root Card.",
    ],
  },
];

// ── Examples ──
export {
  openuiChatAdditionalRules,
  openuiChatExamples,
  openuiChatPromptOptions,
} from "./prompt-options/index";

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
    ChatSectionBlock,
    ChatSectionItem,
    // Layout (no Stack)
    ChatTabs,
    ChatTabItem,
    ChatAccordion,
    ChatAccordionItem,
    Steps,
    StepsItem,
    ChatCarousel,
    // Data Display
    TagBlock,
    Tag,
    EntityList,
    // Content
    InlineHeader,
    Icon,
    IconButton,
    // Tables (editable)
    EditableTable,
    // Selection inputs
    ChipItem,
    Chips,
    OptionCard,
    OptionCards,
    // Card building blocks
    Text,
    BoldText,
    IconText,
    ImageText,
    ImageTextLarge,
    MetricIndicatorInline,
    MetricIndicatorWithStrikethrough,
    // Card blocks
    SnippetCardItem,
    SnippetCardBlock,
    OverviewCardItem,
    OverviewCardBlock,
    ContextCardItem,
    ContextCardBlock,
    CompositeCardItem,
    CompositeCardBlock,
    VisualCardItem,
    VisualCardBlock,
  ],
});
