# OpenUI Angular Playground

An Angular 22 application that demonstrates how to render structured OpenUI Lang output with `@openuidev/angular-lang`.

This example is intentionally optimized for repository development and smoke testing. It focuses on rendering, state, query, mutation, and error-recovery behavior in Angular rather than on a hosted chat backend.

## How it works

1. **The app defines an OpenUI component library** with Angular standalone components.
2. **A small scenario switcher** swaps between static, nested, form, query, mutation, crash, and recovery responses.
3. **`@openuidev/angular-lang` Renderer** parses the OpenUI Lang text and renders Angular components in real time.
4. **Mock tools** simulate `Query()` and `Mutation()` behavior so you can smoke-test the runtime without external services.

## Setup

### Prerequisites

- Node.js 24.15+
- pnpm, npm, or Bun

### Install dependencies

From this example directory:

```bash
pnpm install --ignore-workspace
```

### Run

```bash
pnpm dev
```

Open [http://localhost:4200](http://localhost:4200).

## Local package resolution

This example is added in the same repository branch as `@openuidev/angular-lang`, so it resolves that package through a TypeScript path alias to the local package source instead of pulling a published npm version.

That keeps the example runnable before the Angular package is published while preserving the same public import path used by consumers:

```ts
import { Renderer, createLibrary, defineComponent } from "@openuidev/angular-lang";
```

## Project structure

```text
angular.json                         # Angular CLI application config
src/
├── app/
│   ├── app.ts                       # Scenario switcher + renderer host
│   ├── app.config.ts                # Application config
│   └── openui/
│       ├── library.ts               # OpenUI component definitions
│       ├── scenarios.ts             # Smoke-test scenarios and initial state fixtures
│       └── components/
│           ├── demo-input.component.ts
│           ├── greeting.component.ts
│           ├── maybe-crash.component.ts
│           ├── query-loader.component.ts
│           ├── save-button.component.ts
│           ├── stack.component.ts
│           └── state-value.component.ts
└── styles.css                       # Example layout and UI styles
```

## What to test

Use the scenario buttons in the UI to verify:

- static rendering
- nested rendering through `RenderNode`
- initial form-state hydration
- state updates from Angular components
- query loading and custom loader rendering
- mutation execution through `run` action steps
- structured parser, tool, and render errors
- render recovery with last-good-render preservation

## Verify

```bash
pnpm verify
```
