# CLI templates

Starter apps for `openui create`. `templates.json` is the catalog file.

| Directory             | `--template`                         |
| --------------------- | ------------------------------------ |
| `openui-cloud/`       | `openui-cloud` (interactive default) |
| `openui-self-hosted/` | `openui-self-hosted`                 |

Each template ships `package-lock.json` and `pnpm-lock.yaml` so npm and pnpm
scaffolds install the same versions. Refresh them together — never one on its
own — with `node packages/openui-cli/scripts/refresh-template-locks.mjs
[template...]`, using the pnpm version pinned in
`.github/workflows/cli-template-package-managers.yml`; CI fails when the two
disagree.
