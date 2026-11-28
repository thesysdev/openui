---
"@openuidev/server": patch
---

Dashboards ship their agent tools: `dashboards.tools()` returns `create_dashboard`, `edit_dashboard` and `get_dashboard` as framework tools (the AI SDK takes them as is; LangChain, Mastra and OpenAI Agents in one line), and `dashboards.mcpServer()` / `dashboards.mcpHandler()` serve the same tools over MCP. Install `@modelcontextprotocol/server` (and `@modelcontextprotocol/client` for `transport()`) to use MCP.
