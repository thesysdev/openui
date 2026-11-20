export interface Example {
  id: string;
  label: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "valid",
    label: "Valid: basic stack",
    code: `root = Card([title, body])

title = TextContent("Quarterly Overview")
body = TextContent("Revenue up 12% QoQ; headcount at 128.")
`,
  },
  {
    id: "invalid",
    label: "Validation errors",
    code: `root = Stack([heading, Table(5, []), missingRef])

heading = TextContent("Broken example")
stray = TextContent("nobody references me")
`,
  },
  {
    id: "partial",
    label: "Truncated / incomplete",
    code: `root = Stack([title, body, chart])

title = TextContent("Live streaming demo")
body = TextContent("This program is truncated mid-statement to show partial parsing.")
chart = BarChart(["Q1", "Q2", "Q3"], [series`,
  },
  {
    id: "missing-required",
    label: "Missing required props",
    code: `root = Stack([title, code, chart, pic])

title = TextContent()
code = CodeBlock("typescript")
chart = BarChart(["Q1", "Q2", "Q3"])
pic = Image()
`,
  },
  {
    id: "kitchen-sink",
    label: "Kitchen sink (form + table + chart)",
    code: `root = Stack([title, note, form, tbl, chart])

title = TextContent("debug playground", "large-heavy")
note = Callout("info", "Demo", "A form with validation, a table and a chart — rendered fully client-side.")
form = Form("contact", btns, [nameField, emailField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary")])
tbl = Table([Col("Language", langs), Col("Users (M)", users)])
langs = ["Python", "JavaScript", "Go"]
users = [15.7, 14.2, 5.2]
chart = BarChart(["Q1", "Q2", "Q3"], [Series("Revenue", [120, 150, 180])], "grouped")
`,
  },
  {
    id: "mock-tools",
    label: "Query() with mock tools",
    code: `root = Stack([title, note, tickets])

title = TextContent("Ticket dashboard", "large-heavy")
note = TextContent("The Query() below hits the playground's mock tool provider: any tool name resolves with sample data.")
data = Query("list_tickets", {}, {items: []})
tickets = Table([Col("Ticket", data.items.label), Col("Priority", data.items.value)])
`,
  },
];

export const DEFAULT_EXAMPLE = EXAMPLES[0];
