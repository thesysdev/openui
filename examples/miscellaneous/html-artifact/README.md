This example uses [OpenUI](https://openui.com) to generate self-contained HTML/CSS/JavaScript experiences. The model chats normally with markdown and only emits an `HtmlArtifact` when asked to build something interactive. The `HtmlArtifact` component keeps a compact status preview inline and opens a detailed right panel with Raw and Rendered tabs. Raw displays the incoming source; Rendered shows a loading state, then a sandboxed iframe when the stream completes.

This is intentionally a minimal example. Before using generated HTML in production, normalize and validate it, enforce a Content Security Policy, restrict network access, and validate iframe messages.

## Getting Started

First, create a `.env` file:

```env
THESYS_API_KEY=sk-th-...
```

Then run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The generated component is defined in `src/html-artifact.tsx`, its OpenUI library and prompt rules are in `src/library.tsx`, and the model route is in `src/app/api/chat/route.ts`. The route proxies Chat Completions through OpenUI Cloud.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!

## Verify

```bash
pnpm verify
```
