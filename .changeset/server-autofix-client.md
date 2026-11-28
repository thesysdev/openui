---
"@openuidev/server": minor
---

Add Autofix to `OpenUIClient`: `openui.chat.createAutofix({ library })` and `openui.ai.createAutofix({ library })` each return `{ fix, stream }`. They use the client's key, `baseUrl` and `fetch`. Deprecate the standalone `createAutofix` from `@openuidev/server/openai` and `@openuidev/server/vercel`; it still works. `openai` and `ai` are now optional peers, for these types.

Export `AutofixError` and the Autofix types from the root, `/openai` and `/vercel`. Each is one class across entries, so `instanceof AutofixError` works whichever entry you import it from.

Autofix with a missing or empty `apiKey` now fails before sending a request, with `AutofixError` code `missing_api_key`. Before, it sent `Bearer undefined` and failed with `http_error` 401.
