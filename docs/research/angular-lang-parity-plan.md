# Angular Lang Parity Audit

## Purpose

This document records the current architecture, parity target, delivered surface area, and validation status for `@openuidev/angular-lang` inside the OpenUI monorepo.

The original planning phase is complete. This file now serves as an implementation audit and upstream review aid for the eventual maintainer discussion and pull request.

## Contribution Intent

This work is intended to become a pull request against the OpenUI repository once maintainers confirm that adding an Angular runtime package fits the project roadmap.

The package scope remains intentionally narrow:

- `@openuidev/angular-lang` only
- no Angular chat UI package
- no Angular headless chat package
- no unrelated `lang-core` refactors
- no design-system component catalog
- no browser bundle or docs-site platform work outside package onboarding

## Parity Target

Reference order:

- **Foundation:** `@openuidev/lang-core`
- **Primary parity target:** `@openuidev/vue-lang`
- **Behavior fallback:** `@openuidev/react-lang`
- **Minimal comparison:** `@openuidev/svelte-lang`

The Angular package aims to match the runtime and authoring surface that matter for production use:

- component definition
- library creation
- prompt generation through the library object and prompt helpers
- streaming parser integration
- recursive rendering
- state hydration and updates
- action execution
- query and mutation orchestration
- query loading state and custom loader support
- structured parser, query, and render errors
- form validation helpers
- framework-native authoring helpers

## Current Status

`@openuidev/angular-lang` is implemented and validated as a real Angular library package.

Delivered and verified:

- Angular Package Format packaging with `ng-packagr`
- Angular `defineComponent()` and `createLibrary()` wrappers
- `Renderer` / `OpenUiRendererComponent` standalone renderer export
- `RenderNode` / `OpenUiRenderNodeComponent` recursive render-node export
- streaming parser wiring via `createStreamingParser()`
- `initialState` hydration
- state read and write via injected OpenUI context
- `(action)`, `(stateUpdate)`, `(parseResult)`, and `(error)` outputs
- `toolProvider` support for async function maps and MCP-like clients
- query manager integration
- mutation registration and execution through `run` action steps
- `isQueryLoading` exposure and `queryLoader` customization
- Angular DI helpers for renderer authors
- Angular default-value helper for form components
- Angular form-validation helper surface
- structured parser, query, and render error emission
- last-good-render preservation for render failures in the dynamic renderer path
- broader `lang-core` re-exports for parser, prompt, merge, and runtime helpers
- repo-aligned README and package-local documentation

Known non-goals that remain outside this package scope:

- a polished example app in the monorepo
- Angular-specific devtools or observability extras beyond current parity needs
- a large first-party Angular component catalog

## Package Analysis Summary

### `@openuidev/lang-core`

`lang-core` is the correct foundation for Angular support. It already provides the framework-agnostic primitives needed by the package:

- `createLibrary`
- `defineComponent`
- `createParser`
- `createStreamingParser`
- `createStore`
- `createQueryManager`
- `evaluate`
- `evaluateElementProps`
- prompt-generation helpers
- merge helpers
- validation helpers
- parser and runtime types

Angular support therefore does not require a new parser, new state model, or new query runtime.

### `@openuidev/react-lang`

`react-lang` remains the most complete behavior reference.

The Angular package intentionally matched React behavior where it mattered most:

- query loader surface
- structured render-error emission
- last-good-render preservation
- broader prompt/parser/runtime re-exports
- stable tool-provider semantics from the host point of view

### `@openuidev/vue-lang`

`vue-lang` remained the primary parity target for package shape and authoring ergonomics.

The Angular package mirrors Vue most closely in these areas:

- framework-specific component-definition wrapper
- renderer plus render-node split
- framework-native context helpers
- validation surface co-located inside the package
- query/mutation behavior without React-specific hook patterns

### `@openuidev/svelte-lang`

`svelte-lang` is still useful as a minimal comparison package but not as a completeness target.

## Parity Matrix

| Capability | `react-lang` | `vue-lang` | `svelte-lang` | `angular-lang` |
| --- | --- | --- | --- | --- |
| `defineComponent` | Yes | Yes | Yes | Yes |
| `createLibrary` | Yes | Yes | Yes | Yes |
| Recursive renderer | Yes | Yes | Yes | Yes |
| Streaming parser | Yes | Yes | No | Yes |
| `initialState` | Yes | Yes | Yes | Yes |
| `onStateUpdate` / state updates | Yes | Yes | Yes | Yes |
| `onAction` / action output | Yes | Yes | Yes | Yes |
| `onParseResult` / parse output | Yes | Yes | Yes | Yes |
| `toolProvider` | Yes | Yes | No | Yes |
| Query manager integration | Yes | Yes | No | Yes |
| Mutation execution | Yes | Yes | No | Yes |
| Structured errors | Yes | Yes | No | Yes |
| Query loading state | Yes | Yes | No | Yes |
| Custom query loader | Yes | Yes | No | Yes |
| Validation helpers | Yes | Yes | Yes | Yes |
| Framework-native authoring helpers | Yes | Yes | Yes | Yes |
| Prompt helper re-exports | Yes | Partial | Partial | Yes |

## Actual Architecture

### Package type

The package is implemented as a real Angular library and packaged with Angular Package Format conventions.

### Runtime architecture

The runtime is built around the existing `lang-core` primitives:

- parser state from `createStreamingParser()`
- store state from `createStore()`
- query and mutation orchestration from `createQueryManager()`
- evaluated render trees from `evaluateElementProps()`

Angular-specific responsibilities are layered on top:

- standalone renderer shell component
- standalone recursive render-node component
- dynamic component instantiation through Angular's runtime component APIs
- dependency-injection helpers for context access
- Angular outputs for host callbacks

### Dynamic component rendering

The renderer uses controlled dynamic instantiation through Angular's `createComponent()` APIs with explicit provider scoping for:

- OpenUI context injection
- form-name scoping
- recursive rendering
- render-error containment

### Context access model

Angular authoring ergonomics are DI-first rather than hook-based.

Exposed helpers include:

- `injectOpenUiContext()`
- `injectRenderNode()`
- `injectTriggerAction()`
- `injectIsStreaming()`
- `injectIsQueryLoading()`
- `injectGetFieldValue()`
- `injectSetFieldValue()`
- `injectStore()`
- `injectEvaluationContext()`
- `injectFormName()`
- `setDefaultValue()`

## Public API Shape

The implemented package surface is centered around:

```ts
import {
  Renderer,
  RenderNode,
  createLibrary,
  defineComponent,
  injectOpenUiContext,
  injectFormName,
  injectTriggerAction,
  injectGetFieldValue,
  injectSetFieldValue,
  injectIsStreaming,
  injectIsQueryLoading,
  setDefaultValue,
  createFormValidation,
  provideFormValidation,
  injectFormValidation,
  createParser,
  createStreamingParser,
  generatePrompt,
  generateSystemPrompt,
  mergeStatements,
  parseRules,
  parseStructuredRules,
  validate,
} from "@openuidev/angular-lang";
```

Template usage:

```html
<openui-renderer
  [response]="response"
  [library]="library"
  [isStreaming]="isStreaming"
  [initialState]="initialState"
  [toolProvider]="toolProvider"
  [queryLoader]="queryLoader"
  (action)="onAction($event)"
  (stateUpdate)="onStateUpdate($event)"
  (parseResult)="onParseResult($event)"
  (error)="onError($event)"
/>
```

## Package Layout

```text
packages/angular-lang/
  package.json
  README.md
  ng-package.json
  tsconfig.json
  tsconfig.lib.json
  tsconfig.spec.json
  src/
    public-api.ts
    lib/
      context.ts
      context.spec.ts
      library.ts
      library.spec.ts
      query.spec.ts
      render-error.spec.ts
      render-node.component.ts
      renderer.component.ts
      renderer.spec.ts
      state.spec.ts
      tokens.ts
      types.ts
      validation.ts
      validation.spec.ts
```

## Validation Gates

The package should not be treated as ready without passing all package-local checks.

Required validation commands:

```bash
pnpm --filter @openuidev/angular-lang test
pnpm --filter @openuidev/angular-lang typecheck
pnpm --filter @openuidev/angular-lang build
pnpm --filter @openuidev/angular-lang lint:check
pnpm --filter @openuidev/angular-lang format:check
```

Latest verified state on this branch:

- `test` ✅
- `typecheck` ✅
- `build` ✅
- `lint:check` ✅
- `format:check` ✅

## Review Notes for Maintainers

The branch is intentionally optimized for reviewability:

- package-local implementation only
- package-local tests only
- repo-aligned README
- no speculative cross-package cleanup
- no unrelated architectural changes outside the Angular runtime package

That makes the package suitable for upstream discussion as a focused Angular runtime contribution.
