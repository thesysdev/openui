# @openuidev/react-ui

React components and a ready-made chat surface for OpenUI. Use the `AgentInterface` chat surface, the built-in model-renderable component library, or the individual UI primitives in your own layout.

[![npm version](https://img.shields.io/npm/v/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![monthly downloads](https://img.shields.io/npm/dm/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

**Links:** [Package docs](https://openui.com/docs/api-reference/react-ui) | [Chat docs](https://openui.com/docs/chat) | [GitHub repo](https://github.com/thesysdev/openui)

## Install

```bash
npm install @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
# or
pnpm add @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `zustand ^4.5.5`, `@openuidev/react-lang`, `@openuidev/react-headless`

Don't forget to import the component styles:

```ts
import "@openuidev/react-ui/styles/index.css";
```

## Overview

This package provides three layers:

1. **A ready-made chat surface** — `AgentInterface`, a complete chat experience with thread history, streaming, and a model-renderable message area.
2. **Model-renderable components** for charts, tables, forms, cards, and other OpenUI Lang output.
3. **Standalone UI primitives** such as `Button`, `Card`, `Table`, and `Charts`.

## Quick Start

The fastest way to get a working chat app is `AgentInterface`. Give it an `llm` transport that talks to your backend. Storage is optional — without it, threads live in memory and are wiped on reload:

```tsx
import { AgentInterface, fetchLLM, openAIAdapter, openAIMessageFormat } from "@openuidev/react-ui";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import "@openuidev/react-ui/styles/index.css";

// POSTs { threadId, runId, messages, tools, context } to /api/chat and parses
// the streamed response — here an OpenAI Chat Completions stream.
const llm = fetchLLM({
  url: "/api/chat",
  streamAdapter: openAIAdapter(),
  messageFormat: openAIMessageFormat,
});

function App() {
  return (
    <AgentInterface
      llm={llm}
      componentLibrary={openuiChatLibrary}
      agentName="My Assistant"
      theme={{ mode: "light" }}
    />
  );
}
```

### The chat surface

`AgentInterface` is the single chat surface. It adapts its layout responsively and accepts:

| Prop               | Description                                                                                                                                                                           |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `storage`          | Optional persistence adapter for thread history; defaults to in-memory (wiped on reload). Use `restStorage({ baseUrl })` from `@openuidev/react-ui` to back it with your own REST API |
| `llm`              | Chat transport, usually built with `fetchLLM`; any `ChatLLM` (`{ send({ threadId, messages, signal }), streamProtocol }`) works                                                       |
| `componentLibrary` | OpenUI Lang library used to render assistant messages (e.g. `openuiChatLibrary`)                                                                                                      |
| `theme`            | Theme configuration, e.g. `{ mode: "light" }`                                                                                                                                         |
| `agentName`        | Name displayed in the header                                                                                                                                                          |
| `starters`         | Conversation-starter prompts shown on the welcome screen                                                                                                                              |

See the [chat docs](https://openui.com/docs/chat) for full configuration.

## Built-in Component Libraries

The package ships with three preconfigured OpenUI Lang libraries:

| Export              | Description                                                               |
| :------------------ | :------------------------------------------------------------------------ |
| `openuiLibrary`     | Full component library for charts, tables, forms, cards, images, and more |
| `openuiChatLibrary` | Chat-optimized subset with follow-ups, steps, and callouts                |
| `dashboardLibrary`  | Dashboard layouts, KPI cards, interactive filters, charts, and tables     |

Use them directly when building custom chat experiences:

```tsx
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";

function AssistantMessage({ content, isStreaming }) {
  return <Renderer response={content} library={openuiLibrary} isStreaming={isStreaming} />;
}
```

Generate a system prompt from the library:

```ts
import { openuiLibrary, openuiPromptOptions } from "@openuidev/react-ui";

const systemPrompt = openuiLibrary.prompt(openuiPromptOptions);
```

### Dashboards

Import the dashboard library and its generation instructions from React UI:

```tsx
"use client";

import { Renderer, type RendererProps } from "@openuidev/react-lang";
import { dashboardLibrary } from "@openuidev/react-ui/genui-lib";
import "@openuidev/react-ui/styles/index.css";

type DashboardPreviewProps = Pick<RendererProps, "response" | "isStreaming">;

export function DashboardPreview({ response, isStreaming }: DashboardPreviewProps) {
  return <Renderer response={response} library={dashboardLibrary} isStreaming={isStreaming} />;
}
```

`Dashboard` automatically applies its own typography and inherits the surrounding
`ThemeProvider`'s light or dark mode. The normal React UI stylesheet includes all
dashboard styles. There is no dependency on `@openuidev/thesys` or its chart package.
Charts measure browser layout, so SSR applications should load the preview on the
client (for example, with `next/dynamic` and `ssr: false` in a Next.js client module).

For self-hosted generation, use the library's prompt options:

```ts
import { dashboardLibrary, dashboardPromptOptions } from "@openuidev/react-ui";

const systemPrompt = dashboardLibrary.prompt(dashboardPromptOptions);
```

`dashboardComponents` can be spread into a custom `createLibrary` call. Individual
definitions such as `DashboardComponent`, `SmallCardComponent`, `TrendComponent`,
and `FilterOptionComponent` are exported from
`@openuidev/react-ui/genui-lib/dashboard`. That entry also exports
`DashboardThemeProvider`, `defaultDashboardLightTheme`, and
`defaultDashboardDarkTheme`. `dashboardExamples`, `dashboardAdditionalRules`, and
`dashboardComponentGroups` are available separately when customizing a prompt.

## Theming

Wrap your app in `ThemeProvider` to customize colors, typography, spacing, and effects:

```tsx
import { ThemeProvider, createTheme } from "@openuidev/react-ui";

const customTheme = createTheme({
  primary: "#6366f1",
  background: "#fafafa",
  foreground: "#1a1a1a",
});

function App() {
  return (
    <ThemeProvider mode="light" lightTheme={customTheme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

| Export                   | Description                                 |
| :----------------------- | :------------------------------------------ |
| `ThemeProvider`          | Context provider for theming                |
| `createTheme(overrides)` | Create a theme with validation and defaults |
| `defaultLightTheme`      | Built-in light theme                        |
| `defaultDarkTheme`       | Built-in dark theme                         |
| `swatchTokens`           | Token palette for use in theme builders     |

## Styling integration

OpenUI ships its component styles in two variants:

| Import                                                  | Cascade behavior                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `@openuidev/react-ui/styles/index.css` (default)        | Unlayered — override via normal CSS specificity, as in 0.11.x and earlier |
| `@openuidev/react-ui/layered/styles/index.css` (opt-in) | Wrapped in `@layer openui` — any unlayered consumer CSS wins              |

`@openuidev/react-ui/components.css` and `@openuidev/react-ui/index.css` are aliases of `styles/index.css`: all three contain the same stylesheet, so import only one of them.

Need a single component's CSS? Import it per component: `./styles/<Component>.css` (unlayered) or `./layered/styles/<Component>.css` (layered).

With the layered variant, plain CSS overrides OpenUI without `!important` or specificity matching:

```css
@import "@openuidev/react-ui/layered/styles/index.css";

/* Wins, no specificity tricks needed */
.openui-button-base-primary {
  background: hotpink;
}
```

### With Tailwind v4 (layered variant)

Declare layer order at the top of your entry stylesheet so `openui` sits above Tailwind's reset but below `components` and `utilities`:

```css
@layer theme, base, openui, components, utilities;
@import "tailwindcss";
@import "@openuidev/react-ui/layered/styles/index.css";
```

This places Tailwind's Preflight (in `base`) below OpenUI components so its element resets don't override them, while keeping utilities (`bg-red-500`, etc.) winning over OpenUI styles.

### Rules for the layered variant

- Import OpenUI CSS from **exactly one place** — multiple import sites under chunk-splitting bundlers (e.g. Turbopack) can register `openui` before your layer-order statement and lock the wrong order.
- Wrap app-wide resets in a layer below `openui` (e.g. `@layer base { * { margin: 0; } }`) — unlayered resets beat all layered styles regardless of specificity.
- `./defaults.css` and the `ThemeProvider` runtime style injection stay unlayered in both modes so runtime theming always overrides component defaults.

### Browser support

The layered variant requires CSS cascade layers: Chrome 99+, Firefox 97+, Safari 15.4+, Edge 99+ (all baseline from March 2022). On older browsers the `@layer { ... }` block is dropped entirely and components render unstyled. The default unlayered styles have no such floor.

## Components

All components are available as individual imports:

| Category         | Components                                                                                                                                                             |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**       | `Card`, `CardHeader`, `SectionBlock`, `Tabs`, `Accordion`, `Carousel`, `Separator`, `Steps`                                                                            |
| **Data Display** | `Table`, `Charts` (bar, line, area, pie, radar, scatter), `ListBlock`, `ListItem`, `Tag`, `TagBlock`, `CodeBlock`, `Image`, `ImageBlock`, `ImageGallery`               |
| **Forms**        | `Input`, `TextArea`, `Select`, `CheckBoxGroup`, `CheckBoxItem`, `RadioGroup`, `RadioItem`, `SwitchGroup`, `SwitchItem`, `Slider`, `DatePicker`, `FormControl`, `Label` |
| **Actions**      | `Button`, `Buttons`, `IconButton`, `FollowUpBlock`, `FollowUpItem`                                                                                                     |
| **Feedback**     | `Callout`, `TextCallout`                                                                                                                                               |
| **Content**      | `TextContent`, `MarkDownRenderer`                                                                                                                                      |
| **Chat**         | `AgentInterface`, `ToolCall`, `ToolResult`                                                                                                                             |

### Per-component imports

For smaller bundles, import components individually:

```ts
import { Button } from "@openuidev/react-ui/Button";
import { Card } from "@openuidev/react-ui/Card";
import { Charts } from "@openuidev/react-ui/Charts";
```

## Subpath Exports

| Import path                                    | Description                                          |
| :--------------------------------------------- | :--------------------------------------------------- |
| `@openuidev/react-ui`                          | All components and libraries                         |
| `@openuidev/react-ui/styles/index.css`         | Full compiled stylesheet, unlayered (default import) |
| `@openuidev/react-ui/components.css`           | Alias of `styles/index.css`                          |
| `@openuidev/react-ui/index.css`                | Alias of `styles/index.css`                          |
| `@openuidev/react-ui/layered/styles/index.css` | Full stylesheet wrapped in `@layer openui` (opt-in)  |
| `@openuidev/react-ui/defaults.css`             | Theme tokens, always unlayered                       |
| `@openuidev/react-ui/genui-lib`                | OpenUI Lang libraries and prompt options             |
| `@openuidev/react-ui/styles/*`                 | Per-component compiled styles (unlayered)            |
| `@openuidev/react-ui/layered/styles/*`         | Per-component styles wrapped in `@layer openui`      |
| `@openuidev/react-ui/scssUtils`                | SCSS utility functions                               |
| `@openuidev/react-ui/<Component>`              | Per-component entry points                           |

## Documentation

- [React UI API reference](https://openui.com/docs/api-reference/react-ui)
- [Chat guides](https://openui.com/docs/chat)
- [Source on GitHub](https://github.com/thesysdev/openui/tree/main/packages/react-ui)

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
