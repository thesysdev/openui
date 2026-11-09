---
"@openuidev/cli": patch
---

Let `create --example repo:<owner>/<repo>[/<path>]` scaffold from any public GitHub repository, not just `thesysdev` ones.
Only `thesysdev` repositories (or catalog entries whose `env.key` is `THESYS_API_KEY`) run the OpenUI Cloud API key flow.
