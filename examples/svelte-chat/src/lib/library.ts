import { defineComponent, createLibrary, type PromptOptions } from "@openuidev/svelte-lang";
import { z } from "zod";
import Card from "./components/library/Card.svelte";
import Table from "./components/library/Table.svelte";
import Input from "./components/library/Input.svelte";
import Button from "./components/library/Button.svelte";
import Form from "./components/library/Form.svelte";
import Chart from "./components/library/Chart.svelte";
import Stack from "./components/library/Stack.svelte";
import TextContent from "./components/library/TextContent.svelte";
import CodeBlock from "./components/library/CodeBlock.svelte";
import Callout from "./components/library/Callout.svelte";
import Separator from "./components/library/Separator.svelte";
import Tabs from "./components/library/Tabs.svelte";
import Accordion from "./components/library/Accordion.svelte";
import Steps from "./components/library/Steps.svelte";

// ─── Shared Schemas ──────────────────────────────────────────────────────────

const FlexPropsSchema = z.object({
	direction: z.enum(["row", "column"]).optional(),
	gap: z.enum(["none", "xs", "s", "m", "l", "xl"]).optional(),
	align: z
		.enum(["start", "center", "end", "stretch", "baseline"])
		.optional(),
	justify: z
		.enum(["start", "center", "end", "between", "around", "evenly"])
		.optional(),
	wrap: z.boolean().optional(),
});

// ─── Component Definitions ───────────────────────────────────────────────────

// Layout

// children FIRST so Stack([...]) works positionally (matching react-ui's .merge() order)
const StackComponent = defineComponent({
	name: "Stack",
	props: z
		.object({
			children: z.array(z.any()),
		})
		.merge(FlexPropsSchema),
	description:
		'Flex container. direction: "row"|"column" (default "column"). gap: "none"|"xs"|"s"|"m"|"l"|"xl" (default "m"). align: "start"|"center"|"end"|"stretch"|"baseline". justify: "start"|"center"|"end"|"between"|"around"|"evenly".',
	component: Stack,
});

const CardComponent = defineComponent({
	name: "Card",
	props: z.object({
		children: z
			.array(z.any())
			.describe("Card content — text, nested components, or a mix"),
	}),
	description:
		"Vertical container for content. Children stack top to bottom automatically.",
	component: Card,
});

const SeparatorComponent = defineComponent({
	name: "Separator",
	props: z.object({
		orientation: z
			.enum(["horizontal", "vertical"])
			.optional()
			.describe("Separator orientation (default horizontal)"),
	}),
	description: "A visual separator between content sections.",
	component: Separator,
});

// Content

const TextContentComponent = defineComponent({
	name: "TextContent",
	props: z.object({
		text: z.string().describe("Text content"),
		size: z
			.enum(["small", "default", "large", "small-heavy", "large-heavy"])
			.optional()
			.describe("Text size and weight"),
	}),
	description:
		"Text block. Use size variants for headings: large-heavy for titles, default for body text.",
	component: TextContent,
});

const CodeBlockComponent = defineComponent({
	name: "CodeBlock",
	props: z.object({
		language: z.string().describe("Programming language for syntax highlighting"),
		codeString: z.string().describe("The code to display"),
	}),
	description: "Displays a code snippet with language label.",
	component: CodeBlock,
});

const CalloutComponent = defineComponent({
	name: "Callout",
	props: z.object({
		variant: z
			.enum(["info", "warning", "error", "success", "neutral"])
			.describe("Callout style variant"),
		title: z.string().describe("Callout heading"),
		description: z.string().describe("Callout body text"),
	}),
	description: "Highlighted callout box for notices, tips, warnings, or errors.",
	component: Callout,
});

// Interactive Layout

const TabItemComponent = defineComponent({
	name: "TabItem",
	props: z.object({
		value: z.string().describe("Unique tab identifier"),
		trigger: z.string().describe("Tab label text"),
		content: z.array(z.any()).describe("Tab panel content"),
	}),
	description: "A single tab with a label and content panel.",
	component: {} as any, // rendered by Tabs parent
});

const TabsComponent = defineComponent({
	name: "Tabs",
	props: z.object({
		items: z.array(TabItemComponent.ref).describe("Tab items"),
	}),
	description: "Tabbed interface — use TabItem for each tab.",
	component: Tabs,
});

const AccordionItemComponent = defineComponent({
	name: "AccordionItem",
	props: z.object({
		value: z.string().describe("Unique accordion item identifier"),
		trigger: z.string().describe("Accordion item header text"),
		content: z.array(z.any()).describe("Accordion item content"),
	}),
	description: "A single collapsible accordion section.",
	component: {} as any, // rendered by Accordion parent
});

const AccordionComponent = defineComponent({
	name: "Accordion",
	props: z.object({
		items: z
			.array(AccordionItemComponent.ref)
			.describe("Accordion items"),
	}),
	description: "Collapsible accordion — use AccordionItem for each section.",
	component: Accordion,
});

const StepsItemComponent = defineComponent({
	name: "StepsItem",
	props: z.object({
		title: z.string().describe("Step title"),
		details: z.string().describe("Step description"),
	}),
	description: "A single step in a Steps list.",
	component: {} as any, // rendered by Steps parent
});

const StepsComponent = defineComponent({
	name: "Steps",
	props: z.object({
		items: z.array(StepsItemComponent.ref).describe("Step items"),
	}),
	description: "Numbered step-by-step guide.",
	component: Steps,
});

// Data Display

const TableComponent = defineComponent({
	name: "Table",
	props: z.object({
		headers: z.array(z.string()).describe("Table column headers"),
		rows: z
			.array(z.array(z.string()))
			.describe("Table rows, each row is an array of cell values"),
	}),
	description: "A data table with headers and rows",
	component: Table,
});

const ChartComponent = defineComponent({
	name: "Chart",
	props: z.object({
		type: z
			.enum(["bar", "line", "pie"])
			.describe("Chart type (bar, line, or pie)"),
		title: z.string().describe("Chart title"),
		data: z
			.array(
				z.object({
					label: z.string().describe("Data point label"),
					value: z.number().describe("Data point value"),
				}),
			)
			.describe("Chart data points"),
	}),
	description: "A chart for visualizing data",
	component: Chart,
});

// Forms

const InputComponent = defineComponent({
	name: "Input",
	props: z.object({
		name: z.string().describe("Input field name"),
		label: z.string().optional().describe("Input field label"),
		placeholder: z.string().optional().describe("Input placeholder text"),
		defaultValue: z.string().optional().describe("Default input value"),
	}),
	description: "A text input field for forms",
	component: Input,
});

const ButtonComponent = defineComponent({
	name: "Button",
	props: z.object({
		label: z.string().describe("Button text"),
		action: z
			.object({
				type: z.string().describe("Action type"),
				params: z
					.record(z.string(), z.unknown())
					.optional()
					.describe("Action parameters"),
			})
			.optional()
			.describe("Action to trigger when clicked"),
	}),
	description: "A clickable button that can trigger actions",
	component: Button,
});

const FormComponent = defineComponent({
	name: "Form",
	props: z.object({
		name: z.string().describe("Form name for state isolation"),
		fields: z.array(InputComponent.ref).describe("Form input fields"),
		submitButton: ButtonComponent.ref.describe("Form submit button"),
	}),
	description: "A form container with input fields and a submit button",
	component: Form,
});

// ─── Library ──────────────────────────────────────────────────────────────────

export const library = createLibrary({
	components: [
		// Layout
		StackComponent,
		CardComponent,
		SeparatorComponent,
		// Content
		TextContentComponent,
		CodeBlockComponent,
		CalloutComponent,
		// Interactive Layout
		TabsComponent,
		TabItemComponent,
		AccordionComponent,
		AccordionItemComponent,
		StepsComponent,
		StepsItemComponent,
		// Data Display
		TableComponent,
		ChartComponent,
		// Forms
		InputComponent,
		ButtonComponent,
		FormComponent,
	],
	componentGroups: [
		{
			name: "Layout",
			components: ["Stack", "Card", "Separator", "Tabs", "TabItem", "Accordion", "AccordionItem", "Steps", "StepsItem"],
			notes: [
				'Use Stack with direction "row" for side-by-side layouts',
				"Use Card as a container for content sections",
				"Nest Cards inside Stack for dashboard-style layouts",
				"Use Tabs for tabbed interfaces, Accordion for collapsible sections",
				"Use Steps for numbered step-by-step guides",
			],
		},
		{
			name: "Content",
			components: ["TextContent", "CodeBlock", "Callout"],
			notes: [
				'Use TextContent with size "large-heavy" for headings',
				"Use CodeBlock for code snippets with syntax highlighting",
				"Use Callout for notices, tips, warnings, or error messages",
			],
		},
		{
			name: "Data Display",
			components: ["Table", "Chart"],
			notes: [
				"Use Table for tabular data",
				"Use Chart for data visualization (bar, line, pie)",
			],
		},
		{
			name: "Forms",
			components: ["Form", "Input", "Button"],
			notes: [
				"Use Form to group inputs with state isolation",
				"Input fields automatically sync with form state",
				"Button can trigger actions with form data",
			],
		},
	],
	root: "Stack",
});

// ─── Prompt Options ──────────────────────────────────────────────────────────

export const promptExamples: string[] = [
	`Example 1 — Table:
root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table(cols, rows)
cols = ["Language", "Users (M)", "Year"]
rows = [["Python", "15.7", "1991"], ["JavaScript", "14.2", "1995"], ["Go", "5.2", "2009"]]`,

	`Example 2 — Side-by-side cards with chart:
root = Stack([title, row])
title = TextContent("Q4 Revenue", "large-heavy")
row = Stack([card1, card2], "row")
card1 = Card([chart])
chart = Chart("bar", "Monthly", [{label: "Oct", value: 120}, {label: "Nov", value: 150}, {label: "Dec", value: 180}])
card2 = Card([TextContent("Revenue grew 15% in Q4."), Callout("success", "Target Met", "Exceeded goal by $20k.")])`,

	`Example 3 — Form:
root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", [nameField, emailField], submitBtn)
nameField = Input("name", "Name", "Your name")
emailField = Input("email", "Email", "you@example.com")
submitBtn = Button("Submit", {type: "continue_conversation"})`,

	`Example 4 — Tabs with mixed content:
root = Stack([title, tabs])
title = TextContent("React vs Vue", "large-heavy")
tabs = Tabs([tabReact, tabVue])
tabReact = TabItem("react", "React", reactContent)
tabVue = TabItem("vue", "Vue", vueContent)
reactContent = [TextContent("React is a library by Meta for building UIs."), Callout("info", "Note", "React uses JSX syntax.")]
vueContent = [TextContent("Vue is a progressive framework by Evan You."), Callout("success", "Tip", "Vue has a gentle learning curve.")]`,
];

export const promptAdditionalRules: string[] = [
	'For grid-like layouts, use Stack with direction "row".',
	"For forms, define one Input reference per field so controls can stream progressively.",
	"Never nest Form inside Form.",
	"Use TextContent for all text — use size variants for headings.",
];

export const promptOptions: PromptOptions = {
	examples: promptExamples,
	additionalRules: promptAdditionalRules,
};
