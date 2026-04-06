# OpenUI Dashboard Example

A live dashboard builder powered by [OpenUI](https://openui.com) and openui-lang. Chat with an LLM to create interactive dashboards with real-time data from MCP tools.

## Features

- **Conversational dashboard building** — describe what you want, get a live dashboard
- **MCP tool integration** — Query live data sources (PostHog, server health, tickets)
- **Streaming rendering** — dashboards appear progressively as the LLM generates code
- **Edit support** — refine dashboards through follow-up messages
- **16 built-in tools** — analytics, monitoring, ticket management, and more

## Getting Started

```bash
# Set your LLM API key
export OPENAI_API_KEY=sk-...
# Or use any OpenAI-compatible provider:
# export LLM_API_KEY=your-key
# export LLM_BASE_URL=https://openrouter.ai/api/v1
# export LLM_MODEL=your-model

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start building dashboards.

## Optional: PostHog Integration

For real analytics data, set PostHog credentials:

```bash
export POSTHOG_API_KEY=phx_...
export POSTHOG_PROJECT_ID=12345
```

## Learn More

- [OpenUI Documentation](https://openui.com/docs)
- [OpenUI GitHub](https://github.com/thesysdev/openui)
