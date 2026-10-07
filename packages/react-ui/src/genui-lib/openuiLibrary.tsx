"use client";

import type { ComponentGroup } from "@openuidev/react-lang";
import { createLibrary } from "@openuidev/react-lang";

// Card building blocks
import { BoldText } from "./BoldText";
import { EntityList } from "./EntityList";
import { IconButton } from "./IconButton";
import { IconText } from "./IconText";
import { ImageText } from "./ImageText";
import { ImageTextLarge } from "./ImageTextLarge";
import { InlineHeader } from "./InlineHeader";
import { ListBlock } from "./ListBlock";
import { ListItem } from "./ListItem";
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

// Content
import { Callout } from "./Callout";
import { Card } from "./Card";
import { CardHeader } from "./CardHeader";
import { CodeBlock } from "./CodeBlock";
import { Image } from "./Image";
import { ImageBlock } from "./ImageBlock";
import { ImageGallery } from "./ImageGallery";
import { MarkDownRenderer } from "./MarkDownRenderer";
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

// Layout
import { Accordion, AccordionItem } from "./Accordion";
import { Carousel } from "./Carousel";
import { Separator } from "./Separator";
import { Stack } from "./Stack";
import { Steps, StepsItem } from "./Steps";
import { TabItem, Tabs } from "./Tabs";

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
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      '- Prefer justify "start" (or omit justify) with wrap=true for stable columns instead of uneven gutters.',
      "- Use nested Stacks when you need explicit rows/sections.",
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
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Callout",
      "TextCallout",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "CodeBlock",
      "InlineHeader",
    ],
    notes: [
      "- InlineHeader is a compact heading + description pair for labelling a block (lighter than CardHeader).",
      '- Use Cards to group related KPIs or sections. Stack with direction "row" for side-by-side layouts.',
      '- Success toast: Callout("success", "Saved", "Done.", $showSuccess) — use @Set($showSuccess, true) in save action, auto-dismisses after 3s. For errors: result.status == "error" ? Callout("error", "Failed", result.error) : null',
      '- KPI card: Card([TextContent("Label", "small"), TextContent("" + @Count(@Filter(data.rows, "field", "==", "value")), "large-heavy")])',
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col", "EditableTable"],
    notes: [
      "- EditableTable lets the user edit cells inline. Give it a unique name, columns of { type, key, header } with type one of text | number | date-single | select | url (select also needs options: [{ value, label }]).",
      "- data is an array of { id, values } rows where values are ordered positionally to match columns. Edited data is submitted when the user clicks Save Changes.",
      '- Table is COLUMN-oriented: Table([Col("Label", dataArray), Col("Count", countArray, "number")]). Use array pluck for data: data.rows.fieldName',
      '- Col data can be component arrays for styled cells: Col("Status", @Each(data.rows, "item", Tag(item.status, null, "sm", item.status == "open" ? "success" : "danger")))',
      '- Row actions: Col("Actions", @Each(data.rows, "t", Button("Edit", Action([@Set($showEdit, true), @Set($editId, t.id)]))))',
      '- Sortable: sorted = @Sort(data.rows, $sortField, "desc"). Bind $sortField to Select. Use sorted.fieldName for Col data',
      '- Searchable: filtered = @Filter(data.rows, "title", "contains", $search). Bind $search to Input',
      "- Chain sort + filter: filtered = @Filter(...) then sorted = @Sort(filtered, ...) — use sorted for both Table and Charts",
      '- Empty state: @Count(data.rows) > 0 ? Table([...]) : TextContent("No data yet")',
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
      "- Use Cards to wrap charts with CardHeader for titled sections",
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
      '- KPI from count: `TextContent("" + @Count(@Filter(data.rows, "status", "==", "open")), "large-heavy")`',
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
      "- Icon renders a lucide icon by kebab-case name; it is also used as the icon of IconButton, IconText and OptionCard.",
      '- Toggle in @Each: @Each(rows, "t", Button(t.status == "open" ? "Close" : "Reopen", Action([...])))',
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag", "Icon", "EntityList", "ListBlock", "ListItem"],
    notes: [
      '- Color-mapped Tag: Tag(value, null, "sm", value == "high" ? "danger" : value == "medium" ? "warning" : "neutral")',
      "- EntityList is a compact two-column list of { left, right } rows (e.g. name / value). size='default' also supports a header and footer row; size='small' does not.",
      "- ListBlock is a numbered or image list of ListItem references. An action on ListItem is optional.",
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

// ── Examples & prompt options ──
export { openuiAdditionalRules, openuiExamples, openuiPromptOptions } from "./prompt-options";

// ── Library ──

export const openuiLibrary = createLibrary({
  root: "Stack",
  componentGroups: openuiComponentGroups,
  components: [
    // Content
    Card,
    CardHeader,
    TextContent,
    MarkDownRenderer,
    Callout,
    TextCallout,
    Image,
    ImageBlock,
    ImageGallery,
    CodeBlock,
    InlineHeader,
    // Tables
    Table,
    Col,
    EditableTable,
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
    ListBlock,
    ListItem,
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
    // Modal
    Modal,
  ],
});
