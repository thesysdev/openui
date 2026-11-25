---
"@openuidev/server": minor
---

Add Autofix to `OpenUIClient`: `openui.chat.createAutofix({ library })` returns `{ completions }`, and `openui.vercel.createAutofix({ library })` returns `{ ai }`. They use the client's key, `baseUrl` and `fetch`. Deprecate the standalone `createAutofix` from `@openuidev/server/openai` and `@openuidev/server/vercel`; it still works. `ai` is now an optional peer, for these types.

Export `AutofixError` and the Autofix types from the root, `/openai` and `/vercel`.

Errors are now one class across entries, so `instanceof OpenUIApiError` (or `AutofixError`) works whichever entry threw the error.

Autofix with a missing or empty `apiKey` now fails before sending a request, with `AutofixError` code `missing_api_key`. Before, it sent `Bearer undefined` and failed with `http_error` 401.
