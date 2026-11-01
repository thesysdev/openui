# OpenUI x ShadCN Dashboards

Ask a chat agent for a dashboard about any npm package or GitHub repository and watch it build in a side panel from [shadcn/ui](https://ui.shadcn.com) components. The dashboard is stored in OpenUI Cloud, but its numbers load live every time it opens: downloads and releases from npm, stars and commit activity from GitHub, and known vulnerabilities from [OSV.dev](https://osv.dev) through an MCP server. Ask for a change and the same dashboard updates in place.

It runs on Next.js, OpenUI Gateway's Chat Completions API, and `@openuidev/server`'s dashboards. The chat is built from shadcn/ui primitives around the cloud artifact renderer from `@openuidev/react-ui/cloud`, and dashboards are built from an OpenUI component library of shadcn/ui components, adapted from the [shadcn/ui example](../../design-systems/shadcn).

## Run

Requirements: Node.js 22.13+ and npm. This is a standalone example outside the package workspace.

```bash
npm install
```

Mint a `THESYS_API_KEY` into `.env.local`, or create one in the [Thesys Console](https://console.thesys.dev/keys) and add it there yourself:

```bash
npm run generate:apiKey
```

Optional settings, also in `.env.local` (see `.env.example`):

- `GITHUB_TOKEN` raises GitHub's rate limit from 60 to 5,000 requests an hour. Any token works; public repositories need no scopes. Without it, a few GitHub dashboards an hour are fine.
- `OPENUI_MODEL` selects the chat model as a `provider/model` identifier; the default is `openai/gpt-5.5`.
- `OPENUI_DASHBOARD_MODEL` selects the model that builds dashboards; the default is `anthropic/claude-sonnet-4.6`.
- `THESYS_BASE_URL` points the app at another OpenUI Cloud deployment, such as a local stack at `http://localhost:3102`; the default is `https://api.thesys.dev`. The browser then reaches it through this app's origin, so set it before `npm run dev` or `npm run build`.

```bash
npm run dev
```

Open http://localhost:3000. To use another port, run `npm run dev -- --port 3001`.

Try:

- “Compare weekly npm downloads for react, vue and svelte over the last 6 months.”
- “A health dashboard for vercel/next.js: stars, open issues, release cadence and npm downloads.”
- “Security overview for lodash: known vulnerabilities by severity and which versions fix them.”
- With a dashboard open, **Edit** it: “add a GitHub stars row for each framework.”
- Reload the page and reopen a dashboard from **Your dashboards**.

## Data sources

Dashboards load their data from three kinds of source, all public and free:

| Source                                         | Tools                                                                  | Notes                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| npm (`src/lib/data/npm.ts`)                    | `get_npm_downloads`, `get_npm_package`                                 | No key. Downloads per day, week, or month for up to five packages; metadata and release history |
| GitHub (`src/lib/data/github.ts`)              | `get_github_repo`, `get_github_commit_activity`, `get_github_releases` | 60 requests an hour without `GITHUB_TOKEN`, 5,000 with it                                       |
| OSV.dev MCP server (`src/lib/data/osv-mcp.ts`) | `osv.vulnerabilities`, `osv.compare_packages`                          | An MCP server running in this process, offered with `defineDashboard({ mcp })`                  |

Each data tool has a description, a JSON Schema for its arguments, and a static example output, so generated dashboards know the data's shape without calling the APIs. Calls time out after 10 seconds or when the dashboard's request ends, results are cached for a few minutes to stay inside the rate limits, and arguments are read leniently: a filter nobody has picked yet arrives as `""` or `null`, and limits are clamped.

The OSV tools come from a real MCP server (`McpServer` from `@modelcontextprotocol/sdk`) connected over MCP's in-memory transport. In your app, pass the client of any MCP server your agent already uses; `defineDashboard` offers its read-only tools to dashboards, with `outputs` as their example results.

## How it works

1. The chat sends the conversation to `/api/chat`, which calls OpenUI Gateway's Chat Completions API with two tools, `create_dashboard` and `edit_dashboard`.
2. The model calls `create_dashboard` with a title and a description of the dashboard. The tool calls `dashboards.create()`, which starts generating the dashboard in OpenUI Cloud and returns as soon as it has an id. Its `response` goes back to the model as the tool's result.
3. The route streams the reply's text and each tool's `response` to the browser. The chat keeps a reply as an ordered list of parts, text and dashboard cards, so each card sits where its tool ran. The browser passes the `response`, unchanged, to `LiveArtifactRenderer`, which streams the dashboard from OpenUI Cloud as it's generated.
4. The dashboard loads its data with `Query()` calls. The renderer sends each one to `/api/interpreter`, where `dashboards.interpreter.execute()` runs the matching data tool or MCP tool on this server, or a script the dashboard was generated with, which calls the same tools.
5. For a change, the model calls `edit_dashboard` with the dashboard's id. The open dashboard stays on screen until the new version is ready, then every renderer showing it switches over.

## The component library

`src/library.ts` exports the dashboard library from `src/lib/shadcn-genui`: shadcn/ui components defined with `defineComponent`, focused on dashboards. Its root is `Stack`, which lays out the whole dashboard; a `Stack` row is a grid of equal columns that wraps on narrow screens. `Card`, `CardHeader`, and `Metric` (a KPI tile) group content; `LineChart`, `AreaChart`, `BarChart`, and `PieChart` are shadcn charts on Recharts; `Table` is column-oriented, so a `Query()` result's fields pluck straight into its `Col`s; `Select` binds to a `$variable` that `Query()` arguments read, so picking an option reloads the data. Metrics, columns, and chart axes format numbers and dates themselves.

`npm run generate` writes the library's specification to `src/generated/spec.json`, with `root: "Stack"`. The server builds dashboards from that file, so it never loads React components; the browser renders them with the library itself. `src/lib/shadcn-genui/prompt.ts` adds example dashboards and layout rules for the model that builds them.

The app and the dashboards share shadcn/ui's theme tokens in `src/app/globals.css` (Tailwind CSS v4), so dark mode follows the system for both. `src/components/ui` holds the shadcn/ui primitives they use.

## The server

`src/lib/openui.ts` defines every dashboard once with `openui.defineDashboard({ library, model, tools, mcp, promptOptions })`. `/api/frontend-token` returns `openui.createFrontendToken({ userId })`, a short-lived token that reads only that user's dashboards. The dashboard tools pass the same `userId`, so the dashboards they create belong to that user. There's no sign-in, so every browser shares one local user (`DEMO_USER_ID`, default `shadcn-dashboards-demo`).

## The browser

`OpenUICloudProvider` in `src/components/app.tsx` connects everything below it to OpenUI Cloud. It fetches the frontend token from `/api/frontend-token`, refreshes it before it expires, and shares one stream per dashboard among every renderer that shows it. The rest uses it in three ways:

- **Hooks.** `parseArtifactReference()` reads a tool's `response`, so the chat knows which dashboard a result names, and skips tool errors. `useArtifactStorage().list({ type: ["dashboard"] })` lists the user's dashboards in the sidebar. Choosing one renders it from its `id`.
- **The renderer.** `LiveArtifactRenderer` in `src/components/dashboard.tsx` takes the `response` (or an `id`), the component library, and the interpreter endpoint. Each card is controlled with `isOpen`/`onOpenChange` and opens the dashboard in the side panel with `renderInHtmlElement`; under 900px the panel covers the screen.
- **Slots.** Every part of the renderer is a slot with three modes: omit it for the default, pass props to adjust the default, or pass children to replace it. The example replaces the `Preview` with its own card and the `Chrome` with a shadcn/ui frame built from the chrome's parts: `ChromeTitle` (props), a status badge, `ChromeActions` with **Edit** and a `CloseButton`, and `Content`, whose `Loading` and `Error` slots are replaced too. Replaced `Loading` and `Error` still show only while the dashboard loads or after it fails, so their children don't check that themselves. The card, the badge, the buttons, and the error message call `useArtifactRenderer()` for the dashboard's title, streaming and loading state, error, open state, and `retry`. Since every part is replaced, the renderer needs none of react-ui's styles.

The chat itself is plain React: it keeps the conversation in Chat Completions format, including tool calls and their results, so the model has each dashboard's id for later edits. When a dashboard is open, the chat adds its id to the user's message, so “this” refers to it.

## Files

| File                                  | Purpose                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/data/npm.ts`                 | npm download and package data tools                                   |
| `src/lib/data/github.ts`              | GitHub repository, commit activity, and release data tools            |
| `src/lib/data/osv-mcp.ts`             | The OSV.dev MCP server, its client, and its example outputs           |
| `src/lib/data/fetch.ts`               | Timeouts, caching, and lenient arguments for the data tools           |
| `src/lib/openui.ts`                   | `OpenUIClient`, the dashboard definition, the base URL and local user |
| `src/lib/dashboard-tools.ts`          | `create_dashboard` and `edit_dashboard` for the chat model            |
| `src/lib/prompt.ts`                   | Chat instructions and the data dashboards can show                    |
| `src/lib/shadcn-genui/`               | The shadcn/ui dashboard library, and its examples and rules           |
| `src/library.ts`                      | The library's entry point for `npm run generate`                      |
| `src/app/api/chat/route.ts`           | `runTools()` generation, streamed as text and tool results            |
| `src/app/api/interpreter/route.ts`    | Runs dashboards' `Query()` calls with `dashboards.interpreter`        |
| `src/app/api/frontend-token/route.ts` | The user's frontend token for OpenUI Cloud                            |
| `src/components/app.tsx`              | `OpenUICloudProvider`, layout, and which dashboard is open            |
| `src/components/chat.tsx`             | Messages, starters, composer, and the streamed reply                  |
| `src/components/dashboard.tsx`        | `LiveArtifactRenderer` with custom slots                              |
| `src/components/dashboard-list.tsx`   | The user's dashboards, listed from OpenUI Cloud                       |
| `src/components/ui/`                  | shadcn/ui primitives                                                  |

`npm run generate` creates the ignored component specification before dev/build/verify.

## Deploying

The app binds to loopback and every browser shares one local user. For deployment, add [authentication](https://www.openui.com/docs/gateway/authentication) and use the signed-in user's id for the frontend token and the dashboard tools. Pass the user as the interpreter's `context` if data tools should return only what they may see, and check that the dashboard id in an interpreter request belongs to that user. The browser sends the whole conversation, including tool results, so keep it on the server instead, or check it, before you rely on it. Add request-size and rate limits to the routes, and set `GITHUB_TOKEN`.

OpenUI Cloud stores each dashboard's definition, not its data: numbers reach the browser only through `/api/interpreter`, from your server. Gateway receives the conversation, the dashboard descriptions, and the data tools' descriptions and example outputs.

## Verify

```bash
npm run verify
```

`verify` generates the component specification and runs a production build with type checking. It needs no credentials.

In the browser, create one dashboard per data source from the starters and watch each build in the panel, change a filter and see its data reload, ask for a change with **Edit** and see it switch over when ready, close and reopen it from its card, reload and reopen it from **Your dashboards**, and stop a reply mid-way.

## Adapt it

Replace the data tools in `src/lib/data` with queries to your database or API, and the OSV server with your own MCP server, then update the prompt in `src/lib/prompt.ts`. To change how dashboards look, add or restyle components in `src/lib/shadcn-genui`, then regenerate the specification. Components from the shadcn/ui example's library can be added the same way.
