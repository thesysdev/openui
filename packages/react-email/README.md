# @openuidev/react-email

React Email components for [OpenUI](https://openui.com) — API reference for the pre-built email templates library and prompt options, ready for LLM-driven email generation.

[![npm](https://img.shields.io/npm/v/@openuidev/react-email)](https://www.npmjs.com/package/@openuidev/react-email)
[![npm downloads](https://img.shields.io/npm/dm/@openuidev/react-email)](https://www.npmjs.com/package/@openuidev/react-email)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/thesysdev/openui/blob/main/LICENSE)

## Install

```bash
npm install @openuidev/react-email @openuidev/react-lang
# or
pnpm add @openuidev/react-email @openuidev/react-lang
```

**Peer dependencies:** `react >=19.0.0`, `react-dom >=19.0.0`, `@openuidev/react-lang`

## Quick Start

### 1. Generate a system prompt

```ts
import { emailLibrary, emailPromptOptions } from "@openuidev/react-email";

const systemPrompt = emailLibrary.prompt(emailPromptOptions);
```

### 2. Render the email output

```tsx
import { Renderer } from "@openuidev/react-lang";
import { emailLibrary } from "@openuidev/react-email";

function EmailPreview({ response, isStreaming }) {
  return <Renderer response={response} library={emailLibrary} isStreaming={isStreaming} />;
}
```

### 3. Get the HTML

Install [`@react-email/render`](https://www.npmjs.com/package/@react-email/render) to convert the output to an email-safe HTML string:

```bash
npm install @react-email/render
```

```tsx
import { Renderer } from "@openuidev/react-lang";
import { emailLibrary } from "@openuidev/react-email";
import { render } from "@react-email/render";

const html = await render(
  <Renderer response={llmResponse} library={emailLibrary} isStreaming={false} />,
  { pretty: true },
);
```

## Exports

| Export               | Description                                                    |
| :------------------- | :------------------------------------------------------------- |
| `emailLibrary`       | Pre-configured `Library` instance with all 44 email components |
| `emailPromptOptions` | Prompt options with examples and rules for email generation    |

## Documentation

Full documentation, guides, and the language specification are available at **[openui.com](https://openui.com)**.

## License

[MIT](https://github.com/thesysdev/openui/blob/main/LICENSE)
