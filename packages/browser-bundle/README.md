# @openuidev/browser-bundle

Prebuilt IIFE browser bundle of [`@openuidev/react-lang`](../react-lang) + [`@openuidev/react-ui`](../react-ui) plus all their runtime dependencies (React, ReactDOM, Radix, Recharts, date-fns, react-markdown, etc.) in a single file, plus a combined stylesheet.

Intended for **iframe, CDN, and no-build-pipeline** contexts where ESM/CJS module resolution isn't available and you just want a `<script>` tag that gives you the OpenUI renderer and component library.

Example consumers:

- [Open WebUI tool plugins](https://github.com/thesysdev/openwebui-plugin) that inject sandboxed HTML via `HTMLResponse`
- Embeddable chat widgets on static sites
- Quick demos and CodePen-style prototypes

For any build-pipeline project, use `@openuidev/react-lang` and `@openuidev/react-ui` directly.

## Install

You almost certainly want to use the CDN — that's the point of this package. jsDelivr and unpkg both auto-publish from npm:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@0.1.0/dist/openui-styles.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@openuidev/browser-bundle@0.1.0/dist/openui-bundle.min.js"></script>
```

## Public API

The bundle attaches a single global:

```ts
window.__OpenUI = {
  React,              // react
  createRoot,         // react-dom/client
  Renderer,           // @openuidev/react-lang
  openuiChatLibrary,  // @openuidev/react-ui/genui-lib
};
```

This shape is a **stable public contract**. Any change to the keys or their exported values is considered breaking and bumps the major version of this package.

## Usage

```html
<div id="root"></div>
<script>
  const { React, createRoot, Renderer, openuiChatLibrary } = window.__OpenUI;
  const { library, schema } = openuiChatLibrary;

  const openuiLangCode = "..."; // from your LLM / backend

  createRoot(document.getElementById("root")).render(
    React.createElement(Renderer, { code: openuiLangCode, library, schema }),
  );
</script>
```

## Size

- `openui-bundle.min.js` — ~2.2 MB raw / ~650 KB gzipped
- `openui-styles.css` — ~150 KB raw

All dependencies are inlined; there are no runtime fetches beyond the two files above.

## Rebuilding locally

```bash
pnpm install
pnpm --filter @openuidev/browser-bundle build
```

This produces `dist/openui-bundle.min.js` and `dist/openui-styles.css`.
