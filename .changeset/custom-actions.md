---
"@openuidev/lang-core": minor
"@openuidev/react-lang": minor
"@openuidev/react-ui": patch
---

Add custom actions: `defineAction({ name, description, params })` plus `createLibrary({ actions })`. Programs use them like the built-in steps, alone or in `Action([...])`, for example `Button("Copy", @CopyToClipboard(order.id))`, with positional arguments in `params` key order. On click the step reaches the host `onAction` as `{ type: name, params }` (schema defaults applied), in order with the other steps, and the event is typed from the library so `params` narrows by `type`. Args are validated like library function args, and a step with invalid args is a no-op. Only a real call produces a custom step: a plan read from data (an object literal, `$state`, an `@Each` item) loses its custom steps, and a legacy action object whose type names a custom action is ignored. `library.toJSONSchema()` lists actions under `actions`, the prompt lists them with the built-in action steps, and `toSpec()` includes them. The React `Renderer` and the server autofix parser pick them up automatically, and the react-ui `Button` validates its form before a custom action. Vue and Angular renderers do not support custom actions yet.

The built-in steps (`@Run`, `@ToAssistant`, `@OpenUrl`, `@Set`, `@Reset`) are now defined like custom actions and live in the same call registry, so their prompt lines are generated too (for example `@OpenUrl(url: string)`). `ACTION_NAMES` is removed: use `isBuiltin(name)`.

A defined action has a `.ref` for slots that take only some actions, for example `share: z.union([copy.ref, steps.OpenUrl.ref]).optional()`: the prompt signature prints `share?: @CopyToClipboard | @OpenUrl`, and the JSON gets a `CopyToClipboard` `$defs` entry `{ type: "CopyToClipboard", params }`.
