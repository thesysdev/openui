# Docs bandwidth budget

openui.com runs on Vercel, which bills for every byte and request it serves.
`check.mjs` opens the pages in `budgets.json` in Chrome against a local build
and fails the PR when one:

- **loads more than `loadKB`** (bytes served by the site; third-party images don't count),
- **downloads more than `idleKB` while left open** for `idleSeconds`, or
- **downloads the same file again** after it already has it (e.g. a `?v=` cache-buster on a looping animation).

Run it locally:

```bash
cd docs && pnpm build && pnpm start --port 3000
# in another shell
cd .github/scripts/docs-bandwidth && npm install --no-package-lock
BASE_URL=http://localhost:3000 node check.mjs
```

If a page fails, make it lighter first: MP4 instead of GIF, compressed images,
lazy loading, smaller JS. Raise a budget only when the extra weight is intended,
and say why in the PR.
