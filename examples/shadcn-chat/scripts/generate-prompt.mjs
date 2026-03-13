#!/usr/bin/env node

/**
 * Generates system-prompt.txt by importing the shadcn GenUI library
 * and calling its .prompt() method.
 *
 * Uses tsx (from react-ui's node_modules) to compile TSX source files,
 * and resolves @openuidev packages via direct dist paths to avoid
 * Node.js exports-condition issues with tsx.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const monorepoRoot = resolve(projectRoot, "../..");

// Read the react-lang dist to get generatePrompt and createLibrary
const reactLangDist = pathToFileURL(
  join(monorepoRoot, "packages/react-lang/dist/index.js")
).href;

const reactLang = await import(reactLangDist);
const { createLibrary, defineComponent } = reactLang;

// We need Zod from the project's node_modules
const zodPath = pathToFileURL(
  join(projectRoot, "node_modules/zod/index.js")
).href;
const { z } = await import(zodPath);

// Since we can't easily run the full TSX component definitions outside Next.js,
// we'll build a minimal schema-only version of the library just for prompt generation.
// The schemas are what matter for the prompt — the component render functions don't.

function defineSchemaOnly(name, props, description) {
  return defineComponent({
    name,
    props,
    description,
    component: () => null,
  });
}

// ── Virtual sub-components ──
const Series = defineSchemaOnly("Series", z.object({ category: z.string(), values: z.array(z.number()) }), "One named data series with values matching labels.");
const Slice = defineSchemaOnly("Slice", z.object({ category: z.string(), value: z.number() }), "A single slice in a PieChart or RadialChart.");
const Point = defineSchemaOnly("Point", z.object({ x: z.number(), y: z.number(), label: z.string().optional() }), "A single data point in a ScatterChart series.");
const ScatterSeries = defineSchemaOnly("ScatterSeries", z.object({ category: z.string(), points: z.array(Point.ref) }), "Named scatter series with Point references.");
const Col = defineSchemaOnly("Col", z.object({ header: z.string(), type: z.enum(["string", "number", "boolean"]).optional() }), "Column definition for Table.");
const SelectItem = defineSchemaOnly("SelectItem", z.object({ value: z.string(), label: z.string() }), "Option for Select dropdown.");
const CheckBoxItem = defineSchemaOnly("CheckBoxItem", z.object({ value: z.string(), label: z.string() }), "Option in a CheckBoxGroup.");
const RadioItem = defineSchemaOnly("RadioItem", z.object({ value: z.string(), label: z.string() }), "Option in a RadioGroup.");
const SwitchItem = defineSchemaOnly("SwitchItem", z.object({ value: z.string(), label: z.string() }), "Toggle option in a SwitchGroup.");
const FollowUpItem = defineSchemaOnly("FollowUpItem", z.object({ text: z.string() }), "Clickable follow-up suggestion.");
const Tag = defineSchemaOnly("Tag", z.object({ text: z.string(), variant: z.enum(["default", "secondary", "destructive", "outline", "ghost"]).optional() }), "Styled tag/badge.");

// ── Rules schema ──
const rulesSchema = z.object({ required: z.boolean().optional(), email: z.boolean().optional(), url: z.boolean().optional(), numeric: z.boolean().optional(), min: z.number().optional(), max: z.number().optional(), minLength: z.number().optional(), maxLength: z.number().optional(), pattern: z.string().optional() }).optional();

// ── Action schema ──
const actionSchema = z.union([
  z.object({ type: z.literal("continue_conversation"), context: z.string().optional() }),
  z.object({ type: z.literal("open_url"), url: z.string() }),
  z.object({ type: z.string(), params: z.record(z.string(), z.any()).optional() }),
]).optional();

// ── Components ──
const TextContent = defineSchemaOnly("TextContent", z.object({ text: z.string(), size: z.enum(["small", "default", "large", "small-heavy", "large-heavy"]).optional() }), 'Text block with optional size.');
const MarkDownRenderer = defineSchemaOnly("MarkDownRenderer", z.object({ text: z.string() }), "Renders markdown text with GFM support.");
const CardHeader = defineSchemaOnly("CardHeader", z.object({ title: z.string(), description: z.string().optional() }), "Title/description header block.");
const Alert = defineSchemaOnly("Alert", z.object({ title: z.string(), description: z.string(), variant: z.enum(["default", "destructive", "info", "success", "warning"]).optional() }), 'Alert banner with title and description.');
const Badge = defineSchemaOnly("Badge", z.object({ text: z.string(), variant: z.enum(["default", "secondary", "destructive", "outline", "ghost", "link"]).optional() }), "Inline label/badge.");
const Avatar = defineSchemaOnly("Avatar", z.object({ src: z.string().optional(), alt: z.string().optional(), fallback: z.string() }), "Circular avatar with image and fallback.");
const CodeBlock = defineSchemaOnly("CodeBlock", z.object({ code: z.string(), language: z.string().optional(), title: z.string().optional() }), "Code block with optional language and title.");
const Image = defineSchemaOnly("Image", z.object({ src: z.string(), alt: z.string().optional() }), "Displays an image.");
const ImageBlock = defineSchemaOnly("ImageBlock", z.object({ src: z.string(), alt: z.string().optional(), caption: z.string().optional() }), "Image with optional caption.");
const Progress = defineSchemaOnly("Progress", z.object({ value: z.number(), label: z.string().optional() }), "Progress bar (0-100).");
const Separator = defineSchemaOnly("Separator", z.object({ orientation: z.enum(["horizontal", "vertical"]).optional() }), "Horizontal or vertical rule.");

const Table = defineSchemaOnly("Table", z.object({ columns: z.array(Col.ref), rows: z.array(z.array(z.any())) }), "Data table. columns: Col[], rows: 2D array.");
const TagBlock = defineSchemaOnly("TagBlock", z.object({ tags: z.array(z.union([z.string(), Tag.ref])) }), "Group of tags.");

const BarChart = defineSchemaOnly("BarChart", z.object({ labels: z.array(z.string()), series: z.array(Series.ref), variant: z.enum(["grouped", "stacked"]).optional(), xLabel: z.string().optional(), yLabel: z.string().optional() }), "Vertical bar chart.");
const LineChart = defineSchemaOnly("LineChart", z.object({ labels: z.array(z.string()), series: z.array(Series.ref), xLabel: z.string().optional(), yLabel: z.string().optional() }), "Line chart for trends.");
const AreaChart = defineSchemaOnly("AreaChart", z.object({ labels: z.array(z.string()), series: z.array(Series.ref), xLabel: z.string().optional(), yLabel: z.string().optional() }), "Area chart for volume.");
const PieChart = defineSchemaOnly("PieChart", z.object({ slices: z.array(Slice.ref), donut: z.boolean().optional() }), "Pie or donut chart.");
const RadarChart = defineSchemaOnly("RadarChart", z.object({ labels: z.array(z.string()), series: z.array(Series.ref) }), "Radar chart.");
const RadialChart = defineSchemaOnly("RadialChart", z.object({ slices: z.array(Slice.ref) }), "Radial bar chart.");
const ScatterChart = defineSchemaOnly("ScatterChart", z.object({ series: z.array(ScatterSeries.ref), xLabel: z.string().optional(), yLabel: z.string().optional() }), "Scatter plot.");

const Input = defineSchemaOnly("Input", z.object({ name: z.string(), placeholder: z.string().optional(), type: z.enum(["text", "email", "password", "number", "url"]).optional(), rules: rulesSchema }), "Text input field.");
const TextArea = defineSchemaOnly("TextArea", z.object({ name: z.string(), placeholder: z.string().optional(), rows: z.number().optional(), rules: rulesSchema }), "Multi-line text input.");
const Select = defineSchemaOnly("Select", z.object({ name: z.string(), items: z.array(SelectItem.ref), placeholder: z.string().optional(), rules: rulesSchema }), "Dropdown select.");
const CheckBoxGroup = defineSchemaOnly("CheckBoxGroup", z.object({ name: z.string(), items: z.array(CheckBoxItem.ref) }), "Multiple checkbox options.");
const RadioGroup = defineSchemaOnly("RadioGroup", z.object({ name: z.string(), items: z.array(RadioItem.ref) }), "Radio selection group.");
const SwitchGroup = defineSchemaOnly("SwitchGroup", z.object({ name: z.string(), items: z.array(SwitchItem.ref) }), "Group of toggle switches.");
const Slider = defineSchemaOnly("Slider", z.object({ name: z.string(), min: z.number().optional(), max: z.number().optional(), step: z.number().optional(), defaultValue: z.number().optional() }), "Range slider input.");
const DatePicker = defineSchemaOnly("DatePicker", z.object({ name: z.string(), placeholder: z.string().optional() }), "Date selection with calendar popover.");
const Label = defineSchemaOnly("Label", z.object({ text: z.string(), htmlFor: z.string().optional() }), "Form label.");
const FormControl = defineSchemaOnly("FormControl", z.object({ label: z.string(), field: z.any() }), "Wraps a form field with a label and error display.");

const Button = defineSchemaOnly("Button", z.object({ label: z.string(), action: actionSchema, variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(), size: z.enum(["default", "xs", "sm", "lg", "icon"]).optional() }), 'Clickable button. variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link". size: "default" | "xs" | "sm" | "lg" | "icon".');
const Buttons = defineSchemaOnly("Buttons", z.object({ buttons: z.array(Button.ref), direction: z.enum(["row", "column"]).optional() }), "Group of Button components.");
const Form = defineSchemaOnly("Form", z.object({ name: z.string(), buttons: Buttons.ref, fields: z.array(FormControl.ref).default([]) }), "Form container with fields and action buttons.");

const FollowUpBlock = defineSchemaOnly("FollowUpBlock", z.object({ items: z.array(FollowUpItem.ref) }), "List of follow-up suggestion chips.");

// New components
const Heading = defineSchemaOnly("Heading", z.object({ text: z.string(), level: z.enum(["h1", "h2", "h3", "h4"]).optional() }), 'Heading text. level: "h1" | "h2" | "h3" | "h4". Defaults to "h2".');
const Blockquote = defineSchemaOnly("Blockquote", z.object({ text: z.string(), cite: z.string().optional() }), "Styled blockquote. Optional cite for attribution.");
const InlineCode = defineSchemaOnly("InlineCode", z.object({ code: z.string() }), "Inline code snippet rendered with monospace font.");
const PaginationBlock = defineSchemaOnly("PaginationBlock", z.object({ currentPage: z.number(), totalPages: z.number() }), "Page navigation. currentPage and totalPages control which pages are shown.");
const DialogBlock = defineSchemaOnly("DialogBlock", z.object({ triggerLabel: z.string(), title: z.string(), description: z.string().optional(), content: z.array(z.any()).default([]), triggerVariant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional() }), "Modal dialog triggered by a button.");
const AlertDialogBlock = defineSchemaOnly("AlertDialogBlock", z.object({ triggerLabel: z.string(), title: z.string(), description: z.string(), confirmLabel: z.string().optional(), cancelLabel: z.string().optional(), triggerVariant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional() }), "Confirmation dialog with cancel and confirm buttons.");
const DrawerBlock = defineSchemaOnly("DrawerBlock", z.object({ triggerLabel: z.string(), title: z.string(), description: z.string().optional(), content: z.array(z.any()).default([]) }), "Bottom drawer panel triggered by a button.");
const CalendarBlock = defineSchemaOnly("CalendarBlock", z.object({ mode: z.enum(["single", "multiple", "range"]).optional(), defaultMonth: z.string().optional(), numberOfMonths: z.number().optional(), captionLayout: z.enum(["label", "dropdown"]).optional() }), 'Standalone calendar display. mode: "single" | "multiple" | "range". captionLayout: "label" | "dropdown" (default "dropdown"). numberOfMonths defaults to 1.');

// Content unions
const ContentChildUnion = z.union([TextContent.ref, MarkDownRenderer.ref, CardHeader.ref, Alert.ref, Badge.ref, Avatar.ref, CodeBlock.ref, Image.ref, ImageBlock.ref, Progress.ref, Separator.ref, BarChart.ref, LineChart.ref, AreaChart.ref, PieChart.ref, RadarChart.ref, RadialChart.ref, ScatterChart.ref, Table.ref, TagBlock.ref, Form.ref, Buttons.ref, Heading.ref, Blockquote.ref, InlineCode.ref, PaginationBlock.ref, DialogBlock.ref, AlertDialogBlock.ref, DrawerBlock.ref, CalendarBlock.ref]);

const TabItem = defineSchemaOnly("TabItem", z.object({ value: z.string(), trigger: z.string(), content: z.array(ContentChildUnion) }), "Tab panel.");
const Tabs = defineSchemaOnly("Tabs", z.object({ items: z.array(TabItem.ref), defaultValue: z.string().optional() }), "Tabbed content.");

const AccordionItem = defineSchemaOnly("AccordionItem", z.object({ value: z.string(), trigger: z.string(), content: z.array(ContentChildUnion) }), "Collapsible item inside Accordion.");
const Accordion = defineSchemaOnly("Accordion", z.object({ items: z.array(AccordionItem.ref), type: z.enum(["single", "multiple"]).optional() }), "Collapsible sections.");

const Carousel = defineSchemaOnly("Carousel", z.object({ slides: z.array(z.array(z.any())), variant: z.enum(["default", "card"]).optional() }), "Horizontal sliding content.");

const ChatCardChildUnion = z.union([...ContentChildUnion.options, FollowUpBlock.ref, Tabs.ref, Carousel.ref, Accordion.ref]);
const ChatCard = defineSchemaOnly("Card", z.object({ children: z.array(ChatCardChildUnion) }), "Vertical container for all content in a chat response.");

// ── Component Groups ──
const componentGroups = [
  { name: "Content", components: ["CardHeader", "TextContent", "MarkDownRenderer", "Alert", "Badge", "Avatar", "CodeBlock", "Image", "ImageBlock", "Progress", "Separator"] },
  { name: "Tables", components: ["Table", "Col"] },
  { name: "Charts (2D)", components: ["BarChart", "LineChart", "AreaChart", "RadarChart", "Series"] },
  { name: "Charts (1D)", components: ["PieChart", "RadialChart", "Slice"] },
  { name: "Charts (Scatter)", components: ["ScatterChart", "ScatterSeries", "Point"] },
  { name: "Forms", components: ["Form", "FormControl", "Label", "Input", "TextArea", "Select", "SelectItem", "DatePicker", "Slider", "CheckBoxGroup", "CheckBoxItem", "RadioGroup", "RadioItem", "SwitchGroup", "SwitchItem"], notes: ["- Define EACH FormControl as its own reference.", "- NEVER nest Form inside Form.", "- Form requires explicit buttons.", "- rules is an optional object: { required: true, email: true, min: 8, maxLength: 100 }"] },
  { name: "Buttons", components: ["Button", "Buttons"] },
  { name: "Follow-ups", components: ["FollowUpBlock", "FollowUpItem"], notes: ["- Use FollowUpBlock with FollowUpItem references at the end of a response to suggest next actions.", "- Clicking a FollowUpItem sends its text to the LLM as a user message."] },
  { name: "Layout", components: ["Tabs", "TabItem", "Accordion", "AccordionItem", "Carousel"], notes: ["- Use Tabs to present alternative views.", "- Carousel takes an array of slides.", "- Every slide in a Carousel must have the same structure."] },
  { name: "Data Display", components: ["TagBlock", "Tag"] },
  { name: "Typography", components: ["Heading", "Blockquote", "InlineCode"], notes: ['- Heading levels: "h1" | "h2" | "h3" | "h4".', "- Blockquote for styled quotes with optional cite attribution.", "- InlineCode for monospace code snippets."] },
  { name: "Calendar", components: ["CalendarBlock"], notes: ['- CalendarBlock renders a standalone calendar. mode: "single" | "multiple" | "range".', "- Use numberOfMonths to show multiple months side by side."] },
  { name: "Navigation", components: ["PaginationBlock"], notes: ["- PaginationBlock takes currentPage and totalPages."] },
  { name: "Overlays", components: ["DialogBlock", "AlertDialogBlock", "DrawerBlock"], notes: ["- DialogBlock renders a button that opens a modal dialog.", "- AlertDialogBlock renders a confirmation dialog.", "- DrawerBlock renders a bottom drawer panel."] },
];

const examples = [
  `Example 1 — Table with follow-ups:\nroot = Card([title, tbl, followUps])\ntitle = TextContent("Top Languages", "large-heavy")\ntbl = Table(cols, rows)\ncols = [Col("Language", "string"), Col("Users (M)", "number"), Col("Year", "number")]\nrows = [["Python", 15.7, 1991], ["JavaScript", 14.2, 1995], ["Java", 12.1, 1995]]\nfollowUps = FollowUpBlock([fu1, fu2])\nfu1 = FollowUpItem("Tell me more about Python")\nfu2 = FollowUpItem("Show me a JavaScript comparison")`,
  `Example 2 — Form with validation:\nroot = Card([title, form])\ntitle = TextContent("Contact Us", "large-heavy")\nform = Form("contact", btns, [nameField, emailField, msgField])\nnameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))\nemailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))\nmsgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))\nbtns = Buttons([Button("Submit", { type: "continue_conversation" }, "default")])`,
  `Example 3 — Alert variants:\nroot = Card([info, success, warning, danger])\ninfo = Alert("Update available", "A new version is available for download.", "info")\nsuccess = Alert("Payment confirmed", "Your transaction was successful.", "success")\nwarning = Alert("Disk almost full", "You have less than 10% storage remaining.", "warning")\ndanger = Alert("Account suspended", "Please contact support immediately.", "destructive")`,
  `Example 4 — Bar chart with badges:\nroot = Card([header, badges, chart, followUps])\nheader = CardHeader("Monthly Revenue", "Q4 2024 performance across regions")\nbadges = TagBlock([Tag("Live data", "default"), Tag("USD", "secondary"), Tag("Grouped", "outline")])\nchart = BarChart(["Oct", "Nov", "Dec"], [s1, s2], "grouped", "Month", "Revenue ($K)")\ns1 = Series("North America", [420, 380, 510])\ns2 = Series("Europe", [310, 290, 340])\nfollowUps = FollowUpBlock([FollowUpItem("Show as line chart"), FollowUpItem("Add Asia-Pacific")])`,
  `Example 5 — Buttons with all variants:\nroot = Card([title, btns])\ntitle = TextContent("Button Styles", "large-heavy")\nbtns = Buttons([b1, b2, b3, b4, b5, b6])\nb1 = Button("Default", { type: "continue_conversation" }, "default")\nb2 = Button("Secondary", { type: "continue_conversation" }, "secondary")\nb3 = Button("Outline", { type: "continue_conversation" }, "outline")\nb4 = Button("Ghost", { type: "continue_conversation" }, "ghost")\nb5 = Button("Link", { type: "continue_conversation" }, "link")\nb6 = Button("Destructive", { type: "continue_conversation" }, "destructive")`,
  `Example 6 — Tabs with charts:\nroot = Card([header, tabs])\nheader = CardHeader("Sales Dashboard", "Compare metrics across time periods")\ntabs = Tabs([tab1, tab2, tab3])\ntab1 = TabItem("revenue", "Revenue", [revChart])\ntab2 = TabItem("users", "Users", [usersChart])\ntab3 = TabItem("breakdown", "Breakdown", [pieChart])\nrevChart = BarChart(["Jan", "Feb", "Mar", "Apr"], [Series("Revenue", [45, 52, 61, 58])], "grouped", "Month", "USD ($K)")\nusersChart = LineChart(["Jan", "Feb", "Mar", "Apr"], [Series("Active", [1200, 1350, 1500, 1420]), Series("New", [300, 420, 380, 450])], "Month", "Users")\npieChart = PieChart([Slice("Desktop", 62), Slice("Mobile", 31), Slice("Tablet", 7)])`,
  `Example 7 — Typography showcase:\nroot = Card([h1, h2, h3, quote, codeEx, sep, text])\nh1 = Heading("Welcome to the Platform", "h1")\nh2 = Heading("Getting Started", "h2")\nh3 = Heading("Prerequisites", "h3")\nquote = Blockquote("The best way to predict the future is to invent it.", "Alan Kay")\ncodeEx = InlineCode("npm install @acme/sdk")\nsep = Separator()\ntext = TextContent("Follow the steps below to get up and running.")`,
  `Example 8 — Dialog and AlertDialog:\nroot = Card([title, btns])\ntitle = TextContent("Actions Demo", "large-heavy")\nbtns = Buttons([viewBtn, deleteBtn])\nviewBtn = DialogBlock("View Details", "Product Details", "Full specifications for Widget Pro", [detailText, detailTable], "outline")\ndetailText = TextContent("Here are the complete specifications:")\ndetailTable = Table([Col("Spec", "string"), Col("Value", "string")], [["Weight", "2.5 kg"], ["Dimensions", "30x20x10 cm"]])\ndeleteBtn = AlertDialogBlock("Delete Item", "Are you sure?", "This action cannot be undone. This will permanently delete the item.", "Delete", "Cancel", "destructive")`,
  `Example 9 — Pagination:\nroot = Card([title, table, pagination])\ntitle = TextContent("Search Results", "large-heavy")\ntable = Table([Col("Name", "string"), Col("Status", "string")], [["Item 1", "Active"], ["Item 2", "Pending"], ["Item 3", "Active"]])\npagination = PaginationBlock(2, 10)`,
  `Example 10 — Drawer with content:\nroot = Card([title, drawerBtn])\ntitle = TextContent("Report Summary", "large-heavy")\ndrawerBtn = DrawerBlock("View Full Report", "Quarterly Report Q4 2024", "Detailed breakdown of performance metrics", [chart, summary])\nchart = BarChart(["Oct", "Nov", "Dec"], [Series("Revenue", [42, 38, 51])], "grouped", "Month", "Revenue ($K)")\nsummary = TextContent("Overall revenue increased by 12% compared to Q3.")`,
  `Example 11 — Standalone calendar:\nroot = Card([title, cal])\ntitle = TextContent("Pick a Date", "large-heavy")\ncal = CalendarBlock("single", "2025-01-01", 1)`,
  `Example 12 — Range calendar with two months:\nroot = Card([title, desc, cal])\ntitle = TextContent("Select Travel Dates", "large-heavy")\ndesc = TextContent("Choose your check-in and check-out dates.", "small")\ncal = CalendarBlock("range", "2025-06-01", 2)`,
];

const additionalRules = [
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

const library = createLibrary({
  root: "Card",
  componentGroups,
  components: [
    ChatCard, CardHeader, TextContent, MarkDownRenderer, Alert, Badge, Avatar, CodeBlock,
    Image, ImageBlock, Progress, Separator,
    Table, Col,
    BarChart, LineChart, AreaChart, RadarChart, Series,
    PieChart, RadialChart, Slice,
    ScatterChart, ScatterSeries, Point,
    Form, FormControl, Label, Input, TextArea, Select, SelectItem, DatePicker, Slider,
    CheckBoxGroup, CheckBoxItem, RadioGroup, RadioItem, SwitchGroup, SwitchItem,
    Button, Buttons,
    FollowUpBlock, FollowUpItem,
    Tabs, TabItem, Accordion, AccordionItem, Carousel,
    TagBlock, Tag,
    Heading, Blockquote, InlineCode,
    PaginationBlock,
    DialogBlock, AlertDialogBlock, DrawerBlock,
    CalendarBlock,
  ],
});

const prompt = library.prompt({ examples, additionalRules });
const outPath = join(projectRoot, "src/generated/system-prompt.txt");
writeFileSync(outPath, prompt, "utf-8");
console.log(`Generated system-prompt.txt (${prompt.length} chars)`);
