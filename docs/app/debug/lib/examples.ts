export interface Example {
  id: string;
  label: string;
  code: string;
}

export const EXAMPLES: Example[] = [
  {
    id: "valid",
    label: "Valid: basic column",
    code: `root = Col([title, body])

title = Title("Quarterly Overview")
body = Text("Revenue up 12% QoQ; headcount at 128.")
`,
  },
  {
    id: "invalid",
    label: "Validation errors",
    code: `root = Col([heading, Table(5, []), missingRef])

heading = Title("Broken example")
stray = Text("nobody references me")
`,
  },
  {
    id: "partial",
    label: "Truncated / incomplete",
    code: `root = Col([title, body, chart])

title = Title("Live streaming demo")
body = Text("This program is truncated mid-statement to show partial parsing.")
chart = Chart("bar", [{quarter: "Q1", revenue: 120}, {quarter: "Q2", revenue:`,
  },
  {
    id: "missing-required",
    label: "Missing required props",
    code: `root = Col([title, code, chart, pic])

title = Title()
code = Code()
chart = Chart("bar")
pic = Image()
`,
  },
  {
    id: "kitchen-sink",
    label: "Kitchen sink (form + table + chart)",
    code: `root = Col([title, note, form, tbl, chart])

$name = ""
$email = ""
title = Title("Debug playground", "lg")
note = Card([Text("A form with validation, a table and a chart — rendered fully client-side.")], "soft")
form = Form([nameField, emailField, Button("Submit", @ToAssistant("Submit my contact details"))])
nameField = Input($name, "Name", "text", "Your name", {required: true, minLength: 2})
emailField = Input($email, "Email", "text", "you@example.com", {required: true, email: true})
tbl = Table(["Language", "Users (M)"], [["Python", 15.7], ["JavaScript", 14.2], ["Go", 5.2]])
chart = Chart("bar", [{quarter: "Q1", revenue: 120}, {quarter: "Q2", revenue: 150}, {quarter: "Q3", revenue: 180}], "quarter", ["revenue"])
`,
  },
  {
    id: "mock-tools",
    label: "Query() with mock tools",
    code: `root = Col([title, note, tickets])

title = Title("Ticket dashboard", "lg")
note = Text("The Query() below hits the playground's mock tool provider: any tool name resolves with sample data.")
data = Query("list_tickets", {}, {items: []})
tickets = Table(["Ticket", "Priority"], @Each(data.items, "item", [item.label, item.value]))
`,
  },
];

export const DEFAULT_EXAMPLE = EXAMPLES[0];
