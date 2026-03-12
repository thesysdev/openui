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
import { Skeleton } from "./components/skeleton";
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
import { ToggleGroup, ToggleGroupItem } from "./components/toggle-group";

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
import { ListBlock, ListItem } from "./components/list-block";
import { SectionBlock, SectionItem } from "./components/section-block";

// New components
import { AlertDialogBlock } from "./components/alert-dialog-block";
import { Breadcrumb, BreadcrumbItemDef } from "./components/breadcrumb";
import { CalendarBlock } from "./components/calendar-block";
import { DialogBlock } from "./components/dialog-block";
import { DrawerBlock } from "./components/drawer-block";
import { EmptyState } from "./components/empty-state";
import { HoverInfo } from "./components/hover-info";
import { InputOTPField } from "./components/input-otp-field";
import { Kbd } from "./components/kbd";
import { PaginationBlock } from "./components/pagination-block";
import { Spinner } from "./components/spinner";
import { TooltipText } from "./components/tooltip-text";
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
    <Card className="border-0 shadow-none bg-transparent">
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
      "Skeleton",
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
      "ToggleGroup",
      "ToggleGroupItem",
      "InputOTPField",
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
    ],
  },
  {
    name: "Sections",
    components: ["SectionBlock", "SectionItem"],
    notes: [
      "- SectionBlock renders collapsible accordion sections that auto-open as they stream.",
      "- Each section needs a unique `value` id, a `trigger` label, and a `content` array.",
      "- Set isFoldable=false to render sections as flat headers instead of accordion.",
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
    name: "Feedback & Status",
    components: ["Spinner", "EmptyState"],
    notes: [
      '- Spinner for loading indicators. size: "sm" | "default" | "lg". Optional label.',
      '- EmptyState for placeholder when no data exists. icon: "inbox" | "search" | "file" | "image" | "users".',
    ],
  },
  {
    name: "Navigation",
    components: ["Breadcrumb", "BreadcrumbItem", "PaginationBlock"],
    notes: [
      "- Breadcrumb takes an array of BreadcrumbItem refs. Last item is shown as current page.",
      "- PaginationBlock takes currentPage and totalPages.",
    ],
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
  {
    name: "Interactive Text",
    components: ["TooltipText", "HoverInfo", "Kbd"],
    notes: [
      "- TooltipText shows a hover tooltip on text. Good for definitions/abbreviations.",
      "- HoverInfo shows a rich hover card with title and description.",
      "- Kbd displays keyboard shortcuts. keys: array of key labels joined with +.",
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

  `Example 2 — Clickable list:
root = Card([title, list])
title = TextContent("Choose a topic", "large-heavy")
list = ListBlock([item1, item2, item3])
item1 = ListItem("Getting started", "New to the platform? Start here.")
item2 = ListItem("Advanced features", "Deep dives into powerful capabilities.")
item3 = ListItem("Troubleshooting", "Common issues and how to fix them.")`,

  `Example 3 — Form with validation:
root = Card([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
btns = Buttons([Button("Submit", { type: "continue_conversation" }, "default")])`,

  `Example 4 — Alert variants:
root = Card([info, success, warning, danger])
info = Alert("Update available", "A new version is available for download.", "info")
success = Alert("Payment confirmed", "Your transaction was successful.", "success")
warning = Alert("Disk almost full", "You have less than 10% storage remaining.", "warning")
danger = Alert("Account suspended", "Please contact support immediately.", "destructive")`,

  `Example 5 — Bar chart with badges:
root = Card([header, badges, chart, followUps])
header = CardHeader("Monthly Revenue", "Q4 2024 performance across regions")
badges = TagBlock([Tag("Live data", "default"), Tag("USD", "secondary"), Tag("Grouped", "outline")])
chart = BarChart(["Oct", "Nov", "Dec"], [s1, s2], "grouped", "Month", "Revenue ($K)")
s1 = Series("North America", [420, 380, 510])
s2 = Series("Europe", [310, 290, 340])
followUps = FollowUpBlock([FollowUpItem("Show as line chart"), FollowUpItem("Add Asia-Pacific")])`,

  `Example 6 — Buttons with all variants:
root = Card([title, btns])
title = TextContent("Button Styles", "large-heavy")
btns = Buttons([b1, b2, b3, b4, b5, b6])
b1 = Button("Default", { type: "continue_conversation" }, "default")
b2 = Button("Secondary", { type: "continue_conversation" }, "secondary")
b3 = Button("Outline", { type: "continue_conversation" }, "outline")
b4 = Button("Ghost", { type: "continue_conversation" }, "ghost")
b5 = Button("Link", { type: "continue_conversation" }, "link")
b6 = Button("Destructive", { type: "continue_conversation" }, "destructive")`,

  `Example 7 — Collapsible sections with mixed content:
root = Card([header, sections])
header = CardHeader("Getting Started Guide")
sections = SectionBlock([s1, s2, s3])
s1 = SectionItem("install", "Installation", [s1text, s1code])
s1text = TextContent("Install the package using your preferred package manager.")
s1code = CodeBlock("npm install @acme/sdk", "bash", "Terminal")
s2 = SectionItem("config", "Configuration", [s2text, s2alert])
s2text = MarkDownRenderer("Create a **config.json** file in your project root.")
s2alert = Alert("Important", "Make sure to set your API key before proceeding.", "warning")
s3 = SectionItem("usage", "Usage", [s3text, s3code])
s3text = TextContent("Import and initialize the client.")
s3code = CodeBlock("import { Client } from '@acme/sdk';\\nconst client = new Client({ apiKey: '...' });", "typescript", "client.ts")`,

  `Example 8 — Tabs with charts:
root = Card([header, tabs])
header = CardHeader("Sales Dashboard", "Compare metrics across time periods")
tabs = Tabs([tab1, tab2, tab3])
tab1 = TabItem("revenue", "Revenue", [revChart])
tab2 = TabItem("users", "Users", [usersChart])
tab3 = TabItem("breakdown", "Breakdown", [pieChart])
revChart = BarChart(["Jan", "Feb", "Mar", "Apr"], [Series("Revenue", [45, 52, 61, 58])], "grouped", "Month", "USD ($K)")
usersChart = LineChart(["Jan", "Feb", "Mar", "Apr"], [Series("Active", [1200, 1350, 1500, 1420]), Series("New", [300, 420, 380, 450])], "Month", "Users")
pieChart = PieChart([Slice("Desktop", 62), Slice("Mobile", 31), Slice("Tablet", 7)])`,

  `Example 9 — Typography showcase:
root = Card([h1, h2, h3, quote, codeEx, sep, text])
h1 = Heading("Welcome to the Platform", "h1")
h2 = Heading("Getting Started", "h2")
h3 = Heading("Prerequisites", "h3")
quote = Blockquote("The best way to predict the future is to invent it.", "Alan Kay")
codeEx = InlineCode("npm install @acme/sdk")
sep = Separator()
text = TextContent("Follow the steps below to get up and running.")`,

  `Example 10 — Breadcrumb navigation:
root = Card([breadcrumb, title, text])
breadcrumb = Breadcrumb([bc1, bc2, bc3])
bc1 = BreadcrumbItem("Home", "/")
bc2 = BreadcrumbItem("Products", "/products")
bc3 = BreadcrumbItem("Widget Pro")
title = TextContent("Widget Pro Details", "large-heavy")
text = TextContent("The Widget Pro is our premium offering.")`,

  `Example 11 — Dialog and AlertDialog:
root = Card([title, btns])
title = TextContent("Actions Demo", "large-heavy")
btns = Buttons([viewBtn, deleteBtn])
viewBtn = DialogBlock("View Details", "Product Details", "Full specifications for Widget Pro", [detailText, detailTable], "outline")
detailText = TextContent("Here are the complete specifications:")
detailTable = Table([Col("Spec", "string"), Col("Value", "string")], [["Weight", "2.5 kg"], ["Dimensions", "30x20x10 cm"]])
deleteBtn = AlertDialogBlock("Delete Item", "Are you sure?", "This action cannot be undone. This will permanently delete the item.", "Delete", "Cancel", "destructive")`,

  `Example 12 — Keyboard shortcuts:
root = Card([title, shortcuts])
title = TextContent("Keyboard Shortcuts", "large-heavy")
shortcuts = Table([Col("Action", "string"), Col("Shortcut", "string")], [["Copy", "⌘+C"], ["Paste", "⌘+V"], ["Undo", "⌘+Z"], ["Save", "⌘+S"]])`,

  `Example 13 — Empty state:
root = Card([empty, followUp])
empty = EmptyState("No results found", "Try adjusting your search or filter to find what you're looking for.", "search")
followUp = FollowUpBlock([FollowUpItem("Clear filters"), FollowUpItem("Browse all items")])`,

  `Example 14 — Pagination:
root = Card([title, table, pagination])
title = TextContent("Search Results", "large-heavy")
table = Table([Col("Name", "string"), Col("Status", "string")], [["Item 1", "Active"], ["Item 2", "Pending"], ["Item 3", "Active"]])
pagination = PaginationBlock(2, 10)`,

  `Example 15 — Tooltip and HoverCard:
root = Card([title, text])
title = TextContent("Glossary", "large-heavy")
text = MarkDownRenderer("The system uses **TCP/IP** for network communication.")`,

  `Example 16 — Spinner loading state:
root = Card([spinner, text])
spinner = Spinner("Loading your data...", "lg")
text = TextContent("Please wait while we fetch the latest information.", "small")`,

  `Example 17 — Drawer with content:
root = Card([title, drawerBtn])
title = TextContent("Report Summary", "large-heavy")
drawerBtn = DrawerBlock("View Full Report", "Quarterly Report Q4 2024", "Detailed breakdown of performance metrics", [chart, summary])
chart = BarChart(["Oct", "Nov", "Dec"], [Series("Revenue", [42, 38, 51])], "grouped", "Month", "Revenue ($K)")
summary = TextContent("Overall revenue increased by 12% compared to Q3.")`,

  `Example 18 — OTP verification form:
root = Card([title, desc, form])
title = TextContent("Verify Your Email", "large-heavy")
desc = TextContent("Enter the 6-digit code sent to your email address.", "small")
form = Form("otp-verify", btns, [otpField])
otpField = FormControl("Verification Code", InputOTPField("otp", 6, 3))
btns = Buttons([Button("Verify", { type: "continue_conversation" }, "default")])`,

  `Example 19 — Standalone calendar:
root = Card([title, cal])
title = TextContent("Pick a Date", "large-heavy")
cal = CalendarBlock("single", "2025-01-01", 1)`,

  `Example 20 — Range calendar with two months:
root = Card([title, desc, cal])
title = TextContent("Select Travel Dates", "large-heavy")
desc = TextContent("Choose your check-in and check-out dates.", "small")
cal = CalendarBlock("range", "2025-06-01", 2)`,
];

export const shadcnAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically.",
  "Card is the only layout container. Do NOT use Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "Use ListBlock when presenting a set of options or steps the user can click to select.",
  "Use SectionBlock to group long responses into collapsible sections — good for reports, FAQs, and structured content.",
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
  "Use Progress for completion/loading indicators. Use Skeleton for loading placeholders.",
  "Use Avatar for user/profile images. Use Image/ImageBlock for content images.",
  'Use Heading for section titles with level: "h1" | "h2" | "h3" | "h4". Use Blockquote for quotes. Use InlineCode for inline code.',
  "Use Breadcrumb with BreadcrumbItem refs to show navigation paths. Last item has no href (current page).",
  "Use DialogBlock to show a button that opens a modal dialog with content inside. Good for details/previews.",
  "Use AlertDialogBlock for confirmation dialogs (delete, logout, etc). Confirm action sends message to LLM.",
  "Use DrawerBlock for bottom panels with additional content. Good for details/reports.",
  "Use Spinner for loading states. Use EmptyState when no data is available — pick the right icon for context.",
  "Use PaginationBlock for paginated data. currentPage/totalPages are required.",
  "Use TooltipText to add hover tooltips on terms. Use HoverInfo for richer hover previews.",
  "Use Kbd to display keyboard shortcuts as styled key caps.",
  "Use InputOTPField in forms for OTP/verification code entry. length and groupSize control the layout.",
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
    Skeleton,
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
    ToggleGroup,
    ToggleGroupItem,
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
    // Feedback & Status
    Spinner,
    EmptyState,
    // Navigation
    Breadcrumb,
    BreadcrumbItemDef,
    PaginationBlock,
    // Overlays
    DialogBlock,
    AlertDialogBlock,
    DrawerBlock,
    // Interactive Text
    TooltipText,
    HoverInfo,
    Kbd,
    // Calendar
    CalendarBlock,
    // Form extras
    InputOTPField,
  ],
});
