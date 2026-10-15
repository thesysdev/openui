"use client";

import type { ComponentGroup, ComponentRenderProps } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import { CardHeading, Card as OpenUICard } from "../components/Card";
import { CardSourceProvider, CardSourceSchema, Sources } from "../components/Sources";

// Content
import { Avatar } from "./Avatar";
import { AvatarStack } from "./AvatarStack";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { Emoji } from "./Emoji";
import { EntityTitle } from "./EntityTitle";
import { Heading } from "./Heading";
import { Image } from "./Image";
import { ImageGallery } from "./ImageGallery";
import { ImageTitle } from "./ImageTitle";
import { LeadingText } from "./LeadingText";
import { Link } from "./Link";
import { Markdown } from "./Markdown";
import { Metric } from "./Metric";
import { Separator } from "./Separator";
import { Shape } from "./Shape";
import { Text } from "./Text";

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
import { Form, FormRow } from "./Form";
import { FormControl } from "./FormControl";
import { Input } from "./Input";
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
import { BLEED_DESCRIPTION, BleedRenderer, BleedSchema } from "./Bleed";
import { CAROUSEL_DESCRIPTION, CarouselRenderer, carouselSlideUnion } from "./Carousel";
import { Checklist, ChecklistItem } from "./Checklist";
import { GRID_DESCRIPTION, GridRenderer, GridSchema } from "./Grid";
import { SHELL_DESCRIPTION, ShellRenderer, ShellSchema } from "./Shell";
import { Steps, StepsItem } from "./Steps";
import { TabsRenderer } from "./Tabs";
import { Timeline, TimelineItem } from "./Timeline";
import { NestedCardContext } from "./nestedCardContext";

// Data Display
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

// Chat-specific
import { FollowUpBlock } from "./FollowUpBlock";
import { FollowUpItem } from "./FollowUpItem";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";
import { SECTION_DESCRIPTION, SectionRenderer, SectionSchema } from "./Section";
import { SectionBlock, SectionBlockRenderer } from "./SectionBlock";

// Content & inline composites
import { EntityList } from "./EntityList";
import { EntityListItem } from "./EntityListItem";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

// Editable table
import { EditableCol, EditableTable } from "./EditableTable";

// Selection inputs
import { ChipItem, Chips } from "./Chips";
import { OptionCard, OptionCards } from "./OptionCards";

// Card blocks
import { CompositeCardBlock, CompositeCardItem } from "./CompositeCardBlock";
import { ImageCard, ImageCardItem } from "./ImageCard";
import { InsightCard, InsightCardItem } from "./InsightCard";
import { ValueCard, ValueCardItem } from "./ValueCard";
import { ValueLayout } from "./ValueLayout";

import { ChatContentChildUnion } from "./unions";

// ── Chat containers — same renderers as the base Tabs / Accordion / Carousel / SectionItem,
// but their content unions accept every chat block (card blocks, EntityList, EditableTable,
// Metric, ...). Defined here, not in unions.ts, to avoid circular imports; registered
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
    leading: z.union([Icon.ref, Avatar.ref, Emoji.ref]).optional(),
  }),
  description:
    'One collapsible item: AccordionItem(value, trigger, content, leading?), e.g. AccordionItem("refunds", "Can I get a refund?", [Markdown("Yes, within 30 days of purchase.")], Icon("receipt", "finance")). value is a unique id; trigger is the title the reader clicks, a short question or topic; content is what opens. leading is optional: an Icon for a topic, an inline Avatar (with an icon) for the person who owns that item, or an Emoji only in rare expressive content. Give every item a leading or none of them.',
  component: () => null,
});

const ChatAccordion = defineComponent({
  name: "Accordion",
  props: z.object({ items: z.array(ChatAccordionItem.ref) }),
  description:
    "Collapsible items for supplementary detail the reader opens on demand, most often an FAQ: Accordion([item1, item2, item3]). Keep it to 3–5 items and place it last in its Section or Card; never hide primary information in it. For topics that are equally prominent parts of a long report use SectionBlock, and for alternative views use Tabs.",
  component: AccordionRenderer,
});

const ChatTabItem = defineComponent({
  name: "TabItem",
  props: z.object({
    value: z.string(),
    trigger: z.string(),
    content: z.array(z.union([...ChatNestedContentUnion.options, ChatAccordion.ref])),
    leading: z.union([Icon.ref, Avatar.ref, Emoji.ref]).optional(),
  }),
  description:
    'One tab: TabItem(value, trigger, content, leading?), e.g. TabItem("growth", "User growth", [growthChart], Icon("trending-up", "charts")). value is a unique id; trigger is the short pill label, one to three words; content is what the tab shows. leading is optional: an Icon per view, an inline Avatar (with an icon) for a person\'s tab, or an Emoji only in rare expressive content. Give every tab a leading or none of them.',
  component: () => null,
});

const ChatTabs = defineComponent({
  name: "Tabs",
  props: z.object({ items: z.array(ChatTabItem.ref) }),
  description:
    "Pill tabs that switch between alternative views of the same thing, such as one dataset as a chart and a table, or the same plan by season: Tabs([tab1, tab2]). Only one view shows at a time, so never hide primary information that the reader needs to compare side by side in a tab. Keep it to 2–5 tabs with short labels. For distinct parts of a response use Sections, and for supplementary on-demand detail use Accordion.",
  component: TabsRenderer,
});

const ChatCarousel = defineComponent({
  name: "Carousel",
  props: z.object({
    // Each slide is a chat Card; lazy because the Card can hold this Carousel.
    get children(): z.ZodArray<z.core.$ZodType> {
      return z.array(carouselSlideUnion(ChatCard.ref));
    },
  }),
  description: CAROUSEL_DESCRIPTION,
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
    "Collapsible accordion sections, auto-opened as they stream in, for topics the reader opens on demand: an FAQ, a long report, supporting detail. Use a SectionItem for each one, and place the SectionBlock inside a Section like any other content; the always-visible parts of a response are Sections themselves.",
  component: SectionBlockRenderer,
});

// Same props and renderer as the base Section, with children typed to chat content.
// A Section holds no Section, so it only appears directly in the Card.
// Same props and renderer as the base Grid; each cell is usually a chat Card,
// which frames itself inside a Grid. Lazy because the Card can hold this Grid.
const ChatGrid = defineComponent({
  name: "Grid",
  props: GridSchema.extend({
    get children(): z.ZodArray<z.core.$ZodType> {
      return z.array(
        z.union([...ChatNestedContentUnion.options, ChatCard.ref, ChatTabs.ref, ChatCarousel.ref]),
      );
    },
  }),
  description: GRID_DESCRIPTION,
  component: GridRenderer,
});

// Shell and Bleed hold the same chat blocks as a Grid, plus the Grid itself.
// Lazy because the chat Card can hold them.
const chatWideChildren = (): z.ZodArray<z.core.$ZodType> =>
  z.array(
    z.union([
      ...ChatNestedContentUnion.options,
      ChatCard.ref,
      ChatGrid.ref,
      ChatTabs.ref,
      ChatCarousel.ref,
    ]),
  );

const ChatShell = defineComponent({
  name: "Shell",
  props: ShellSchema.extend({
    get children(): z.ZodArray<z.core.$ZodType> {
      return chatWideChildren();
    },
  }),
  description: SHELL_DESCRIPTION,
  component: ShellRenderer,
});

const ChatBleed = defineComponent({
  name: "Bleed",
  props: BleedSchema.extend({
    get children(): z.ZodArray<z.core.$ZodType> {
      return chatWideChildren();
    },
  }),
  description: BLEED_DESCRIPTION,
  component: BleedRenderer,
});

const ChatSection = defineComponent({
  name: "Section",
  props: SectionSchema.extend({
    children: z.array(
      z.union([
        ...ChatNestedContentUnion.options,
        ChatSectionBlock.ref,
        ChatTabs.ref,
        ChatAccordion.ref,
        ChatCarousel.ref,
        ChatGrid.ref,
        ChatShell.ref,
        ChatBleed.ref,
      ]),
    ),
  }),
  description: SECTION_DESCRIPTION,
  component: SectionRenderer,
});

const ChatCardChildUnion = z.union([
  ...ChatNestedContentUnion.options,
  ChatSection.ref,
  ChatGrid.ref,
  ChatShell.ref,
  ChatBleed.ref,
  ChatSectionBlock.ref,
  ChatTabs.ref,
  ChatCarousel.ref,
]);

// ── Chat Card — always vertical. As the response root it has no frame; as a
// Carousel slide it is a framed Card whose variant sets the look.

type ChatCardVariant = "outlined" | "lifted" | "sunk";

const ChatCardRenderer = ({
  props,
  renderNode,
}: ComponentRenderProps<{
  children: unknown[];
  sources?: unknown;
  variant?: ChatCardVariant;
  title?: string;
  subtitle?: string;
}>) => {
  const inSlide = React.useContext(NestedCardContext);
  return (
    <CardSourceProvider
      sources={props.sources as React.ComponentProps<typeof CardSourceProvider>["sources"]}
    >
      <OpenUICard
        variant={inSlide ? (props.variant ?? "outlined") : "clear"}
        width="full"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--openui-space-m)",
        }}
      >
        <CardHeading title={props.title} subtitle={props.subtitle} />
        {renderNode(props.children)}
        <Sources />
      </OpenUICard>
    </CardSourceProvider>
  );
};

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
    sources: z.array(CardSourceSchema).optional(),
    variant: z.enum(["outlined", "lifted", "sunk"]).optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  description: `Vertical container for all content in a chat response. Children stack top to bottom automatically. Optional sources ([{ title, sourceName, url }]) render as a Sources strip at the bottom and back inline [n] citations in Markdown. The response root takes no variant. A Card used as a Carousel slide or a Grid cell is a framed card: variant "outlined" (default, a thin border on a transparent background) | "lifted" (white, with the same border plus a soft shadow) | "sunk" (a light grey fill, no border or shadow). A framed Card can take a small title and subtitle (4th and 5th, after variant), 14px over 13px secondary like our other cards; use them instead of a Heading child: Card([chart], null, null, "Revenue by quarter", "USD thousands").`,
  component: ChatCardRenderer,
});

// ── Component Groups ──

export const openuiChatComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: [
      "Text",
      "Markdown",
      "Metric",
      "Avatar",
      "Emoji",
      "Shape",
      "AvatarStack",
      "Heading",
      "LeadingText",
      "EntityTitle",
      "ImageTitle",
      "Link",
      "Callout",
      "Image",
      "ImageGallery",
      "CodeBlock",
      "Separator",
    ],
    notes: [
      '- Metric(value, delta?, variant?, size?, previous?) is a value with an optional change (+/- shows an up/down arrow); label it with the Card title inside a Card, or compose one with Text or Heading elsewhere. It uses the UI font, so use size "sm" whenever it is not the hero number: Table cells, EntityListItem right, ListItem/EntityTitle subtitles, ImageTitle content, ValueCardItem value, CompositeCardItem body (a CompositeCardItem footer price always renders at 18px), e.g. Col("Change", @Each(data.rows, "r", Metric(r.value, r.change, "horizontal", "sm"))). Only a standalone headline figure gets "vertical", "large", e.g. Card([Metric("$48,200", "+8.1%", "vertical", "large")], null, null, "Revenue"). previous (5th) strikes through an earlier value for a real before/after, like a price drop: Metric("$89", "-26%", null, "sm", "$120").',
      '- Avatar is a photo, logo or tinted icon badge that can stand in for an Icon (LeadingText, Tag, Chips): Avatar("Ada Lovelace", "https://…/ada.jpg", null, null, null, Icon("user", "people")) for a person, Avatar("Stripe", null, "rounded", "stripe.com", null, Icon("building-2", "business")) for a company logo, Avatar("Billing", null, "rounded", null, "md", Icon("credit-card", "finance"), "info") for a standalone concept badge. ALWAYS pass an icon, even with src or domain: it renders when the image is missing or broken. src must be a real URL; a person with no real photo URL gets Icon("user", "people") inside and no src. The icon slot also takes a Shape for a solid colored mark. A concept on a text line stays a plain Icon.',
      '- Heading("Title", "Supporting line") titles a UI section when the description adds a fact the title lacks (scope, unit, time range, what to do). Never a description that greets, introduces you, restates the title or says what the section contains; a bare title is Text h2/h3.',
      "- Greetings, small talk and short conversational replies are one plain Markdown block with no heading, Heading or Text title.",
      '- EntityTitle(leading, title, subtitle) names a person, company, product, place or topic behind an Avatar-first leading visual (a photo, a domain logo or a tinted icon badge): EntityTitle(Avatar("Stripe", null, "rounded", "stripe.com", null, Icon("building-2", "business")), "Stripe", "Payments infrastructure"). subtitle is required: a string, or a Tag, Metric, Link, TagBlock or LeadingText for a status, price, source or labels. A title with no subtitle is a LeadingText. Heading titles a section.',
      '- ImageTitle(Image(alt, src, ratio), [content]) is one item in a grid or Carousel of 2+ products, articles or places: image on top, then a short content stack, usually a title Text("…", "body", true) (an EntityTitle only for a real person, brand or seller with their own photo or logo, never an icon Avatar), then one secondary line (an article author as a LeadingText with an inline Avatar and tone "secondary", a price Metric, Tags). Keep every item the same shape and ratio; a single illustrative picture is Image plus Markdown. Real image URLs only.',
      '- LeadingText(leading, Text(...)) puts an Icon, Avatar or AvatarStack before any Text, centered on its first line: Icon for a concept or fact (LeadingText(Icon("calendar", "time"), Text("Opens daily 9am–6pm"))), Shape for a status dot, legend marker or trend triangle (LeadingText(Shape("triangle-up", "success"), Text("+12% this week"))), Avatar for one real person or company, AvatarStack for a group of them, and rarely an Emoji for expressive generated content (never in UI chrome). Avatars here use size "inline".',
      "- AvatarStack([a1, a2, a3, a4, a5], 3) overlaps 2+ Avatars with a count chip for the rest: a team, attendees, who replied. Keep max at 3–5, set size on the stack, and name the group in Text beside it.",
      "- Markdown is for explanations and the top-level prose that sets context around UI. Text is for short UI text: headings, labels, captions, single values.",
      "- Answering a question with a title and prose: one Markdown block with a # heading, not Text h1 + Markdown. Text headings title UI (dashboards, forms, card groups); a part of a longer multi-part response is a Section that starts with a Heading.",
      '- Callout("warning", "**Visa required.** Apply 3 weeks ahead.") is an icon (or a rare Emoji) plus short Markdown content for one standout aside (tip, caveat, warning, result), with no title. Pick variant by meaning; one or two per response at most; never for notes about what you did.',
      "- Highlight in Markdown with ==key phrase==: a soft green marker behind the text.",
      "- Use it for the one phrase that directly answers the question, at most 1-2 per response. Never for whole sentences, headings, links or code.",
      "- Links: in Markdown write [descriptive text](https://…); the site's favicon renders before the link text automatically. Never use a bare URL as link text.",
      '- For a standalone link outside prose (a source, docs or product page), use Link("Page name", "https://…"). When a Link is the title of a ListItem, StepsItem or TimelineItem, pass size "lg" so it matches the title size: Link("Septime", "https://…", "lg").',
      "- Pass sources on Card ([{ title, sourceName, url }]) when the answer relies on references, and cite them inline in Markdown as [1], [2] (1-based index into sources). A Sources strip renders at the bottom of the card.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable", "EditableCol"],
    notes: [
      '- EditableTable(name, [EditableCol(key, label, type?, options?, icon?)], rows) lets the user edit cells inline. type is the cell editor: "text" (default), "number", "date", "select" (options as SelectItems) or "url"; each column shows a leading header icon for its type unless you pass an Icon.',
      "- rows is an array of value arrays in column order (dates as ISO strings, selects as the SelectItem value). Edited data is submitted when the user clicks Save Changes.",
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
      "FormRow",
      "FormControl",
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
      "- OptionCards: larger selectable cards with a title, a composable subtitle and an optional leading (Icon, Avatar, Image or rare Emoji); the selected card shows a checkmark. Use OptionCard references for each option; use it for 2–6 choices that need a short explanation, Chips for short labels.",
      "- FormRow([fieldA, fieldB]) puts 2–3 short related FormControls side by side (first and last name; city, state and zip) and stacks them on narrow widths. Mix FormRows with full-width FormControls in Form fields; keep TextArea and other long fields full width.",
      '- Pick Input type for what is entered ("email", "password", "number", "url", "search", "tel", or "text") since it sets the leading icon automatically. Use variant "inline" on Input, TextArea, Select and DatePicker only inside table cells or dense rows, where a borderless field fits; "default" everywhere else.',
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
      "- Icon is a lucide line icon by exact kebab-case name that fills icon slots (LeadingText, Tag, ChipItem, Avatar, EntityTitle, IconButton, OptionCard); the host sets its size, stroke and color. An unknown name shows a plain circle.",
    ],
  },
  {
    name: "Lists & Follow-ups",
    components: ["ListBlock", "ListItem", "FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use ListBlock with ListItem references for numbered lists.",
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- A ListItem is clickable ONLY when given an action (5th argument); without one it is plain text.",
      "- Clicking a FollowUpItem, or a ListItem with a @ToAssistant action, sends text to the LLM as a user message.",
      '- Example: list = ListBlock([item1, item2])  item1 = ListItem("Option A", "Details about A", null, null, @ToAssistant("Option A"))',
    ],
  },
  {
    name: "Sections",
    components: ["Section", "SectionBlock", "SectionItem"],
    notes: [
      "- Build every response from Sections placed directly in the Card: Section([children]) holds one part (an overview, then options, then next steps) with more space after it and tight spacing inside; a short answer is one Section. Compose each part yourself: a Heading title first when it needs one, then content; put a card block (ValueCard, ImageCard, CompositeCardBlock) inside for a grid. Never nested. Sections are high-level divisions and many responses have only one; never give a lone Text, Markdown, Buttons row or title (Heading or Text, with or without a subtitle) its own Section, so an intro or a dashboard header goes first inside the Section holding the content it introduces.",
      "- SectionBlock is different: collapsible accordion sections. Use Section for always-visible parts.",
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
      "Grid",
      "Shell",
      "Bleed",
    ],
    notes: [
      "- Shell(title, [children]) frames a dashboard or large Grid layout: a small title, an outline, wider than the chat column, with an expand button for full screen. At most one per response. Bleed([children]) is the same width with no frame, for a wide hero Image, comparison Grid or Carousel; wrap a Grid comparing an odd number of cards (3 or 5 plans) in a Bleed, Bleed([Grid([p1, p2, p3], 3)]), so they sit in one row instead of 2 + 1. Never nest either.",
      '- Grid(children, columns?) lays out equal columns for dashboards: columns 2 (default) | 3 | 4, collapsing to fewer on narrow screens. Each cell is usually a Card, which is outlined by default inside a Grid: a KPI row Grid([Card([Metric("$48,200", "+8.1%")], null, null, "Revenue"), ...], 4) above Grid([Card([chart1], null, null, "Revenue"), Card([chart2], null, null, "Orders")]). Title cards with the Card\'s own title, not a Heading child.',
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      '- Carousel takes 2+ Cards, one per slide: carousel = Carousel([Card([t1, img1]), Card([t2, img2])]). A slide Card is outlined by default; its variant (3rd argument, after sources) sets the look: Card([t1, img1], null, "sunk").',
      "- IMPORTANT: Every slide in a Carousel must have the same structure — same variant, same component types in the same order.",
      '- Which scroller: a set of one card type with one shared click action uses that block\'s own carousel layout (ImageCard, InsightCard, CompositeCardBlock layout "carousel"; vertical ValueCard carousel true), which keeps the shared action. Carousel is for custom Card or Image slides, or card items that need no shared action.',
      "- For image carousels each slide is Card([title, image, description, tags]) — every slide must follow this exact pattern.",
      "- Use real, publicly accessible image URLs (e.g. https://picsum.photos/seed/KEYWORD/800/500). Never hallucinate image URLs.",
    ],
  },
  {
    name: "Data Display",
    components: [
      "TagBlock",
      "Tag",
      "EntityList",
      "EntityListItem",
      "Timeline",
      "TimelineItem",
      "Checklist",
      "ChecklistItem",
    ],
    notes: [
      "- EntityList is a compact list of EntityListItem(left, right?, rightVariant?) rows. left is a plain string for key/value facts, an EntityTitle for people, companies or products, or a LeadingText for facts with an icon; right is an optional string, Metric, Tag or Text. size='default' also supports a header and footer row; size='small' does not.",
      "- Timeline lists events in time order along a dashed rail, with an optional time column on the left: itineraries, schedules, project histories, order tracking. TimelineItem(title, subtitle?, time?, leading?, status?); status done/current/upcoming shows progress through a plan. Use Steps for numbered how-to instructions and ListBlock for unordered or ranked sets.",
      '- Steps([StepsItem(title, subtitle?)]) is a numbered how-to; the number chips are automatic. title is a string or a Text (pass Text("Install the CLI", "body", true) to emphasize it), and subtitle is one or two plain sentences on how to do it.',
      "- Checklist(items, name?, value?) with ChecklistItem(title, subtitle?, checked?, value?) is a checkable list of to-dos, packing items, launch or onboarding steps: the user ticks items, checked sets the starting state, and value is a stable key per item. Give it a name when the ticks should persist or you need to read them later. Inside a CompositeCardItem body it is read-only, for what a plan includes. Steps is for numbered how-tos, Timeline for time-ordered events.",
    ],
  },
  {
    name: "Cards",
    components: [
      "ValueCard",
      "ValueCardItem",
      "ValueLayout",
      "InsightCard",
      "InsightCardItem",
      "CompositeCardBlock",
      "CompositeCardItem",
      "ImageCard",
      "ImageCardItem",
    ],
    notes: [
      "- Card blocks lay out 2+ items in a responsive grid (or carousel where supported). Every item in a block must have the same structure.",
      '- ValueCard: a grid of 2+ small ValueCardItem(id?, title, subtitle?, leading?, value?) cards, e.g. ValueCardItem("revenue", "Revenue", "Month to date", Icon("circle-dollar-sign", "finance"), Metric("$48,200", "+8.1%", null, "sm")). leading is an Icon for a concept or an Avatar for a real person or company (36px beside a stacked title and subtitle in horizontal cards, inline before the title otherwise); subtitle and value each take one piece or an array on one line, e.g. value [Metric("99.98%"), Tag("Healthy", null, "success")]. layout "horizontal" (default) for key/value facts (value on the right, Metric at "sm"); "vertical" for KPI tiles (a hero Metric at the default size), optionally with carousel. Set layout on the group, never per item: "horizontal" only when every value is one short piece (one Metric or short Text), otherwise "vertical" for the whole block. Keep every item the same shape, and use one generic shared action at most.',
      "- ValueLayout takes the same ValueCardItems and layout rules as ValueCard but draws dashed rules instead of tinted cards and has no action. Use ValueCard for dashboard-like output (analytics, monitoring) and ValueLayout as an inline section of figures inside a normal UI response.",
      "- InsightCard: 2+ tall InsightCardItem(id?, title, subtitle?, overline?, leading?, color?) tiles, each one takeaway: a short overline (with an optional leading) at the top, and the title (the insight, 22px) with a composable subtitle at the bottom, on a palette color (picked by meaning, never invented); no photo, which is ImageCard. Keep the overline to a few words and the title to one short insight, never a Tag. Use it for research takeaways, trends or news with a status Tag in the subtitle, topics to explore, plan options and suggested next topics.",
      '- CompositeCardItem: rich white card with a header (EntityTitle, ImageTitle, Image, or a Text("…", "h3") title), an optional edge-to-edge media at the top (5th argument: a real photo Image, or an AreaChart, BarChart or LineChart for a metric or trend card), a body array (Text as 14px body copy, Metric at sm, EntityTitle, Image, charts, ListBlock, TagBlock, EntityList, or a Checklist for what a plan includes) and a footer (price Metric, always 18px, with previous for a sale, plus a Button, Buttons([primary, secondary], "column") for two actions, or IconButtons on the right; real actions only). The fallback block: use it only when no specialised card (ImageCard, InsightCard, ValueCard, EntityList, ListBlock, OptionCards) fits, for products, offers and plans that need mixed content. Keep one strong block per card: never put an EntityTitle header next to another big block (media, a chart, an ImageTitle, a large Metric); with a photo or chart hero, title the card with a plain Text, or a LeadingText(Icon(...), Text(..., "body", true)) when an icon helps.',
      "- ImageCard: 2+ tall ImageCardItem(id?, src, title, subtitle?, overline?, leading?, alt?, actions?) photo tiles for places, products, media or inspiration: a real photo behind an overline (top left), optional IconButton actions (top right), and the title with a composable subtitle (bottom). Only with real image URLs for every item, otherwise InsightCard; IconButtons only for real @OpenUrl or @ToAssistant actions, never save or share.",
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
    // Content
    Text,
    Markdown,
    Metric,
    Avatar,
    Emoji,
    Shape,
    AvatarStack,
    Heading,
    LeadingText,
    EntityTitle,
    ImageTitle,
    Link,
    Callout,
    Image,
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
    FormRow,
    FormControl,
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
    ChatSection,
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
    ChatGrid,
    ChatShell,
    ChatBleed,
    // Data Display
    TagBlock,
    Tag,
    EntityList,
    EntityListItem,
    Timeline,
    TimelineItem,
    Checklist,
    ChecklistItem,
    // Content
    Icon,
    IconButton,
    // Tables (editable)
    EditableTable,
    EditableCol,
    // Selection inputs
    ChipItem,
    Chips,
    OptionCard,
    OptionCards,
    // Card blocks
    ValueCardItem,
    ValueCard,
    ValueLayout,
    InsightCardItem,
    InsightCard,
    CompositeCardItem,
    CompositeCardBlock,
    ImageCardItem,
    ImageCard,
  ],
});
