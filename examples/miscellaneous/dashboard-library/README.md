# Dashboard library

A chat app for trying `@openuidev/dashboard-kit` end to end. The chat UI is `AgentInterface` from
`@openuidev/react-ui`. Each reply shows its text in the chat and its dashboard, rendered with
`openuiDashboardLibrary`, in `AgentInterface`'s side panel. The model route calls OpenUI Cloud
(Thesys) with the kit's generated system prompt.

## Prompt options

This example turns on every prompt option, on top of the kit's own `openuiDashboardPromptOptions`
(`src/lib/library.ts`):

- `preamble`, `examples`, `additionalRules`, `bindings`: from the kit. Two kit rules are swapped
  for rules of its own: the one that says the reply is a bare program (inline mode fences it instead) and
  the one that says buttons can't change anything (they can run a Mutation now).
- `toolCalls`, `tools`, `toolExamples`: five fake sales tools in `src/lib/tools.ts`. Four read data
  (`get_kpis`, `get_revenue_series`, `get_sales_by_category`, `get_orders`) and one changes it
  (`update_order_status`). They run in the browser and reset on reload.
- `builtinFunctions`: `@Sum`, `@Count`, `@Abs` and the rest.
- `editMode`: a follow-up reply can hold only the statements that changed; the app merges it onto
  the dashboard before it with `mergeStatements`.
- `inlineMode`: a reply is text plus an `openui-lang` fence; the text shows in the chat, the
  program in the panel.

The route sends the full prompt, not `cloud: true`: Cloud's managed config only forwards
`preamble`, `examples` and `additionalRules`, so every other option would be dropped.

The kit comes from this branch, not npm: `pnpm kit:pack` builds `packages/kits/dashboard` (and the
workspace packages it needs) and packs it into `.kit/dashboard-kit.tgz`, which `package.json`
installs. Everything else comes from npm.

## Run it

From the repo root, install the workspace once:

```bash
pnpm install
```

Then, in this folder:

```bash
pnpm kit:pack
pnpm install
```

Create `.env.local` with a Thesys key:

```env
THESYS_API_KEY=sk-th-...
```

`THESYS_BASE_URL` and `THESYS_MODEL` are optional; see `.env.example`. Then start it:

```bash
pnpm dev
```

`pnpm dev` regenerates `src/generated/spec.json` from the packed kit first, so the prompt always
matches the components. After you change the kit, run `pnpm kit:pack && pnpm install` again and
restart.

## Files

- `src/app/page.tsx`: `AgentInterface` inside the react-components `ThemeProvider` the kit reads
  light or dark mode from.
- `src/app/DashboardMessage.tsx`: the assistant message: chat text, the dashboard card, edit
  merging, and the side panel with the tools wired in.
- `src/lib/tools.ts`: the fake sales tools and their specs.
- `src/app/api/chat/route.ts`: streams Chat Completions from OpenUI Cloud.
- `src/lib/library.ts`: the entry `openui generate` reads, with the prompt options.
- `src/lib/system-prompt.ts`: builds the full system prompt from the generated spec.
