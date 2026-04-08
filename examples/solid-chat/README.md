# OpenUI Solid Chat

Example chat app for `@openuidev/solid-lang` using a real AI model (default: Ollama/OpenAI-compatible API), Ark UI Field input, and ECharts-based visualizations.

## Goals

- Show how to define OpenUI components for Solid.
- Show how to render OpenUI Lang responses with `Renderer`.
- Show the action loop from components (for example, `Button`) back into the chat flow.

## Run

From the monorepo root:

```bash
pnpm install
cp examples/solid-chat/.env.example examples/solid-chat/.env
pnpm --filter solid-chat generate:prompt
pnpm --filter solid-chat dev
```

Then open `http://localhost:5174`.

## Model Configuration

- Default (`.env.example`) uses local Ollama:

```bash
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3.1:8b
OPENAI_API_KEY=ollama
```

- To use OpenAI cloud, change to:

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1
OPENAI_API_KEY=sk-...
```

## Notes

- The `/api/chat` endpoint is implemented directly in `vite.config.ts` via dev middleware (fast demo setup).
- OpenUI components live in `src/components` and are registered in `src/lib/library.tsx`.
- Chat input uses `@ark-ui/solid` (`Field`).
- The `Chart` component uses `echarts` (bar/line/pie/doughnut).
- Form-like rendering components are also available: `InputField`, `TextAreaField`, `SelectField`, `ToggleField`, and `Divider`.
- Form fields support `$state` binding (for example, `InputField("Email", "name@example.com", $email, "email")`) and will write values back into renderer form state.
- `Button` supports both simple action type strings and structured action objects from `Action(...)` expressions.
- The system prompt is generated into `examples/solid-chat/generated/system-prompt.txt` for easier review and iteration.

## Example Prompts

- `Build a weekly SaaS business dashboard with KPIs, revenue trend, and channel mix charts`
- `Create a support operations dashboard with ticket volume, SLA trend, and follow-up actions`
- `Build a release readiness view with milestones, blockers, and next actions`
- `Create an onboarding status page with progress timeline and action buttons`
- `Create an account settings form with profile inputs, notification toggles, and save actions`
