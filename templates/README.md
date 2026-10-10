# CLI templates

Starter apps for `openui create`. `templates.json` is the catalog file.

| Directory             | `--template`                         |
| --------------------- | ------------------------------------ |
| `openui-cloud/`       | `openui-cloud` (interactive default) |
| `openui-self-hosted/` | `openui-self-hosted`                 |

Base directories are complete LangGraph apps using Chat Completions.
The CLI copies them directly for the default backend; other frameworks use overlays.
Vercel AI SDK and Vercel Eve remain available through `--backend-framework`.
