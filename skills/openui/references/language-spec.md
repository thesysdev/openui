# OpenUI Lang — Language Specification Reference

Full grammar, resolution rules, and parser semantics for OpenUI Lang.

---

## Table of Contents

1. [Syntax Overview](#syntax-overview)
2. [Core Rules](#core-rules)
3. [Expressions and Types](#expressions-and-types)
4. [Component Resolution — Positional to Named Props](#component-resolution)
5. [Optional Arguments](#optional-arguments)
6. [Streaming and Hoisting (Forward References)](#streaming-and-hoisting)
7. [Complete Syntax Examples](#complete-syntax-examples)
8. [Common LLM Generation Errors](#common-llm-generation-errors)

---

## Syntax Overview

OpenUI Lang consists of a series of **assignment statements**. Every line binds a unique identifier to an expression:

```
root = Root([header, chart])           // 1. Entry Point
header = Header("Q4 Revenue", "YTD")   // 2. Component Call
chart = BarChart(labels, [s1, s2])     // 3. Forward Reference
labels = ["Jan", "Feb", "Mar"]         // 4. Data Definition
s1 = Series("Product A", [10, 20, 30])
s2 = Series("Product B", [5, 15, 25])
```

---

## Core Rules

1. **One statement per line:** `identifier = Expression`
2. **Root entry point:** The first statement MUST assign to the identifier `root` (or call the Root component). If missing, nothing renders.
3. **Top-down generation:** Write in order: Layout → Components → Data. This maximizes perceived performance during streaming because the layout skeleton appears first.
4. **Positional arguments:** Arguments map to component props by position, defined by the order of keys in the Zod schema.
5. **Unique identifiers:** Each identifier can only be assigned once. Duplicate identifiers cause the second assignment to be dropped.

---

## Expressions and Types

OpenUI Lang supports a strict subset of JavaScript values:

### Component Call
```
Type(arg1, arg2, ...)
```
Maps `Type` to a registered component name. Arguments are positional.
- Example: `Header("Title", "Subtitle")`
- Example with child refs: `Grid([card1, card2])`

### String
```
"text with escaped \"quotes\""
```
Double-quoted only. Supports standard escape sequences.

### Number
```
123
12.5
-5
```
Integers and decimals. Negative numbers supported.

### Boolean
```
true
false
```

### Null
```
null
```

### Array
```
[element1, element2, element3]
```
Can contain any expression type including component calls and references.

### Object
```
{key: value, anotherKey: "string"}
```
Keys are unquoted identifiers. Values can be any expression.

### Reference
```
identifier
```
References another assignment by its identifier. Can be forward (hoisted) or backward.

---

## Component Resolution

The parser maps positional arguments in OpenUI Lang to named props in React using Zod schema key order.

### The Mapping Logic

Given a Zod schema:
```typescript
const HeaderSchema = z.object({
  title: z.string(),       // Position 0
  subtitle: z.string(),    // Position 1
  level: z.number(),       // Position 2
});
```

The OpenUI Lang:
```
h1 = Header("Dashboard", "Overview", 2)
```

Resolves to React props:
```json
{
  "title": "Dashboard",
  "subtitle": "Overview",
  "level": 2
}
```

### Critical implications for component design

- **Key order in z.object is the API contract.** Changing key order breaks all existing LLM outputs.
- **Required props must come before optional props** in the schema, since trailing optional args can be omitted.
- **The LLM learns positions from the auto-generated system prompt.** If the prompt and schema disagree (e.g., after a schema change without regenerating the prompt), output will be garbled.

---

## Optional Arguments

Optional arguments (trailing in the schema) can be omitted:

```typescript
z.object({
  title: z.string(),            // Position 0 — required
  subtitle: z.string().optional(), // Position 1 — optional
  icon: z.string().optional(),     // Position 2 — optional
})
```

All valid:
```
h1 = Header("Dashboard")                     // subtitle=undefined, icon=undefined
h2 = Header("Dashboard", "Overview")          // icon=undefined
h3 = Header("Dashboard", "Overview", "star")  // all provided
```

You cannot skip a middle argument. If you need position 2, you must provide position 1.

---

## Streaming and Hoisting

OpenUI Lang allows **forward references** (hoisting). An identifier can be used as an argument BEFORE it is defined in the stream. This is the key mechanism for progressive rendering.

### How It Works

```
root = Root([table])  // "table" referenced here...
// ... (network latency, more tokens arriving) ...
table = Table(rows)   // ...defined here
// ... (more latency) ...
rows = [row1, row2]   // data arrives last
```

**Step 1:** Parser sees `root`. `table` is unresolved → Renderer shows a skeleton placeholder.
**Step 2:** `table` definition arrives → Renderer replaces skeleton with `Table` component. `rows` is still unresolved → Table shows loading state.
**Step 3:** `rows` arrives → Table fills in with data.

### Why Top-Down Order Matters

The LLM should generate layout-first, data-last:
```
// GOOD — layout renders immediately, data fills in
root = Dashboard([sidebar, chart])
sidebar = Sidebar([nav1, nav2])
chart = BarChart(labels, series)
labels = ["Q1", "Q2", "Q3"]
series = [Series("Revenue", [100, 200, 300])]

// BAD — nothing renders until root appears at the end
labels = ["Q1", "Q2", "Q3"]
series = [Series("Revenue", [100, 200, 300])]
chart = BarChart(labels, series)
sidebar = Sidebar([nav1, nav2])
root = Dashboard([sidebar, chart])
```

---

## Complete Syntax Examples

### Simple Card Layout
```
root = Stack([card])
card = Card([title, body, actions])
title = CardHeader("Welcome", "Get started with our platform")
body = TextContent("Sign up to access all features.")
actions = Buttons([btn1, btn2], "row")
btn1 = Button("Sign up", "submit:signup", "primary")
btn2 = Button("Learn more", "action:learn_more", "secondary")
```

### Dashboard with Charts
```
root = Stack([header, kpis, charts])
header = TextContent("Q4 Performance", "large-heavy")
kpis = Grid([stat1, stat2, stat3])
stat1 = StatCard("Revenue", "$1.2M", "up")
stat2 = StatCard("Users", "450k", "flat")
stat3 = StatCard("Churn", "2.3%", "down")
charts = Grid([bar, line])
bar = BarChart(["Jan", "Feb", "Mar"], [s1])
s1 = Series("Sales", [100, 150, 200])
line = LineChart(["Mon", "Tue", "Wed"], [s2])
s2 = Series("Visits", [500, 800, 650])
```

### Form with Validation
```
root = Stack([formCard])
formCard = Card([formTitle, contactForm])
formTitle = CardHeader("Contact Us")
contactForm = Form("contact", [nameField, emailField, msgField], submitBtn)
nameField = FormControl("Name", Input("name", "Your name", "text", ["required", "minLength:2"]))
emailField = FormControl("Email", Input("email", "you@example.com", "email", ["required", "email"]))
msgField = FormControl("Message", Input("message", "Your message", "textarea", ["required"]))
submitBtn = Buttons([sendBtn], "row")
sendBtn = Button("Send", "submit:contact", "primary")
```

---

## Common LLM Generation Errors

### Missing root assignment
```
// WRONG — no root
header = Header("Title")
body = TextContent("Content")

// RIGHT
root = Stack([header, body])
header = Header("Title")
body = TextContent("Content")
```

### Wrong argument count
```
// Schema: z.object({ title: z.string(), subtitle: z.string() })
// WRONG — 3 args for 2-prop schema
h1 = Header("Title", "Sub", "extra")

// RIGHT
h1 = Header("Title", "Sub")
```

### Hallucinated component names
```
// WRONG — "Paragraph" not in library
text = Paragraph("Hello world")

// RIGHT — use registered component name
text = TextContent("Hello world")
```

### Incorrect nesting (inline vs reference)
```
// Both are valid — inline children or reference
root = Stack([Header("Title"), TextContent("Body")])
// OR
root = Stack([h, t])
h = Header("Title")
t = TextContent("Body")
```

### Duplicate identifiers
```
// WRONG — "card" used twice, second is dropped
card = Card([title1])
card = Card([title2])

// RIGHT — unique identifiers
card1 = Card([title1])
card2 = Card([title2])
```
