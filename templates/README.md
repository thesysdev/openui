# CLI templates

Starter apps for `openui create`. `templates.json` is the catalog file.

| Directory             | `--template`                         |
| --------------------- | ------------------------------------ |
| `openui-cloud/`       | `openui-cloud` (interactive default) |
| `openui-self-hosted/` | `openui-self-hosted`                 |

Each template ships `package-lock.json` and `pnpm-lock.yaml` so npm and pnpm
scaffolds install the same versions. Regenerate both together — never one on its
own — with `npm install --package-lock-only` and `pnpm install --lockfile-only`,
using the pnpm version pinned in
`.github/workflows/cli-template-package-managers.yml`; CI fails when the two
disagree.
