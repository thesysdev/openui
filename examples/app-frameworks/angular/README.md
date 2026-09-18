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

- Node.js 24.15.0+ (24.x), or another version supported by Angular 22
- pnpm 10.33.0
- A full checkout of this repository; this pre-release example is not standalone

### Install dependencies

Before installing the example, build its local package from the repository root:

```bash
pnpm run examples:prepare
```

This installs workspace dependencies without running every package's prepare
script, then builds `lang-core` and `angular-lang` in dependency order.

Then install this application's separate dependencies:

```bash
cd examples/app-frameworks/angular
pnpm install --ignore-workspace --frozen-lockfile
```

The root `pnpm examples:install` command performs the preparation automatically
before installing all examples, including in CI.

### Run

```bash
pnpm dev
```

Open [http://localhost:4200](http://localhost:4200).

## Local package resolution

Until the first npm release, `@openuidev/angular-lang` is a declared
`file:../../../dist/angular-lang` dependency. pnpm installs the built package into
the example's dependency graph; there are no aliases to workspace source files.
Angular peers resolve from this application rather than loading a second Angular
runtime from the workspace.

Once the distribution exists, the example can install and build without any
workspace `node_modules` or package sources. To test it separately, copy this
example and `dist/angular-lang` while preserving their relative paths. After
changing library code, rebuild the distribution and reinstall the example's
local dependency before rebuilding the app.

After the package is published, replace the file dependency with its published
version. The public import path is already the same:

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
