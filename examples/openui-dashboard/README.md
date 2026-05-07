# OpenUI Dashboard Example

A live dashboard builder powered by [OpenUI](https://openui.com) and openui-lang. Chat with an LLM to create interactive dashboards with real-time data from MCP tools.

## Features

- **Conversational dashboard building** — describe what you want, get a live dashboard
- **MCP tool integration** — Linear workspace data via hosted MCP (`https://mcp.linear.app/mcp`)
- **Streaming rendering** — dashboards appear progressively as the LLM generates code
- **Edit support** — refine dashboards through follow-up messages
- **Linear MCP tools** — issues, projects, teams, and more (tool list comes from Linear at runtime)

## Getting Started

```bash
# Set your LLM API key
export OPENAI_API_KEY=sk-...
# Or use any OpenAI-compatible provider:
# export LLM_API_KEY=your-key
# export LLM_BASE_URL=https://openrouter.ai/api/v1
# export LLM_MODEL=your-model

# Linear MCP — API key or OAuth access token (server-only; used by /api/mcp and /api/chat)
# See https://linear.app/docs/mcp
export LINEAR_API_KEY=lin_api_...

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start building dashboards.

## Learn More

- [OpenUI Documentation](https://openui.com/docs)
- [OpenUI GitHub](https://github.com/thesysdev/openui)
