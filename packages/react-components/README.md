# @openuidev/react-components

A React component library for OpenUI: components, charts and themes, styled with Goober. It sits
beside `@openuidev/react-ui`, which is unchanged. Version `0.0.1`.

## Install

```sh
pnpm add @openuidev/react-components react react-dom zod zustand
```

Peer dependencies: React 19, `zod` 3.25 or 4, and `zustand` 4.5.

## Usage

```tsx
import { Button, Input, ThemeProvider } from "@openuidev/react-components";

export function ContactForm() {
  return (
    <ThemeProvider>
      <Input aria-label="Name" />
      <Button variant="primary">Send</Button>
    </ThemeProvider>
  );
}
```

Every component, supporting part and type comes from the package root; there are no subpath
exports.

## Styling

Component rules go into one `<style id="openui-styles">` tag in the browser. The root also
exports `css` and `keyframes` for your own rules.

```ts
import { configureStyles } from "@openuidev/react-components";

// Optional: put every component rule in a cascade layer. Call once, before rendering.
configureStyles({ layer: "openui" });
```

Styles are written in the browser; server-rendered HTML does not include them yet. Under a CSP
nonce, set `window.__nonce__` before the component library loads.

## Site map

```text
packages/react-components/
├── src/
│   ├── index.ts           # the public entry: every component, part and type
│   ├── components/        # inputs and controls, layout, text and Markdown, images and citations,
│   │                      # tables and lists, cards, loading, charts
│   ├── components/ThemeProvider/   # light and dark themes, token variables
│   └── styles/            # the component sheet, style tags and token defaults
└── README.md              # install, usage, styling and a site map
```

## Stable selectors

Each component exposes stable `openui-*` classes and data attributes for overrides:

```css
.openui-callout--variant-warning {
  border-left: 4px solid #f59e0b;
}
.openui-tabs-trigger[data-state="active"] {
  color: #7c3aed;
}
```

## Development

```sh
pnpm --filter @openuidev/react-components run build
pnpm --filter @openuidev/react-components run typecheck
```

The build writes ESM and CJS bundles with declarations and source maps to `dist/`.
