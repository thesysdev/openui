# @openuidev/react-components (beta)

Reusable OpenUI React components, charts and themes, styled with Goober. It sits beside
`@openuidev/react-ui`, which stays unchanged.

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

Every component, supporting part and type comes from the package root. The one subpath,
`@openuidev/react-components/styles`, is for server rendering.

## Styling

Component rules go into one `<style id="openui-styles">` tag in the browser. The root also
exports `css` and `keyframes` for your own rules.

```ts
import { configureStyles } from "@openuidev/react-components";

// Optional: put every component rule in a cascade layer. Call once, before rendering.
configureStyles({ layer: "openui" });
```

For server rendering, render `<ComponentStyles />` from `@openuidev/react-components/styles`
in the document head. Under a CSP nonce, set `window.__nonce__` before the component library
loads.

## Site map

```text
packages/react-components/
└── src/
    ├── index.ts               # the public entry: every export
    ├── styles.ts              # the /styles entry for server rendering (generated)
    ├── ComponentStyles.tsx    # renders the full sheet for server HTML
    ├── components/            # one folder per component
    │   ├── Charts/            # area, bar, line, pie, radar and other charts
    │   ├── ThemeProvider/     # themes and token variables
    │   └── _shared/           # parts shared by cards, Markdown and icons
    ├── styles/                # the component sheet (css.ts), style tags and token defaults
    ├── context/               # layout and print context
    ├── hooks/                 # shared React hooks
    └── utils/                 # class name and preference helpers
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
