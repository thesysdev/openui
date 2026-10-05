# eve Agent App

This project uses the eve framework. Before writing code, always read the relevant guide in `node_modules/eve/docs/`.

## OpenUI chat wiring

The hand-written `ChatLLM` in `src/eve-chat.ts` is an intentional exception to the repo's fetchLLM-first convention: there is no HTTP chat endpoint here. Its `send` drives Eve's native session protocol (`POST /eve/v1/session`, resumable NDJSON event stream) and synthesizes the AG-UI SSE stream client-side from Eve session events, so `fetchLLM` does not apply — do not migrate it. Normal HTTP chat backends should use `fetchLLM` from `@openuidev/react-ui` instead of hand-writing a `ChatLLM`.
