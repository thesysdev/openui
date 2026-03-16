---
name: openui
description: "Build generative UI apps with OpenUI and OpenUI Lang — the token-efficient open standard for LLM-generated interfaces. Use when mentioning OpenUI, @openuidev, generative UI, streaming UI from LLMs, component libraries for AI, or replacing JSON-render/A2UI. Covers scaffolding, defineComponent, system prompts, the Renderer, and debugging OpenUI Lang output."
---

# OpenUI — The Open Standard for Generative UI

OpenUI is a full-stack Generative UI framework by Thesys. At its center is **OpenUI Lang**: a compact, line-oriented language designed for LLMs to generate user interfaces. It is up to 67% more token-efficient than JSON-based alternatives (Vercel JSON-Render, A2UI).

Instead of treating LLM output as only text/markdown, OpenUI lets you define a component library, auto-generate a system prompt from it, and render structured UI progressively as the model streams.

## When to Read Reference Files

This skill has reference files for deeper detail. Read them when needed:

- **`references/language-spec.md`** — Read when writing, debugging, or understanding OpenUI Lang syntax. Read this if the user asks about the language grammar, forward references, streaming behavior, or why output is malformed.
- **`references/api-reference.md`** — Read when writing code that uses the `@openuidev/react-lang`, `@openuidev/react-headless`, or `@openuidev/react-ui` packages. Read this for exact function signatures, types, and configuration options.

---

## Core Architecture

OpenUI has four building blocks that form a pipeline:

1. **Library** — Components defined with Zod schemas + React renderers. This is the contract between app and AI: it constrains what the LLM can generate.
2. **Prompt Generator** — Converts the library into a system prompt with syntax rules, component signatures, streaming guidelines, and optional examples/rules.
3. **Parser** — Parses OpenUI Lang line-by-line (streaming-compatible) into a typed element tree. Validates against the library's JSON Schema. Gracefully drops invalid output.
4. **Renderer** — The `<Renderer />` React component maps parsed elements to your React components, rendering progressively as the stream arrives.

The pipeline flow:

```
Component Library → System Prompt → LLM → OpenUI Lang Stream → Parser → Renderer → Live UI
```

---

## OpenUI Lang — The Language

OpenUI Lang is a compact, declarative, line-oriented DSL. The LLM generates this instead of JSON or markdown.

### Syntax Rules (Critical)

1. **One statement per line:** `identifier = Expression`
2. **Root entry point:** The first statement MUST assign to the identifier `root`.
3. **Top-down generation:** Write Layout → Components → Data for best streaming performance.
4. **Positional arguments:** Arguments map to component props by position, determined by key order in the Zod schema.
5. **Forward references (hoisting):** An identifier can be referenced before it's defined — the renderer shows a skeleton/placeholder until the definition arrives.

### Expression Types

| Type           | Syntax              | Example                       |
| -------------- | ------------------- | ----------------------------- |
| Component Call | `Type(arg1, arg2)`  | `Header("Title", "Subtitle")` |
| String         | `"text"`            | `"Hello world"`               |
| Number         | `123`, `12.5`, `-5` | `42`                          |
| Boolean        | `true` / `false`    | `true`                        |
| Null           | `null`              | `null`                        |
| Array          | `[a, b, c]`         | `["Jan", "Feb", "Mar"]`       |
| Object         | `{key: val}`        | `{variant: "info", id: 1}`    |
| Reference      | `identifier`        | `myTableData`                 |

### Positional → Named Props Resolution

The order of keys in `z.object({...})` defines argument positions:

```
// Schema
z.object({
  title: z.string(),      // Position 0
  subtitle: z.string(),   // Position 1
})

// OpenUI Lang output
h1 = Header("Dashboard", "Overview")

// Resolves to React props: { title: "Dashboard", subtitle: "Overview" }
```

Optional trailing arguments can be omitted.

### Complete Example

```
root = Root([nav, dashboard])
nav  = Navbar("Acme Corp", [link1, link2])
link1 = Link("Home", "/")
link2 = Link("Settings", "/settings")

dashboard = Section([kpi_row, main_chart])
kpi_row   = Grid([stat1, stat2])
stat1     = StatCard("Revenue", "$1.2M", "up")
stat2     = StatCard("Users", "450k", "flat")

main_chart = LineChart(
  ["Mon", "Tue", "Wed"],
  [Series("Visits", [100, 450, 320])]
)
```

---

## Scaffolding a New Project

The fastest way to start:

```bash
npx @openuidev/cli@latest create --name my-genui-app
cd my-genui-app
echo "OPENAI_API_KEY=sk-your-key-here" > .env
npm run dev
```

This generates a Next.js app with:

- `page.tsx` — FullScreen chat layout with built-in component library
- `api/chat/route.ts` — Backend route with LLM streaming
- `library.ts` — Component library entrypoint
- `generated/system-prompt.txt` — Auto-generated at build time via `openui generate`

The `dev` script auto-regenerates the system prompt before starting:

```
"generate:prompt": "openui generate src/library.ts --out src/generated/system-prompt.txt"
```

Works with any OpenAI-compatible provider (OpenAI, Anthropic via proxy, OpenRouter, Azure OpenAI).

---

## Defining Components

Components are defined with `defineComponent` and collected into a library with `createLibrary`:

```tsx
import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod";

const HotelCard = defineComponent({
  name: "HotelCard",
  description: "Displays a hotel with image, name, and amenity tag",
  props: z.object({
    name: z.string(),
    imageUrl: z.string().url(),
    amenity: z.string().optional(),
    ctaLabel: z.string(),
  }),
  component: ({ props }) => (
    <div className="hotel-card">
      <img src={props.imageUrl} alt={props.name} />
      <h3>{props.name}</h3>
      {props.amenity && <span className="tag">{props.amenity}</span>}
      <button>{props.ctaLabel}</button>
    </div>
  ),
});

const HotelList = defineComponent({
  name: "HotelList",
  description: "A scrollable list of hotel cards",
  props: z.object({
    title: z.string(),
    cards: z.array(HotelCard.ref), // Cross-reference with .ref
  }),
  component: ({ props, renderChild }) => (
    <div>
      <h2>{props.title}</h2>
      {props.cards.map((card, i) => renderChild(card, i))}
    </div>
  ),
});

export const library = createLibrary({
  root: "HotelList",
  components: [HotelList, HotelCard],
});
```

### Key Patterns

- **`.ref` for child references:** Use `ChildComponent.ref` in parent Zod schemas to allow nesting.
- **`description` field:** Helps the LLM understand when/how to use the component. Keep descriptions short and precise.
- **Positional argument order:** The KEY ORDER in `z.object({...})` determines argument positions in OpenUI Lang. Put required args first, optional args last.
- **Component groups:** Use `componentGroups` in `createLibrary` to organize related components with notes for the LLM.

### Extending Built-in Libraries

OpenUI ships two ready-to-use libraries:

- **`openuiLibrary`** — General-purpose (root: `Stack`). Includes layouts, charts, forms, tables.
- **`openuiChatLibrary`** — Chat-optimized (root: `Card`). Adds `FollowUpBlock`, `ListBlock`, `SectionBlock`.

To extend:

```tsx
import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

const myLibrary = createLibrary({
  root: openuiLibrary.root ?? "Stack",
  componentGroups: openuiLibrary.componentGroups,
  components: [...Object.values(openuiLibrary.components), MyCustomComponent],
});
```

---

## System Prompts

The library auto-generates the system prompt:

```tsx
const systemPrompt = library.prompt({
  preamble: "You are a travel assistant.",
  additionalRules: ["Always include a follow-up question."],
  examples: [
    `root = Stack([card])\ncard = HotelCard("Ritz", "https://...", "Luxury", "Book")`,
  ],
});
```

CLI generation (runs automatically in scaffolded apps):

```bash
openui generate src/library.ts --out src/generated/system-prompt.txt
```

---

## Rendering

```tsx
import { Renderer } from "@openuidev/react-lang";

<Renderer
  response={streamedText}
  library={library}
  isStreaming={isStreaming}
  onAction={(event) => {
    // Handle button clicks, form submissions, navigation
    console.log(event.type, event.params);
  }}
/>;
```

The Renderer handles: progressive rendering during streaming, skeleton placeholders for unresolved forward references, validation and graceful degradation of invalid output, form state management and validation.

---

## SDK Packages

| Package                     | Purpose                                                                 | When to use               |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `@openuidev/react-lang`     | Core runtime: defineComponent, createLibrary, Renderer, parser          | Every OpenUI project      |
| `@openuidev/react-headless` | Chat state: ChatProvider, hooks, streaming adapters (OpenAI, AG-UI)     | Custom chat UI            |
| `@openuidev/react-ui`       | Prebuilt layouts (Copilot, FullScreen, BottomTray) + built-in libraries | Fast path to working chat |

---

## Component Design Best Practices for LLM Generation

Since LLMs are the ones writing OpenUI Lang, component design choices directly affect generation quality:

1. **Keep schemas flat.** Deeply nested object props burn tokens and increase error rates. Prefer multiple simple components over one deeply nested one.
2. **Order Zod keys deliberately.** Required props first, optional props last. The most important/distinctive prop should be position 0 — the LLM sees it first during generation.
3. **Use descriptive component names.** The LLM picks components by name. `PricingTable` is better than `Table3`. The `description` field reinforces this.
4. **Limit library size.** Every component adds to the system prompt. Include only components the LLM actually needs for the use case. Fewer components = less confusion = better output.
5. **Use `.ref` for composition, not deep nesting.** `z.array(ChildComponent.ref)` is the idiomatic way to compose. The LLM generates each child as a separate line, which streams and validates independently.
6. **Provide examples in `PromptOptions`.** One or two concrete examples dramatically improve output quality, especially for complex or unusual component shapes.
7. **Use `componentGroups` with notes.** Group related components and add notes like "Use BarChart for comparisons, LineChart for trends" to guide the LLM's choices.

---

## Debugging Malformed Output

When LLM output doesn't render correctly:

1. **Check the raw OpenUI Lang.** Log the streamed text before parsing. Common issues: missing `root` assignment, typos in component names, wrong argument count.
2. **Use `onParseResult` on Renderer.** Inspect `meta.validationErrors` and `meta.unresolved` for specific failures.
3. **Verify Zod schema order.** If props are in the wrong position, the LLM's positional args map incorrectly. The schema key order IS the contract.
4. **Check `library.toJSONSchema()`** to see exactly what the parser expects.
5. **Invalid output is dropped, not fatal.** OpenUI Lang is designed to be robust — the parser drops invalid portions and renders everything else. If parts of the UI are missing, the dropped lines are the culprit.

---

## Framework Integration

OpenUI works with any LLM framework. The scaffolded app uses the Vercel AI SDK by default, but integration patterns exist for: Vercel AI SDK, LangChain, CrewAI, OpenAI Agents SDK, Anthropic Agents SDK, Google ADK, and any framework that produces a text stream.

The core integration point is always the same: send the system prompt (from `library.prompt()`) to your LLM, then feed the streamed text into `<Renderer />`.
