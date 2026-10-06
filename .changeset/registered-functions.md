---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
---

Add library functions: `defineFunction({ name, description, params, returns, fn })` plus `createLibrary({ functions })`, for example `@Percent(done, total)`. Programs call them with positional arguments in `params` key order, and `fn` receives one object with schema defaults applied. `library.toJSONSchema()` lists them under `functions` (params and returns as JSON Schema) and `toSpec()` describes them like components, so every parser built from the schema, including the server autofix, accepts them. Args go through the component prop pipeline: the parser maps them by name and validates literals (`type-mismatch`, `missing-required`, `excess-args`; an invalid optional arg is dropped so its default applies), the runtime validates dynamic args and return values. An invalid call or a throwing `fn` evaluates to null with a `runtime-error`. Calls run on every streamed chunk like built-ins; the Renderer reports their errors once streaming ends. The prompt lists them with the built-in functions, and the new `builtinFunctions` prompt option lists the built-ins without `toolCalls` or `bindings`; prompt options never change what parses or runs.

Built-ins are now defined with `defineFunction` too, so their prompt lines are generated (for example `@Sum(numbers: number[]) → number`) and `BUILTINS` entries take one args object. `BUILTIN_NAMES`, `LAZY_BUILTINS` and the `BuiltinDef` type are removed: use `isBuiltin(name)` and `BUILTINS`. Vue and Angular renderers do not run library functions yet.
