# @openuidev/react-ui

React UI components, chat layouts, and component libraries for [OpenUI](https://openui.com). Drop-in chat surfaces with theming, or use individual components in your own layout.

[![npm](https://img.shields.io/npm/v/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-ui)](https://www.npmjs.com/package/@openuidev/react-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
# or
pnpm add @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `zustand ^4.5.5`, `@openuidev/react-lang`, `@openuidev/react-headless`

Don't forget to import the component styles:

```ts
import "@openuidev/react-ui/components.css";
```

## Overview

This package provides three layers:

1. **Chat layouts** — Ready-to-use chat surfaces (`FullScreen`, `Copilot`, `BottomTray`) that wire up the provider, streaming, and rendering automatically.
2. **Component library** — A built-in set of UI components (charts, tables, forms, cards, etc.) that models can generate via OpenUI Lang.
3. **Individual components** — Use `Button`, `Card`, `Table`, `Charts`, and 30+ components directly in your own UI.

## Quick Start

The fastest way to get a working chat app:

```tsx
import { FullScreen } from "@openuidev/react-ui";
import "@openuidev/react-ui/components.css";

function App() {
  return <FullScreen apiUrl="/api/chat" threadApiUrl="/api/threads" />;
}
```

### Chat Layouts

| Component    | Description                          |
| :----------- | :----------------------------------- |
| `FullScreen` | Full-page chat with a thread sidebar |
| `Copilot`    | Side-panel copilot overlay           |
| `BottomTray` | Collapsible bottom tray chat         |

All chat layouts accept `apiUrl`, `threadApiUrl`, and theming props. See the [chat docs](https://openui.com/docs/chat) for full configuration.

### Copilot example

```tsx
import { Copilot } from "@openuidev/react-ui";

function App() {
  return (
    <div>
      <main>Your app content</main>
      <Copilot apiUrl="/api/chat" threadApiUrl="/api/threads" />
    </div>
  );
}
```

## Built-in Component Libraries

The package ships with two preconfigured OpenUI Lang libraries:

| Export              | Description                                                             |
| :------------------ | :---------------------------------------------------------------------- |
| `openuiLibrary`     | Full component library — charts, tables, forms, cards, images, and more |
| `openuiChatLibrary` | Chat-optimized subset with follow-ups, steps, and callouts              |

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

## Components

All components are available as individual imports:

| Category         | Components                                                                                                                                                             |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout**       | `Card`, `CardHeader`, `SectionBlock`, `Tabs`, `Accordion`, `Carousel`, `Separator`, `Steps`                                                                            |
| **Data Display** | `Table`, `Charts` (bar, line, area, pie, radar, scatter), `ListBlock`, `ListItem`, `Tag`, `TagBlock`, `CodeBlock`, `Image`, `ImageBlock`, `ImageGallery`               |
| **Forms**        | `Input`, `TextArea`, `Select`, `CheckBoxGroup`, `CheckBoxItem`, `RadioGroup`, `RadioItem`, `SwitchGroup`, `SwitchItem`, `Slider`, `DatePicker`, `FormControl`, `Label` |
| **Actions**      | `Button`, `Buttons`, `IconButton`, `FollowUpBlock`, `FollowUpItem`                                                                                                     |
| **Feedback**     | `Callout`, `TextCallout`, `MessageLoading`                                                                                                                             |
| **Content**      | `TextContent`, `MarkDownRenderer`                                                                                                                                      |
| **Chat**         | `FullScreen`, `Copilot`, `BottomTray`, `Shell.*`, `CopilotShell.*`, `ToolCall`, `ToolResult`                                                                           |

### Per-component imports

For smaller bundles, import components individually:

```ts
import { Button } from "@openuidev/react-ui/Button";
import { Card } from "@openuidev/react-ui/Card";
import { Charts } from "@openuidev/react-ui/Charts";
```

## Subpath Exports

| Import path                          | Description                              |
| :----------------------------------- | :--------------------------------------- |
| `@openuidev/react-ui`                | All components and libraries             |
| `@openuidev/react-ui/components.css` | Compiled component styles                |
| `@openuidev/react-ui/genui-lib`      | OpenUI Lang libraries and prompt options |
| `@openuidev/react-ui/tailwind`       | Tailwind CSS plugin                      |
| `@openuidev/react-ui/styles/*`       | SCSS utilities                           |
| `@openuidev/react-ui/scssUtils`      | SCSS utility functions                   |
| `@openuidev/react-ui/<Component>`    | Per-component entry points               |

## Documentation

Full documentation, component guides, and live examples are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
