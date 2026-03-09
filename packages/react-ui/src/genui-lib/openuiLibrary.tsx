"use client";

import type { ComponentGroup, PromptOptions } from "@openuidev/lang-react";
import { createLibrary } from "@openuidev/lang-react";

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
import { Col, Table } from "./Table";
import { Tag } from "./Tag";
import { TagBlock } from "./TagBlock";

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
    ],
    notes: [
      '- For grid-like layouts, use Stack with direction "row" and wrap set to true.',
      '- Prefer justify "start" (or omit justify) with wrap=true for stable columns instead of uneven gutters.',
      "- Use nested Stacks when you need explicit rows/sections.",
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
      "- For Form fields, define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.",
      "- NEVER nest Form inside Form — each Form should be a standalone container.",
      "- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.",
      '- rules is an optional array of validation strings: ["required", "email", "min:8", "maxLength:100"]',
      "- Available rules: required, email, min:N, max:N, minLength:N, maxLength:N, pattern:REGEX, url, numeric",
      "- The renderer shows error messages automatically — do NOT generate error text in the UI",
    ],
  },
  {
    name: "Buttons",
    components: ["Button", "Buttons"],
  },
  {
    name: "Data Display",
    components: ["TagBlock", "Tag"],
  },
];

// ── Examples ──

export const openuiExamples: string[] = [
  `Example 1 — Table:
root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table(cols, rows)
cols = [Col("Language", "string"), Col("Users (M)", "number"), Col("Year", "number")]
rows = [["Python", 15.7, 1991], ["JavaScript", 14.2, 1995], ["Java", 12.1, 1995], ["TypeScript", 8.5, 2012], ["Go", 5.2, 2009]]`,

  `Example 2 — Bar chart:
root = Stack([title, chart])
title = TextContent("Q4 Revenue", "large-heavy")
chart = BarChart(labels, [s1, s2], "grouped")
labels = ["Oct", "Nov", "Dec"]
s1 = Series("Product A", [120, 150, 180])
s2 = Series("Product B", [90, 110, 140])`,

  `Example 3 — Form with validation:
root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, countryField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
countryField = FormControl("Country", Select("country", countryOpts, "Select...", { required: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
countryOpts = [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")]
btns = Buttons([Button("Submit", { type: "continue_conversation" }, "primary"), Button("Cancel", { type: "continue_conversation" }, "secondary")])`,

  `Example 4 — Tabs with mixed content:
root = Stack([title, tabs])
title = TextContent("React vs Vue", "large-heavy")
tabs = Tabs([tabReact, tabVue])
tabReact = TabItem("react", "React", reactContent)
tabVue = TabItem("vue", "Vue", vueContent)
reactContent = [TextContent("React is a library by Meta for building UIs."), Callout("info", "Note", "React uses JSX syntax.")]
vueContent = [TextContent("Vue is a progressive framework by Evan You."), Callout("success", "Tip", "Vue has a gentle learning curve.")]`,
];

export const openuiAdditionalRules: string[] = [
  'For grid-like layouts, use Stack with direction "row" and wrap=true. Avoid justify="between" unless you specifically want large gutters.',
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
];

export const openuiPromptOptions: PromptOptions = {
  examples: openuiExamples,
  additionalRules: openuiAdditionalRules,
};

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
  ],
});
