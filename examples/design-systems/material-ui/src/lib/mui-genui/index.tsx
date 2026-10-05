"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import type { ComponentGroup, PromptOptions } from "@openuidev/react-lang";
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

// Content
import { Alert } from "./components/alert";
import { CardHeader } from "./components/card-header";
import { Heading } from "./components/heading";
import { List, ListItemDef } from "./components/list";
import { Progress } from "./components/progress";
import { Separator } from "./components/divider";
import { TextContent } from "./components/text-content";

// Tables
import { Col, Table } from "./components/table";

// Charts
import {
  BarChartComponent,
  LineChartComponent,
  PieChartComponent,
  Series,
  Slice,
} from "./components/charts";

// Forms
import { Form } from "./components/form";
import { FormControl } from "./components/form-control";
import { Input } from "./components/input";
import { Select, SelectItem } from "./components/select";
import { SwitchGroup, SwitchItem } from "./components/switch-group";

// Buttons
import { Button } from "./components/button";
import { Buttons } from "./components/buttons";

// Layout
import { Accordion, AccordionItemDef } from "./components/accordion";
import { TabItem, Tabs } from "./components/tabs";

// Chat-specific
import { FollowUpBlock, FollowUpItem } from "./components/follow-up-block";

import { ChatContentChildUnion } from "./unions";

const ChatCardChildUnion = z.union([...ChatContentChildUnion.options, Tabs.ref, Accordion.ref]);

const ChatCard = defineComponent({
  name: "Card",
  props: z.object({
    children: z.array(ChatCardChildUnion),
  }),
  description:
    "Vertical container for all content in a chat response. Children stack top to bottom automatically.",
  component: ({ props, renderNode }) => (
    <Card sx={{ overflow: "hidden" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {renderNode(props.children)}
      </CardContent>
    </Card>
  ),
});

// ── Component Groups ──

export const muiComponentGroups: ComponentGroup[] = [
  {
    name: "Content",
    components: ["CardHeader", "TextContent", "Heading", "Alert", "List", "ListItem", "Separator", "Progress"],
    notes: [
      "- Use CardHeader for the main section title. Use Heading for sub-section titles.",
      '- TextContent size: "small" | "default" | "large" | "small-heavy" | "large-heavy".',
      "- List takes ListItem[] — each ListItem has primary text and optional secondary text.",
    ],
  },
  {
    name: "Tables",
    components: ["Table", "Col"],
  },
  {
    name: "Charts",
    components: ["BarChart", "LineChart", "PieChart", "Series", "Slice"],
    notes: [
      "- BarChart/LineChart take labels (string[]) and series (Series[]). Each Series has a category name and a values array aligned to labels.",
      "- PieChart takes slices (Slice[]). Set donut: true for a ring chart.",
    ],
  },
  {
    name: "Forms",
    components: ["Form", "FormControl", "Input", "Select", "SelectItem", "SwitchGroup", "SwitchItem"],
    notes: [
      "- Define EACH FormControl as its own reference — do NOT inline all controls in one array.",
      "- NEVER nest Form inside Form.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the second Form argument.",
      "- rules is an optional object: { required: true, email: true, minLength: 8, maxLength: 100 }.",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI.",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Layout",
    components: ["Tabs", "TabItem", "Accordion", "AccordionItem"],
    notes: [
      "- Use Tabs to present alternative views — each TabItem has a value id, trigger label, and content array.",
      '- Accordion type: "single" | "multiple". items: AccordionItem[].',
    ],
  },
  {
    name: "Follow-ups",
    components: ["FollowUpBlock", "FollowUpItem"],
    notes: [
      "- Use FollowUpBlock with FollowUpItem references at the END of a response to suggest next actions.",
      "- Clicking a FollowUpItem sends its text to the LLM as a user message.",
    ],
  },
];

// ── Examples ──

export const muiExamples: string[] = [
  `Example 1 — Table with follow-ups:
root = Card([title, tbl, followUps])
title = CardHeader("Top Languages", "By number of active developers")
tbl = Table(cols, rows)
cols = [Col("Language", "string"), Col("Users (M)", "number"), Col("Year", "number")]
rows = [["Python", 15.7, 1991], ["JavaScript", 14.2, 1995], ["Java", 12.1, 1995]]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`,

  `Example 2 — Form with validation:
root = Card([title, form])
title = CardHeader("Contact Us")
form = Form("contact", btns, [nameField, emailField, planField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
planField = FormControl("Plan", Select("plan", [opt1, opt2], "Choose a plan", { required: true }))
opt1 = SelectItem("free", "Free")
opt2 = SelectItem("pro", "Pro")
btns = Buttons([Button("Submit", { type: "continue_conversation" }, "default")])`,

  `Example 3 — Alert variants and a list:
root = Card([info, warning, items])
info = Alert("Update available", "A new version is ready to install.", "info")
warning = Alert("Disk almost full", "Less than 10% storage remaining.", "warning")
items = List([i1, i2, i3])
i1 = ListItem("Back up your data", "Recommended before updating")
i2 = ListItem("Free up space")
i3 = ListItem("Install the update")`,

  `Example 4 — Charts inside Tabs:
root = Card([header, tabs, followUps])
header = CardHeader("Sales Dashboard", "Compare metrics across periods")
tabs = Tabs([tab1, tab2, tab3])
tab1 = TabItem("revenue", "Revenue", [revChart])
tab2 = TabItem("users", "Users", [usersChart])
tab3 = TabItem("breakdown", "Breakdown", [pieChart])
revChart = BarChart(["Jan", "Feb", "Mar", "Apr"], [Series("Revenue", [45, 52, 61, 58])], "grouped", "Month", "USD (K)")
usersChart = LineChart(["Jan", "Feb", "Mar", "Apr"], [Series("Active", [1200, 1350, 1500, 1420]), Series("New", [300, 420, 380, 450])], "Month", "Users")
pieChart = PieChart([Slice("Desktop", 62), Slice("Mobile", 31), Slice("Tablet", 7)], true)
followUps = FollowUpBlock([FollowUpItem("Add Q2 data"), FollowUpItem("Export as table")])`,

  `Example 5 — Accordion with progress:
root = Card([header, acc])
header = CardHeader("Project Status", "Sprint 14")
acc = Accordion([a1, a2, a3], "single")
a1 = AccordionItem("done", "Done", [doneText, doneProgress])
doneText = TextContent("All planned API work is complete.")
doneProgress = Progress(100, "API")
a2 = AccordionItem("progress", "In progress", [Progress(60, "Dashboard UI")])
a3 = AccordionItem("blocked", "Blocked", [Alert("Waiting on design", "Final mockups pending review.", "warning")])`,

  `Example 6 — Buttons with variants:
root = Card([title, btns])
title = CardHeader("Choose an action")
btns = Buttons([b1, b2, b3])
b1 = Button("Confirm", { type: "continue_conversation" }, "default")
b2 = Button("Learn more", { type: "open_url", url: "https://mui.com" }, "outline")
b3 = Button("Delete", { type: "continue_conversation" }, "destructive")`,
];

export const muiAdditionalRules: string[] = [
  "Every response is a single Card(children) — children stack vertically automatically.",
  "Card is the only top-level layout container. Use Tabs to switch between sections, Accordion for collapsible sections.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions.",
  "Never nest Form inside Form.",
  'Button variant mapping — "default" (filled primary), "secondary" (filled secondary), "outline" (bordered), "ghost" (transparent text), "link" (underlined text), "destructive" (red). Pick the variant that fits the action.',
  'Button size mapping — "default" (standard), "xs"/"sm" (small), "lg" (large), "icon" (square).',
  'Alert variants — "default"/"info" (blue), "success" (green), "warning" (amber), "destructive" (red error). Always pick the variant that matches the message tone.',
  "Use CardHeader for the main section title and Heading for sub-section titles.",
  "Use Table for tabular data and List for simple itemized content.",
  "Use Progress for completion indicators (value is a 0-100 percentage).",
  "Use BarChart/LineChart for trends and comparisons, PieChart (donut: true for a ring) for proportions. Series values must align with the labels array.",
  "When the user asks for a specific component, generate a realistic, fully-populated example of it with sample data.",
];

export const muiPromptOptions: PromptOptions = {
  examples: muiExamples,
  additionalRules: muiAdditionalRules,
};

// ── Library ──

export const muiChatLibrary = createLibrary({
  root: "Card",
  componentGroups: muiComponentGroups,
  components: [
    // Root
    ChatCard,
    CardHeader,
    // Content
    TextContent,
    Heading,
    Alert,
    List,
    ListItemDef,
    Separator,
    Progress,
    // Tables
    Table,
    Col,
    // Charts
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    Series,
    Slice,
    // Forms
    Form,
    FormControl,
    Input,
    Select,
    SelectItem,
    SwitchGroup,
    SwitchItem,
    // Buttons
    Button,
    Buttons,
    // Layout
    Tabs,
    TabItem,
    Accordion,
    AccordionItemDef,
    // Follow-ups
    FollowUpBlock,
    FollowUpItem,
  ],
});
