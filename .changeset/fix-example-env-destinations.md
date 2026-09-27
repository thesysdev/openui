---
"@openuidev/cli": patch
---

Honor each example's environment file location when writing API keys. FastAPI and React Native now receive keys in `backend/.env`, and Supabase receives its key in `.env`. Standardize example setup, key-generation scripts, and scaffolding on `.env` to avoid conflicting files.

Define example environment configuration as `env: { file, keys }`, and prompt for and write each configured key while reporting skipped keys.
