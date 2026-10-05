---
"@openuidev/server": minor
---

Add `createServerClient` with shared Gateway configuration, default `THESYS_API_KEY` lookup, and provider-specific Autofix namespaces for existing Chat Completions and AI SDK adapters. The OpenAI client exposes Chat Completions conversation persistence.

Deprecate standalone Autofix, history persistence, and message conversion helpers while retaining compatibility wrappers. Accept library specs per Autofix operation and propagate cancellation through persistence.
