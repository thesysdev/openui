---
"@openuidev/server": patch
---

Add `instructions` to `openui.defineDashboard()`: your business context as a plain string, such as what the business does, who reads the dashboards, your terms, calendar and units. It's the same for every user and goes with every dashboard create and edit. `promptOptions.preamble` keeps working.
