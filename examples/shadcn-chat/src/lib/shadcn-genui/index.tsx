"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";

// Content
import { Alert } from "./components/alert";
import { Avatar } from "./components/avatar";
import { ShadcnBadgeComponent } from "./components/badge";
import { CardHeader } from "./components/card-header";
import { CodeBlock } from "./components/code-block";
import { Image, ImageBlock } from "./components/image";
import { MarkDownRenderer } from "./components/markdown-renderer";
import { Progress } from "./components/progress";
import { Separator } from "./components/separator";
import { TextContent } from "./components/text-content";

// Charts
import {
  AreaChartCondensed,
  BarChartCondensed,
  LineChartCondensed,
  PieChartComponent,
  Point,
  RadarChartComponent,
  RadialChartComponent,
  ScatterChartComponent,
  ScatterSeries,
  Series,
  Slice,
} from "./components/charts";

// Forms
import { CheckBoxGroup, CheckBoxItem } from "./components/checkbox-group";
import { DatePicker } from "./components/date-picker";
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { Input } from "./components/input";
import { Label } from "./components/label";
import { RadioGroup, RadioItem } from "./components/radio-group";
import { Select, SelectItem } from "./components/select";
import { Slider } from "./components/slider";
import { SwitchGroup, SwitchItem } from "./components/switch-group";
import { TextArea } from "./components/textarea";

// Buttons
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";

// Layout
import { Accordion, AccordionItemDef } from "./components/accordion";
import { Carousel } from "./components/carousel";
import { TabItem, Tabs } from "./components/tabs";

// Data Display
import { Col, Table } from "./components/table";
import { Tag, TagBlock } from "./components/tag";

// Chat-specific
import { FollowUpBlock, FollowUpItem } from "./components/follow-up-block";

// New components
import { AlertDialogBlock } from "./components/alert-dialog-block";
import { CalendarBlock } from "./components/calendar-block";
import { DialogBlock } from "./components/dialog-block";
import { DrawerBlock } from "./components/drawer-block";
import { PaginationBlock } from "./components/pagination-block";
import { Blockquote, Heading, InlineCode } from "./components/typography";

import { ChatContentChildUnion } from "./unions";

const ChatCardChildUnion = z.union([...ChatContentChildUnion.options, Tabs.ref, Carousel.ref]);

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <Card>
      <CardContent className="p-0 space-y-3">{renderNode(props.children)}</CardContent>
    </Card>
  ),
});

// ── Component Groups ──

export const shadcnComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: [
      "CardHeader",
      "TextContent",
      "MarkDownRenderer",
      "Alert",
      "Badge",
      "Avatar",
      "CodeBlock",
      "Image",
      "ImageBlock",
      "Progress",
      "Separator",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
  },
  {
    name: "Charts (2D)",
    components: ["BarChart", "LineChart", "AreaChart", "RadarChart", "Series"],
  },
  {
    name: "Charts (1D)",
    components: ["PieChart", "RadialChart", "Slice"],
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
    name: "Follow-ups",
    components: ["FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.",
      "- Clicking a FollowUpItem sends its text to the LLM as a user message.",
    ],
  },
  {
    name: "Layout",
    components: ["Tabs", "TabItem", "Accordion", "AccordionItem", "Carousel"],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      "- Carousel takes an array of slides, where each slide is an array of content.",
      "- IMPORTANT: Every slide in a Carousel must have the same structure.",
    ],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag"],
  },
  {
    name: "Typography",
    components: ["Heading", "Blockquote", "InlineCode"],
    notes: [
      '- Heading levels: "h1" | "h2" | "h3" | "h4". Each renders with appropriate shadcn/ui typography styles.',
      "- Blockquote for styled quotes with optional cite attribution.",
      "- InlineCode for monospace code snippets within text.",
    ],
  },
  {
    name: "Calendar",
    components: ["CalendarBlock"],
    notes: [
      '- CalendarBlock renders a standalone interactive calendar. mode: "single" | "multiple" | "range".',
      "- Use numberOfMonths to show multiple months side by side.",
      "- Use defaultMonth (ISO date string) to set the initial visible month.",
    ],
  },
  {
    name: "Navigation",
    components: ["PaginationBlock"],
    notes: ["- PaginationBlock takes currentPage and totalPages."],
  },
  {
    name: "Overlays",
    components: ["DialogBlock", "AlertDialogBlock", "DrawerBlock"],
    notes: [
      "- DialogBlock renders a button that opens a modal dialog with content inside.",
      "- AlertDialogBlock renders a confirmation dialog with cancel/confirm actions.",
      "- DrawerBlock renders a bottom drawer panel triggered by a button.",
    ],
  },
];

// ── Examples ──

export const shadcnExamples: string[] = [
  `Example 1 — Table with follow-ups:
root = Card([title, tbl, followUps])
title = TextContent("Top Languages", "large-heavy")
tbl = Table(cols, rows)
cols = [Col("Language", "string"), Col("Users (M)", "number"), Col("Year", "number")]
rows = [["Python", 15.7, 1991], ["JavaScript", 14.2, 1995], ["Java", 12.1, 1995]]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`,

  `Example 2 — Form with validation:
root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", { type: "continue_conversation" }, "default")])`,

  `Example 3 — Alert variants:
root = Card([info, success, warning, danger])
info = Alert("Update available", "A new version is available for download.", "info")
success = Alert("Payment confirmed", "Your transaction was successful.", "success")
warning = Alert("Disk almost full", "You have less than 10% storage remaining.", "warning")
danger = Alert("Account suspended", "Please contact support immediately.", "destructive")`,

  `Example 4 — Bar chart with badges:
root = Card([header, badges, chart, followUps])
header = CardHeader("Monthly Revenue", "Q4 2024 performance across regions")
badges = TagBlock([Tag("Live data", "default"), Tag("USD", "secondary"), Tag("Grouped", "outline")])
chart = BarChart(["Oct", "Nov", "Dec"], [s1, s2], "grouped", "Month", "Revenue ($K)")
s1 = Series("North America", [420, 380, 510])
s2 = Series("Europe", [310, 290, 340])
followUps = FollowUpBlock([FollowUpItem("Show as line chart"), FollowUpItem("Add Asia-Pacific")])`,

  `Example 5 — Buttons with all variants:
root = Card([title, btns])
title = TextContent("Button Styles", "large-heavy")
btns = Buttons([b1, b2, b3, b4, b5, b6])
b1 = Button("Default", { type: "continue_conversation" }, "default")
b2 = Button("Secondary", { type: "continue_conversation" }, "secondary")
b3 = Button("Outline", { type: "continue_conversation" }, "outline")
b4 = Button("Ghost", { type: "continue_conversation" }, "ghost")
b5 = Button("Link", { type: "continue_conversation" }, "link")
b6 = Button("Destructive", { type: "continue_conversation" }, "destructive")`,

  `Example 6 — Tabs with charts:
root = Card([header, tabs])
header = CardHeader("Sales Dashboard", "Compare metrics across time periods")
tabs = Tabs([tab1, tab2, tab3])
tab1 = TabItem("revenue", "Revenue", [revChart])
tab2 = TabItem("users", "Users", [usersChart])
tab3 = TabItem("breakdown", "Breakdown", [pieChart])
revChart = BarChart(["Jan", "Feb", "Mar", "Apr"], [Series("Revenue", [45, 52, 61, 58])], "grouped", "Month", "USD ($K)")
usersChart = LineChart(["Jan", "Feb", "Mar", "Apr"], [Series("Active", [1200, 1350, 1500, 1420]), Series("New", [300, 420, 380, 450])], "Month", "Users")
pieChart = PieChart([Slice("Desktop", 62), Slice("Mobile", 31), Slice("Tablet", 7)])`,

  `Example 7 — Typography showcase:
root = Card([h1, h2, h3, quote, codeEx, sep, text])
h1 = Heading("Welcome to the Platform", "h1")
h2 = Heading("Getting Started", "h2")
h3 = Heading("Prerequisites", "h3")
quote = Blockquote("The best way to predict the future is to invent it.", "Alan Kay")
codeEx = InlineCode("npm install @acme/sdk")
sep = Separator()
text = TextContent("Follow the steps below to get up and running.")`,

  `Example 8 — Dialog and AlertDialog:
root = Card([title, btns])
title = TextContent("Actions Demo", "large-heavy")
btns = Buttons([viewBtn, deleteBtn])
viewBtn = DialogBlock("View Details", "Product Details", "Full specifications for Widget Pro", [detailText, detailTable], "outline")
detailText = TextContent("Here are the complete specifications:")
detailTable = Table([Col("Spec", "string"), Col("Value", "string")], [["Weight", "2.5 kg"], ["Dimensions", "30x20x10 cm"]])
deleteBtn = AlertDialogBlock("Delete Item", "Are you sure?", "This action cannot be undone. This will permanently delete the item.", "Delete", "Cancel", "destructive")`,

  `Example 9 — Pagination:
root = Card([title, table, pagination])
title = TextContent("Search Results", "large-heavy")
table = Table([Col("Name", "string"), Col("Status", "string")], [["Item 1", "Active"], ["Item 2", "Pending"], ["Item 3", "Active"]])
pagination = PaginationBlock(2, 10)`,

  `Example 10 — Drawer with content:
root = Card([title, drawerBtn])
title = TextContent("Report Summary", "large-heavy")
drawerBtn = DrawerBlock("View Full Report", "Quarterly Report Q4 2024", "Detailed breakdown of performance metrics", [chart, summary])
chart = BarChart(["Oct", "Nov", "Dec"], [Series("Revenue", [42, 38, 51])], "grouped", "Month", "Revenue ($K)")
summary = TextContent("Overall revenue increased by 12% compared to Q3.")`,

  `Example 11 — Standalone calendar:
root = Card([title, cal])
title = TextContent("Pick a Date", "large-heavy")
cal = CalendarBlock("single", "2025-01-01", 1)`,

  `Example 12 — Range calendar with two months:
root = Card([title, desc, cal])
title = TextContent("Select Travel Dates", "large-heavy")
desc = TextContent("Choose your check-in and check-out dates.", "small")
cal = CalendarBlock("range", "2025-06-01", 2)`,
];

export const shadcnAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically.",
  "Card is the only layout container. Do NOT use Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "Carousel takes an array of slides, where each slide is an array of content.",
  "IMPORTANT: Every slide in a Carousel must use the same component structure in the same order.",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions.",
  "Never nest Form inside Form.",
  'Button variant mapping — "default" (filled primary), "secondary" (muted), "outline" (bordered), "ghost" (transparent), "link" (underlined text), "destructive" (red/danger). Use the right variant for the context.',
  'Button size mapping — "default" (standard), "xs" (extra small), "sm" (small), "lg" (large), "icon" (square icon-only).',
  'Badge/Tag variants — "default" (filled primary), "secondary" (muted fill), "destructive" (red), "outline" (bordered), "ghost" (minimal).',
  'Alert variants — "default" (neutral), "destructive" (red error), "info" (blue informational), "success" (green confirmation), "warning" (amber caution). Always pick the variant that matches the message tone.',
  "When the user asks for a specific component (e.g. 'show me an accordion'), generate a realistic, fully-populated example of that component with sample data.",
  "Use CardHeader for section titles. Use TextContent for body text. Use MarkDownRenderer for rich formatted text with links, bold, lists.",
  "Use CodeBlock with a language prop for code snippets. Always set the language for syntax context.",
  "Use Progress for completion/loading indicators.",
  "Use Avatar for user/profile images. Use Image/ImageBlock for content images.",
  'Use Heading for section titles with level: "h1" | "h2" | "h3" | "h4". Use Blockquote for quotes. Use InlineCode for inline code.',
  "Use DialogBlock to show a button that opens a modal dialog with content inside. Good for details/previews.",
  "Use AlertDialogBlock for confirmation dialogs (delete, logout, etc). Confirm action sends message to LLM.",
  "Use DrawerBlock for bottom panels with additional content. Good for details/reports.",
  "Use PaginationBlock for paginated data. currentPage/totalPages are required.",
  'Use CalendarBlock for standalone calendar display. mode: "single" (pick one date), "multiple" (pick many), "range" (date range). Use numberOfMonths to show side-by-side months.',
];

export const shadcnPromptOptions: PromptOptions = {
  examples: shadcnExamples,
  additionalRules: shadcnAdditionalRules,
};

// ── Library ──

export const shadcnChatLibrary = createLibrary({
  root: "Card",
  componentGroups: shadcnComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
    TextContent,
    MarkDownRenderer,
    Alert,
    ShadcnBadgeComponent,
    Avatar,
    CodeBlock,
    Image,
    ImageBlock,
    Progress,
    Separator,
    // Tables
    Table,
    Col,
    // Charts (2D)
    BarChartCondensed,
    LineChartCondensed,
    AreaChartCondensed,
    RadarChartComponent,
    Series,
    // Charts (1D)
    PieChartComponent,
    RadialChartComponent,
    Slice,
    // Charts (Scatter)
    ScatterChartComponent,
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
    // Follow-ups
    FollowUpBlock,
    FollowUpItem,
    // Layout
    Tabs,
    TabItem,
    Accordion,
    AccordionItemDef,
    Carousel,
    // Data Display
    TagBlock,
    Tag,
    // Typography
    Heading,
    Blockquote,
    InlineCode,
    // Navigation
    PaginationBlock,
    // Overlays
    DialogBlock,
    AlertDialogBlock,
    DrawerBlock,
    // Calendar
    CalendarBlock,
  ],
});
