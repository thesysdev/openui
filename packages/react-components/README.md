# @openuidev/react-components

React components for OpenUI: inputs, layout, text and Markdown, media, tables, cards, loading
states and charts, with light and dark themes. Styled with Goober, so there is no stylesheet to
import.

## Install

```sh
pnpm add @openuidev/react-components react react-dom zod zustand
```

Peer dependencies: React 18.3 or 19, `zod` 3.25 or 4, and `zustand` 4.5.

## Usage

Wrap your app in `ThemeProvider`, then use any component:

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

Every component, its parts and its types come from the package root.

## Theming

`ThemeProvider` sets the theme's colour, type and spacing variables:

- `mode` is `"light"` (the default) or `"dark"`.
- `lightTheme` and `darkTheme` override any tokens. Without `darkTheme`, the `lightTheme` overrides
  apply to both modes.
- `cssSelector` is where the variables go: `body` by default. A nested provider scopes its own
  theme to its children.

```tsx
import { ThemeProvider, createTheme } from "@openuidev/react-components";

<ThemeProvider mode="dark" lightTheme={createTheme({ interactiveAccentDefault: "#7c3aed" })}>
  <App />
</ThemeProvider>;
```

`ThemeProvider` doesn't paint the page. Give it the theme's background so dark text never sits on
a white page:

```css
body {
  background: var(--openui-background);
}
```

`useTheme()` reads the current theme and mode, and `useSystemThemeMode()` follows the user's
system setting.

## Styling

Component styles are added to the page in the browser, in one `<style id="openui-styles">` tag.

- **Cascade layer:** call `configureStyles({ layer: "openui" })` once, before rendering, to put
  every component rule in that layer.
- **Your own rules:** the package exports `css` and `keyframes`.
- **Server rendering:** server-rendered HTML doesn't include the component styles yet; they're added
  when the page loads in the browser.

## Overriding styles

Each component has stable `openui-*` class names and data attributes to target:

```css
.openui-callout--variant-warning {
  border-left: 4px solid #f59e0b;
}
.openui-tabs-trigger[data-state="active"] {
  color: #7c3aed;
}
```

## License

MIT
