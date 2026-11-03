# Dashboard kit test bench

A chat app for trying `@openuidev/dashboard-kit` end to end. The chat UI is `AgentInterface` from
`@openuidev/react-ui`, and every reply renders with `openuiDashboardLibrary`. The model route calls
OpenUI Cloud (Thesys) with the kit's generated system prompt.

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

- `src/app/page.tsx`: `AgentInterface` with the dashboard library, inside the react-components
  `ThemeProvider` the kit reads light or dark mode from.
- `src/app/api/chat/route.ts`: streams Chat Completions from OpenUI Cloud.
- `src/lib/library.ts`: the entry `openui generate` reads.
- `src/lib/system-prompt.ts`: builds the system prompt from the generated spec.
