"use client";

import type { ComponentGroup } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";

// Card building blocks
import { EntityList } from "./EntityList";
import { EntityListItem } from "./EntityListItem";
import { IconButton } from "./IconButton";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";

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

// Content
import { Avatar } from "./Avatar";
import { AvatarStack } from "./AvatarStack";
import { Callout } from "./Callout";
import { Card } from "./Card";
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

// Layout
import { Accordion, AccordionItem } from "./Accordion";
import { Bleed } from "./Bleed";
import { Carousel } from "./Carousel";
import { Checklist, ChecklistItem } from "./Checklist";
import { Grid } from "./Grid";
import { Section } from "./Section";
import { Separator } from "./Separator";
import { Shell } from "./Shell";
import { Stack } from "./Stack";
import { Steps, StepsItem } from "./Steps";
import { TabItem, Tabs } from "./Tabs";
import { Timeline, TimelineItem } from "./Timeline";

// Response endings
import { FollowUpBlock } from "./FollowUpBlock";
import { FollowUpItem } from "./FollowUpItem";
import { Sources } from "./Sources";

// Data Display
import { Icon } from "./Icon";
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

// Modal
import { Modal } from "./Modal";

// ── Component Groups ──

export const openuiComponentGroups: ComponentGroup[] = [
  {
    name: "Layout",
    components: [
      "Stack",
      "Section",
      "Grid",
      "Shell",
      "Bleed",
      "Tabs",
      "TabItem",
      "Accordion",
      "AccordionItem",
      "Steps",
      "StepsItem",
      "Carousel",
      "Separator",
      "Modal",
    ],
    notes: [
      "- Shell(title, [children]) frames a dashboard or large Grid layout: a small title, an outline, wider than the chat column, with an expand button for full screen. At most one per response. Bleed([children]) is the same width with no frame, for a wide hero Image, comparison Grid or Carousel; wrap a Grid comparing an odd number of cards (3 or 5 plans) in a Bleed, Bleed([Grid([p1, p2, p3], 3)]), so they sit in one row instead of 2 + 1. Never nest either.",
      "- For dashboards and equal columns use Grid(children, columns?): columns 2 (default) | 3 | 4, collapsing to fewer on narrow screens, e.g. a KPI row Grid([c1, c2, c3, c4], 4) above Grid([chartCard1, chartCard2]). Use a Stack row only for a few items of mixed width.",
      "- Use nested Stacks when you need explicit rows/sections.",
      "- Build every response from Sections: Section([children]) holds one part (an overview, then options, then next steps) with more space after it and tight spacing inside. Compose each part yourself: a Heading title first when it needs one, then content; rows or grids inside with Stack or card blocks. Never nested. Sections are high-level divisions and many responses have only one; never give a lone Text, Markdown, Buttons row or title (Heading or Text, with or without a subtitle) its own Section, so an intro or a dashboard header goes first inside the Section holding the content it introduces.",
      '- Show/hide sections: $editId != "" ? Card([editForm]) : null',
      '- Modal: Modal("Title", $showModal, [content]) — $showModal is boolean, X/Escape auto-closes. Put Form with its own buttons inside children.',
      "- Use Tabs for alternative views (chart types, data sections) — no $variable needed",
      "- Shared filter across Tabs: same $days binding in Query args works across all TabItems",
    ],
  },
  {
    name: "Content",
    components: [
      "Card",
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
    ],
    notes: [
      '- Metric(value, delta?, variant?, size?, previous?) is a value with an optional change (+/- shows an up/down arrow); label it with the Card title inside a Card, or compose one with Text or Heading elsewhere. It uses the UI font, so use size "sm" whenever it is not the hero number: Table cells, EntityListItem right, ListItem/EntityTitle subtitles, ImageTitle content, ValueCardItem value, CompositeCardItem body (a CompositeCardItem footer price always renders at 18px), e.g. Col("Change", @Each(data.rows, "r", Metric(r.value, r.change, "horizontal", "sm"))). Only a standalone headline figure gets "vertical", "large", e.g. Card([Metric("$48,200", "+8.1%", "vertical", "large")], null, "Revenue"). previous (5th) strikes through an earlier value for a real before/after, like a price drop: Metric("$89", "-26%", null, "sm", "$120").',
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
      '- Use Cards to group related KPIs or blocks: variant "outlined" (default) for ordinary groups, "lifted" for the one block that should stand out, "sunk" for secondary or nested content. For grouping without a frame use Stack; Stack with direction "row" for side-by-side layouts. A Card\'s children stack on their own; for a row or custom spacing inside a Card, pass one Stack child, e.g. Card([Stack([chartA, chartB], "row", "m")]).',
      '- Success toast: Callout("success", "**Saved.** Your changes are live.", $showSuccess) — use @Set($showSuccess, true) in save action, auto-dismisses after 3s. For errors: result.status == "error" ? Callout("error", result.error) : null',
      '- KPI card: Card([Metric("" + @Count(@Filter(data.rows, "field", "==", "value")), null, "vertical", "large")], null, "Label")',
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable", "EditableCol"],
    notes: [
      '- EditableTable(name, [EditableCol(key, label, type?, options?, icon?)], rows) lets the user edit cells inline. type is the cell editor: "text" (default), "number", "date", "select" (options as SelectItems) or "url"; each column shows a leading header icon for its type unless you pass an Icon.',
      "- rows is an array of value arrays in column order (dates as ISO strings, selects as the SelectItem value). Edited data is submitted when the user clicks Save Changes.",
      '- Table is COLUMN-oriented: Table([Col("Label", dataArray), Col("Count", countArray, "number")]). Use array pluck for data: data.rows.fieldName',
      '- Col data can be component arrays for styled cells: Col("Status", @Each(data.rows, "item", Tag(item.status, null, item.status == "open" ? "success" : "danger")))',
      '- Row actions: Col("Actions", @Each(data.rows, "t", Button("Edit", Action([@Set($showEdit, true), @Set($editId, t.id)]))))',
      '- Sortable: sorted = @Sort(data.rows, $sortField, "desc"). Bind $sortField to Select. Use sorted.fieldName for Col data',
      '- Searchable: filtered = @Filter(data.rows, "title", "contains", $search). Bind $search to Input',
      "- Chain sort + filter: filtered = @Filter(...) then sorted = @Sort(filtered, ...) — use sorted for both Table and Charts",
      '- Empty state: @Count(data.rows) > 0 ? Table([...]) : Text("No data yet")',
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
    notes: [
      '- Charts accept column arrays: LineChart(labels, [Series("Name", values)]). Use array pluck: LineChart(data.rows.day, [Series("Views", data.rows.views)])',
      '- Use Cards to wrap charts, titled with the Card title and subtitle args, e.g. Card([chart], null, "Revenue by month", "Jul–Sep"), never a Heading or Text title inside the Card, but never wrap a Table or EditableTable in a Card: tables draw their own frame, so they sit directly in a Section or TabItem.',
      "- Chart + Table from same source: use @Sort or @Filter result for both LineChart and Table Col data",
      '- Multiple chart views: use Tabs — Tabs([TabItem("line", "Line", [LineChart(...)]), TabItem("bar", "Bar", [BarChart(...)])])',
    ],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "SingleStackedBarChart", "Slice"],
    notes: [
      "- PieChart and BarChart need NUMBERS, not objects. For list data, use @Count(@Filter(...)) to aggregate:",
      '- PieChart from list: `PieChart(["Low", "Med", "High"], [@Count(@Filter(data.rows, "priority", "==", "low")), @Count(@Filter(data.rows, "priority", "==", "medium")), @Count(@Filter(data.rows, "priority", "==", "high"))], "donut")`',
      '- KPI from count: `Metric("" + @Count(@Filter(data.rows, "status", "==", "open")), null, "vertical", "large")`',
    ],
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
      "- For Form fields, define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.",
      "- NEVER nest Form inside Form — each Form should be a standalone container.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.",
      "- rules is an optional object: {required: true, email: true, minLength: 8, maxLength: 100}",
      "- Available rules: required, email, min, max, minLength, maxLength, pattern, url, numeric",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
      '- Conditional fields: $country == "US" ? stateField : $country == "UK" ? postcodeField : addressField',
      '- Edit form in Modal: Modal("Edit", $showEdit, [Form("edit", Buttons([saveBtn, cancelBtn]), [fields...])]). Save button should include @Set($showEdit, false) to close modal.',
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons", "IconButton"],
    notes: [
      '- Toggle in @Each: @Each(rows, "t", Button(t.status == "open" ? "Close" : "Reopen", Action([...])))',
    ],
  },
  {
    name: "Data Display",
    components: [
      "TagBlock",
      "Tag",
      "Icon",
      "EntityList",
      "EntityListItem",
      "ListBlock",
      "ListItem",
      "Timeline",
      "TimelineItem",
      "Checklist",
      "ChecklistItem",
    ],
    notes: [
      "- Icon is a lucide line icon by exact kebab-case name that fills icon slots (LeadingText, Tag, ChipItem, Avatar, EntityTitle, IconButton, OptionCard); the host sets its size, stroke and color. An unknown name shows a plain circle.",
      '- Color-mapped Tag: Tag(value, null, value == "high" ? "danger" : value == "medium" ? "warning" : "neutral")',
      "- EntityList is a compact list of EntityListItem(left, right?, rightVariant?) rows. left is a plain string for key/value facts, an EntityTitle for people, companies or products, or a LeadingText for facts with an icon; right is an optional string, Metric, Tag or Text. size='default' also supports a header and footer row; size='small' does not.",
      "- ListBlock is a numbered (default) or plain list of ListItem references. Numbered suits rankings and ordered picks; plain suits people, companies or places that lead with an Avatar. A ListItem is clickable only with an action.",
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
  {
    name: "Response endings",
    components: ["FollowUpBlock", "FollowUpItem", "Sources"],
    notes: [
      '- FollowUpBlock([FollowUpItem("Show 5-year price performance"), FollowUpItem("Add NVDA to this comparison")]) lists 3–4 short next questions under a "Related Queries" header; clicking one sends its text as the user\'s next message. Put it last in the final Section of an answer that invites more exploration (research, comparisons, plans), never after a clarifying question or a form.',
      "- Sources([{ title, sourceName, url }]) is a row of source cards with favicons. Add it only when the answer used real references from a search or tool result, never invented ones, as the very last child of the final Section, after any FollowUpBlock.",
    ],
  },
];

// ── Examples & prompt options ──
export { openuiAdditionalRules, openuiExamples, openuiPromptOptions } from "./prompt-options";

// ── Library ──

export const openuiLibrary = createLibrary({
  root: "Stack",
  componentGroups: openuiComponentGroups,
  components: [
    // Content
    Card,
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
    // Tables
    Table,
    Col,
    EditableTable,
    EditableCol,
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
    ChipItem,
    Chips,
    OptionCard,
    OptionCards,
    // Buttons
    Button,
    Buttons,
    IconButton,
    // Layout
    Stack,
    Section,
    Grid,
    Shell,
    Bleed,
    Tabs,
    TabItem,
    Accordion,
    AccordionItem,
    Steps,
    StepsItem,
    Carousel,
    Separator,
    // Data Display
    TagBlock,
    Tag,
    Icon,
    EntityList,
    EntityListItem,
    ListBlock,
    ListItem,
    Timeline,
    TimelineItem,
    Checklist,
    ChecklistItem,
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
    // Modal
    Modal,
    // Response endings
    FollowUpBlock,
    FollowUpItem,
    Sources,
  ],
});
