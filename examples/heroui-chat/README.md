# HeroUI Form Generator Example

A full-stack **generative form builder** that demonstrates wiring [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) to a custom component library built on [HeroUI](https://www.heroui.com/) ([`@heroui/react`](https://www.npmjs.com/package/@heroui/react)).

Describe a form in plain language, get a live preview built from HeroUI components. Refine it with follow-up instructions — each iteration streams a fresh updated form.

[View source on GitHub →](https://github.com/thesysdev/openui/tree/main/examples/heroui-chat)

---

## How It Works

The LLM is prompted with a form-focused system prompt that describes every available form component — name, props, and when to use it. Instead of returning prose, the model responds in **OpenUI Lang**: a declarative markup syntax that maps directly to React components. For example:

```
root = Card([title, form])
title = TextContent("Contact Us", "h2")
form = Form("contact", btns, [fc1, fc2, fc3])
fc1 = FormControl("Name", input1)
fc2 = FormControl("Email", input2)
fc3 = FormControl("Message", ta1)
input1 = Input("name", "Your name", "text", { required: true })
input2 = Input("email", "you@example.com", "email", { required: true })
ta1 = TextArea("message", "How can we help?", 4)
btns = Buttons([b1])
b1 = Button("Submit", { type: "continue_conversation" }, "primary")
```

On the client, `<Renderer>` from `@openuidev/react-lang` parses the incoming SSE stream and renders each OpenUI Lang node using `herouiChatLibrary` — the custom library defined in `src/lib/heroui-genui/`. The app shell is built entirely with `@heroui/react` (no `@openuidev/react-ui` dependency).

---

## Architecture

```
┌──────────────────────────────────────────┐        ┌────────────────────────────────────┐
│   Browser                                │  HTTP  │   Next.js API Route                │
│                                          │ ──────►│                                    │
│  • Left panel: HeroUI TextArea + Button  │        │  • Loads system-prompt.txt         │
│  • Iteration history (in-memory messages)│        │  • Calls LLM via OpenAI SDK        │
│  • processStreamedMessage + openAIAdapter│◄────── │  • Streams response as SSE events  │
│  • Right panel: <Renderer> preview       │  SSE   │                                    │
│  • formFieldSnapshot via onStateUpdate   │        │                                    │
└──────────────────────────────────────────┘        └────────────────────────────────────┘
```

### Request / Response Flow

1. User types a form description and clicks **Generate Form** (or ⌘ Enter).
2. The page builds an `openAIMessageFormat.toApi(messages)` payload and `POST`s to `/api/chat`.
3. The API route reads `system-prompt.txt` and streams the LLM response as SSE events.
4. On the client, `processStreamedMessage` + `openAIAdapter()` accumulate the streamed text into an `AssistantMessage`.
5. `<Renderer response={code} library={herouiChatLibrary} isStreaming={...} />` parses the OpenUI Lang markup and progressively renders each node as a HeroUI-backed component.
6. The streamed assistant `content` (OpenUI Lang text only) is appended to the in-memory message list for the next iteration.

### Iterative Refinement

Submit a follow-up instruction (e.g. "add a phone number field" or "rename the submit button to 'Send'") and the page:

- Optionally prefixes the new user message with a JSON snapshot of current form values from `onStateUpdate`.
- POSTs the **full** message list so the model can see the previous form spec and return one complete updated `Card`/`Form`.
- `<Renderer initialState={formFieldSnapshot}>` hydrates the preview with the latest field values, so filled data is not lost on re-render.

Click **Reset** to clear history and start a fresh form.

---

## Project Structure

```
heroui-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts      # Streaming endpoint (OpenAI SDK + SSE, no tools)
│   │   ├── page.tsx               # Two-column form generator UI
│   │   ├── layout.tsx             # Root layout (no external provider needed)
│   │   └── globals.css            # Tailwind + HeroUI styles
│   ├── lib/
│   │   └── heroui-genui/          # Custom OpenUI component library
│   │       ├── index.tsx          # Library + herouiFormPromptOptions export
│   │       ├── action.ts          # Button action Zod schemas
│   │       ├── rules.ts           # Form validation rule schemas
│   │       ├── unions.ts          # Zod union types for component children
│   │       └── components/        # One file per component
│   ├── generated/
│   │   └── system-prompt.txt      # Auto-generated — do not edit manually
│   └── library.ts                 # CLI entry — re-exports library + promptOptions
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- An OpenAI API key

### 1. Install dependencies

```bash
cd examples/heroui-chat
pnpm install
```

### 2. Configure environment

Create a `.env.local` file in the `examples/heroui-chat/` directory:

```
OPENAI_API_KEY=sk-...
```

### 3. Start the dev server

```bash
pnpm dev
```

This runs `generate:prompt` first (builds the OpenUI CLI, compiles `src/library.ts` → `src/generated/system-prompt.txt`) then starts the Next.js dev server at `http://localhost:3000`.

---

## What's in This Example

### System Prompt Generation

Component definitions and form-focused prompt options live in `src/lib/heroui-genui/index.tsx` (`createLibrary()`, `herouiFormPromptOptions`). The file `src/library.ts` re-exports them as `library` and `promptOptions` for the OpenUI CLI.

When you run `pnpm dev` or `pnpm generate:prompt`, the CLI generates `src/generated/system-prompt.txt` — a file listing every form component's name, prop schema, description, and examples. This is the LLM's system prompt.

`herouiFormPromptOptions` includes:
- **Two form examples** (contact form, registration with select + checkbox)
- **Rules** that instruct the model to: always wrap in `Card`, always include `Buttons` with a primary submit, define each `FormControl` as its own reference for streaming, treat follow-up instructions as refinements of the current form

Re-run generation any time you change component definitions:

```bash
pnpm generate:prompt
```

### `src/app/api/chat/route.ts` — Backend

Accepts `POST /api/chat` with a `messages` array, prepends the system prompt, and streams the LLM response as **Server-Sent Events (SSE)** compatible with `openAIAdapter()`.

Tools are intentionally omitted — the model focuses purely on generating OpenUI Lang form definitions.

### `src/app/page.tsx` — Frontend

Two-column layout built entirely with `@heroui/react`:

| Panel | Contents |
| ----- | -------- |
| **Left** | `TextArea` for instructions, `Button` to generate/refine, example `Chip`s, instruction history |
| **Right** | `<Renderer>` inside a `Card` — live OpenUI Lang preview, scrollable, updates on each iteration |

Key client-side state:

| State | Purpose |
| ----- | ------- |
| `messages` | In-memory OpenAI-shaped message list sent on every request |
| `latestCode` | Last assistant's OpenUI Lang text; passed as `Renderer` `response` |
| `streamingCode` | Accumulates tokens live; passed during streaming |
| `formFieldSnapshot` | Current form field values from `Renderer` `onStateUpdate`; used for `initialState` and optionally prepended to next user message |

### `src/lib/heroui-genui/` — Custom Component Library

Each component is defined with `defineComponent()` from `@openuidev/react-lang`:

- `name` — the OpenUI Lang node name the LLM will emit
- `props` — a Zod schema that validates and types the node's props as they stream in
- `description` — included in the system prompt
- `component` — the React render function; `renderNode()` recursively renders child nodes

#### Form Components

| Component | HeroUI Backing | Purpose |
| --------- | -------------- | ------- |
| `Form` | div | Container with validation context |
| `FormControl` | `Label`, `Description` | Labeled field wrapper |
| `Input` | `Input` | Text, email, password, etc. |
| `TextArea` | `TextArea` | Multi-line text |
| `Select` / `SelectItem` | `Select`, `ListBox` | Dropdown |
| `NumberField` | `NumberField` | Numeric input with stepper |
| `Slider` | `Slider` | Range input |
| `CheckBoxGroup` / `CheckBoxItem` | `CheckboxGroup`, `Checkbox` | Multi-select |
| `RadioGroup` / `RadioItem` | `RadioGroup`, `Radio` | Single-select |
| `Button` / `Buttons` | `Button`, `ButtonGroup` | Submit and action buttons |

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `pnpm dev` | Build OpenUI CLI, generate system prompt, start Next.js dev server |
| `pnpm generate:prompt` | Build `@openuidev/cli` and regenerate `system-prompt.txt` |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |

---

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — Library, Prompt Generator, Parser, Renderer
- [Defining Components](https://www.openui.com/docs/openui-lang/defining-components) — `defineComponent` and `createLibrary` API
- [HeroUI](https://www.heroui.com/) — the underlying React component library
- [`@openuidev/react-lang` package](../../packages/react-lang)
- [`@openuidev/react-headless` package](../../packages/react-headless)
