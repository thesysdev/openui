# OpenUI SDK — API Reference

Exact function signatures, types, and configuration for the three OpenUI packages.

---

## Table of Contents

1. [@openuidev/react-lang — Core Runtime](#react-lang)
2. [@openuidev/react-headless — Chat State](#react-headless)
3. [@openuidev/react-ui — Prebuilt Layouts and Libraries](#react-ui)
4. [CLI](#cli)

---

## @openuidev/react-lang — Core Runtime {#react-lang}

The foundation package. Required for any OpenUI integration.

### Import

```typescript
import {
  defineComponent,
  createLibrary,
  Renderer,
  BuiltinActionType,
  createParser,
  createStreamingParser,
} from "@openuidev/react-lang";
```

### defineComponent(config)

Defines a single component with name, Zod schema, description, and React renderer.

```typescript
function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T>;

interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
  /** Use in parent schemas: z.array(ChildComponent.ref) */
  ref: z.ZodType<SubComponentOf<z.infer<T>>>;
}
```

**Key points:**
- `name` must be unique across the library
- `description` is included in the auto-generated system prompt — keep it short and useful for the LLM
- `props` key order in z.object defines positional argument mapping
- `.ref` is used in parent component schemas for composition

### createLibrary(input)

Creates a Library from defined components.

```typescript
function createLibrary(input: LibraryDefinition): Library;

interface LibraryDefinition {
  components: DefinedComponent[];
  componentGroups?: ComponentGroup[];
  root?: string;  // Name of the root component
}

interface ComponentGroup {
  name: string;
  components: string[];   // Component names in this group
  notes?: string[];        // LLM guidance for this group
}

interface Library {
  readonly components: Record<string, DefinedComponent>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  toJSONSchema(): object;
}

interface PromptOptions {
  preamble?: string;         // Added before component definitions
  additionalRules?: string[]; // Extra rules for the LLM
  examples?: string[];        // Concrete OpenUI Lang examples
}
```

**Key points:**
- `root` sets the expected root component name. The LLM's first line should be `root = RootComponent(...)`.
- `componentGroups` organize components and add notes — e.g., "Use BarChart for comparisons, LineChart for trends."
- `library.prompt()` generates the full system prompt text.
- `library.toJSONSchema()` returns the JSON Schema used by the parser for validation.

### \<Renderer />

Parses OpenUI Lang and renders with your library.

```typescript
interface RendererProps {
  response: string | null;        // The raw streamed text
  library: Library;               // Your component library
  isStreaming?: boolean;           // True while stream is in progress
  onAction?: (event: ActionEvent) => void;  // Handle user interactions
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
  onParseResult?: (result: ParseResult | null) => void;  // Debugging hook
}
```

**`onAction` handler:** Called when the user clicks a button, submits a form, or triggers any action.

```typescript
interface ActionEvent {
  type: string;                    // e.g., "submit", "open_url", "continue_conversation"
  params: Record<string, any>;
  humanFriendlyMessage: string;    // User-facing description of the action
  formState?: Record<string, any>; // Form field values (on submit)
  formName?: string;
}

enum BuiltinActionType {
  ContinueConversation = "continue_conversation",
  OpenUrl = "open_url",
}
```

**`onParseResult` hook:** For debugging. Inspect validation errors and unresolved references.

```typescript
interface ParseResult {
  root: ElementNode | null;
  meta: {
    incomplete: boolean;
    unresolved: string[];          // Identifiers referenced but not yet defined
    statementCount: number;
    validationErrors: ValidationError[];
  };
}

interface ValidationError {
  component: string;
  path: string;
  message: string;
}
```

### Parser APIs

For advanced use outside the Renderer (e.g., server-side parsing, testing):

```typescript
function createParser(schema: LibraryJSONSchema): Parser;
function createStreamingParser(schema: LibraryJSONSchema): StreamParser;

interface Parser {
  parse(input: string): ParseResult;
}

interface StreamParser {
  push(chunk: string): ParseResult;  // Feed chunks as they arrive
  getResult(): ParseResult;           // Get current state
}
```

### Context Hooks (inside renderer components)

Available inside component renderers:

```typescript
// Render a child element node
function useRenderNode(): (value: unknown) => React.ReactNode;

// Trigger an action (button click, navigation, etc.)
function useTriggerAction(): (
  userMessage: string,
  formName?: string,
  action?: { type?: string; params?: Record<string, any> },
) => void;

// Check if the stream is still in progress
function useIsStreaming(): boolean;

// Form field value management
function useGetFieldValue(): (formName: string | undefined, name: string) => any;
function useSetFieldValue(): (
  formName: string | undefined,
  componentType: string | undefined,
  name: string,
  value: any,
  shouldTriggerSaveCallback?: boolean,
) => void;

function useFormName(): string | undefined;
function useSetDefaultValue(options: {
  formName?: string;
  componentType: string;
  name: string;
  existingValue: any;
  defaultValue: any;
  shouldTriggerSaveCallback?: boolean;
}): void;
```

### Form Validation

```typescript
interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

function useFormValidation(): FormValidationContextValue | null;
function useCreateFormValidation(): FormValidationContextValue;
function validate(
  value: unknown,
  rules: ParsedRule[],
  customValidators?: Record<string, ValidatorFn>,
): string | undefined;
function parseRules(rules: unknown): ParsedRule[];
function parseStructuredRules(rules: unknown): ParsedRule[];
const builtInValidators: Record<string, ValidatorFn>;
```

---

## @openuidev/react-headless — Chat State {#react-headless}

Headless chat state management. Use when building custom chat UIs.

Provides:
- **ChatProvider** — Context provider for chat state
- **useThread / useThreadList** — Hooks for message and thread management
- **Stream protocol adapters** — OpenAI adapter (`openAIAdapter()`), AG-UI adapter
- **Message format converters** — Convert between internal and external message formats

Use this when you want full control over the chat UI layout and behavior.

---

## @openuidev/react-ui — Prebuilt Layouts and Libraries {#react-ui}

Prebuilt chat layouts and two built-in component libraries. Fastest path to working chat.

### Chat Layouts

```typescript
import { Copilot, FullScreen, BottomTray } from "@openuidev/react-ui";
```

- **FullScreen** — Full-page chat interface
- **Copilot** — Side panel / assistant overlay
- **BottomTray** — Bottom-docked chat widget

### Built-in Libraries

```typescript
// General-purpose (root: Stack)
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui/genui-lib";

// Chat-optimized (root: Card)
import { openuiChatLibrary, openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib";
```

**General-purpose (`openuiLibrary`):**
- Root component: `Stack`
- Includes full component suite: layouts, content blocks, charts, forms, tables
- Use for standalone rendering, playgrounds, non-chat interfaces

**Chat-optimized (`openuiChatLibrary`):**
- Root component: `Card` (vertical container, no layout params)
- Adds chat-specific: `FollowUpBlock`, `ListBlock`, `SectionBlock`
- Does NOT include `Stack` — responses are always single-card, vertically stacked
- Use for conversational AI interfaces

Both expose `.prompt()` for system prompt generation.

---

## CLI {#cli}

### Generate system prompt from library

```bash
openui generate <library-file> --out <output-path>
```

Example:
```bash
openui generate src/library.ts --out src/generated/system-prompt.txt
```

Reads the library file, resolves all components, and writes the full system prompt to the output path. Typically wired into the `dev` and `build` scripts.

### Scaffold new project

```bash
npx @openuidev/cli@latest create --name <app-name>
```

Generates a Next.js app with OpenUI wired up end-to-end.
