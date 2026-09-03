export type IntegrationCategoryId = "ai-frameworks" | "design-systems" | "frontend-platforms";

export interface IntegrationLink {
  label: string;
  href: string;
  kind: "Docs" | "Example" | "Guide" | "GitHub" | "npm" | "Website" | "Plugin";
}

export interface Integration {
  slug: string;
  name: string;
  logo: string;
  category: IntegrationCategoryId;
  type: string;
  summary: string;
  howItWorks: string;
  install?: string;
  links: IntegrationLink[];
}

export interface IntegrationCategory {
  id: IntegrationCategoryId;
  title: string;
  shortTitle: string;
  description: string;
}

export const integrationCategories: IntegrationCategory[] = [
  {
    id: "ai-frameworks",
    title: "AI frameworks, SDKs & protocols",
    shortTitle: "AI stack",
    description:
      "Connect OpenUI to the agent framework, AI SDK, or protocol your application already uses.",
  },
  {
    id: "design-systems",
    title: "Design systems & component libraries",
    shortTitle: "Design systems",
    description:
      "Use OpenUI's built-in components or connect the UI library your product already uses.",
  },
  {
    id: "frontend-platforms",
    title: "Frontend frameworks & platforms",
    shortTitle: "Frontend",
    description:
      "Run OpenUI in an alternative web, mobile, chat framework, or AI application platform.",
  },
];

const packageLinks = (
  packageName: string,
  sourceDirectory: string,
  docsHref?: string,
): IntegrationLink[] => [
  ...(docsHref ? [{ label: "Documentation", href: docsHref, kind: "Docs" as const }] : []),
  {
    label: "npm package",
    href: `https://www.npmjs.com/package/${packageName}`,
    kind: "npm",
  },
  {
    label: "Source code",
    href: `https://github.com/thesysdev/openui/tree/main/packages/${sourceDirectory}`,
    kind: "GitHub",
  },
];

const exampleLink = (directory: string, label = "OpenUI example"): IntegrationLink => ({
  label,
  href: `https://github.com/thesysdev/openui/tree/main/examples/${directory}`,
  kind: "Example",
});

const integrationCatalog: Integration[] = [
  // Design systems and component libraries.
  {
    slug: "shadcn-ui",
    name: "shadcn/ui",
    logo: "/integration-logos/shadcn-ui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "Wrap shadcn/ui components in an OpenUI library and let the model compose them as streaming interfaces.",
    howItWorks:
      "Each shadcn component is registered with defineComponent and a Zod prop schema. createLibrary produces both the prompt vocabulary and the renderer mapping used by the example chat app.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/design-systems/shadcn",
        kind: "Guide",
      },
      exampleLink("shadcn-chat"),
      { label: "shadcn/ui", href: "https://ui.shadcn.com", kind: "Website" },
    ],
  },
  {
    slug: "material-ui",
    name: "Material UI",
    logo: "/integration-logos/mui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "Expose Material UI components to a model without replacing your existing React design system.",
    howItWorks:
      "The example wraps Material UI components with OpenUI definitions, generates a constrained component prompt, and renders model output back into the same Material UI primitives.",
    links: [
      exampleLink("material-ui-chat"),
      {
        label: "Defining components",
        href: "/docs/openui-lang/defining-components",
        kind: "Guide",
      },
      { label: "Material UI", href: "https://mui.com/material-ui", kind: "Website" },
    ],
  },
  {
    slug: "handsontable",
    name: "Handsontable",
    logo: "https://raw.githubusercontent.com/handsontable/handsontable/develop/docs/public/favicon.png",
    category: "design-systems",
    type: "Data grid",
    summary:
      "Connect a live Handsontable spreadsheet to OpenUI so agent tools can analyze and update its data.",
    howItWorks:
      "The maintained example shares table state between Handsontable and a custom OpenUI SpreadsheetTable component. Tool calls update the server-side data, and the rendered component synchronizes those results back into the live grid.",
    links: [
      exampleLink("hands-on-table-chat"),
      { label: "Handsontable", href: "https://handsontable.com", kind: "Website" },
    ],
  },
  {
    slug: "react-email",
    name: "React Email",
    logo: "/integration-logos/react-email.svg",
    category: "design-systems",
    type: "Email component library",
    summary:
      "Generate, preview, and export email-safe interfaces with OpenUI's React Email component package.",
    howItWorks:
      "@openuidev/react-email provides 44 OpenUI component definitions, an emailLibrary, and prompt rules. OpenUI Lang streams into a React Email preview, which @react-email/render can convert to email-compatible HTML.",
    install: "npm install @openuidev/react-email @openuidev/react-lang",
    links: [
      ...packageLinks("@openuidev/react-email", "react-email", "/docs/api-reference/react-email"),
      exampleLink("react-email"),
      { label: "React Email", href: "https://react.email", kind: "Website" },
    ],
  },

  // AI frameworks, SDKs, and protocols.
  {
    slug: "langchain-langgraph",
    name: "LangChain & LangGraph",
    logo: "https://raw.githubusercontent.com/langchain-ai/docs/main/src/images/brand/langchain-icon.png",
    category: "ai-frameworks",
    type: "Agent framework adapter",
    summary:
      "Connect LangChain and LangGraph to OpenUI through first-party server and stream adapters.",
    howItWorks:
      "The @openuidev/langchain package transforms LangGraph protocol-v2 events into AG-UI on the server, then agUIAdapter() consumes the stream in AgentInterface. If your backend already returns native LangGraph named-event SSE, use the bundled langGraphAdapter() and langGraphMessageFormat instead.",
    install: "npm install @openuidev/langchain @langchain/langgraph",
    links: [
      ...packageLinks("@openuidev/langchain", "langchain", "/docs/api-reference/langchain"),
      {
        label: "Stream adapters",
        href: "/docs/agent/reference/adapters-and-formats#langgraphadapter",
        kind: "Docs",
      },
      exampleLink("langchain-chat"),
    ],
  },
  {
    slug: "langflow",
    name: "Langflow",
    logo: "https://raw.githubusercontent.com/langflow-ai/langflow/main/docs/static/img/langflow-icon-black-transparent.svg",
    category: "ai-frameworks",
    type: "Visual agent framework adapter",
    summary:
      "Connect Langflow workflows to OpenUI through Workflow API v2 and Langflow's native AG-UI stream.",
    howItWorks:
      "The @openuidev/langflow package maps OpenUI thread, follow-up, and form turns to Langflow workflow inputs and session ids. Langflow runs the flow and emits native AG-UI SSE, which agUIAdapter() consumes in AgentInterface.",
    install: "npm install @openuidev/langflow",
    links: [
      ...packageLinks("@openuidev/langflow", "langflow", "/docs/api-reference/langflow"),
      { label: "Langflow", href: "https://www.langflow.org", kind: "Website" },
    ],
  },
  {
    slug: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    logo: "/integration-logos/vercel.svg",
    category: "ai-frameworks",
    type: "AI SDK adapter",
    summary:
      "Connect Vercel AI SDK UIMessage streams to OpenUI with OpenUI's bundled first-party adapter and message format.",
    howItWorks:
      "Return the UIMessage SSE produced by streamText().toUIMessageStreamResponse(), then use vercelAIAdapter() with vercelAIMessageFormat in AgentInterface. OpenUI validates AI SDK v6 or v7 chunks and maps streamed text, tool inputs, tool results, multi-step lifecycles, and errors into AG-UI events.",
    install: "npm install @openuidev/react-ui ai",
    links: [
      {
        label: "Vercel AI adapter",
        href: "/docs/agent/reference/adapters-and-formats#vercelaiadapter",
        kind: "Docs",
      },
      ...packageLinks("@openuidev/react-headless", "react-headless"),
      exampleLink("vercel-ai-chat"),
      { label: "AI SDK", href: "https://ai-sdk.dev", kind: "Website" },
    ],
  },
  {
    slug: "google-adk",
    name: "Google ADK",
    logo: "/integration-logos/google.svg",
    category: "ai-frameworks",
    type: "Agent SDK",
    summary:
      "Bridge Google ADK for TypeScript run events into AgentInterface with tools and multi-turn sessions.",
    howItWorks:
      "A Google ADK Agent and FunctionTool run in a Next.js route. ADK runAsync events are converted into streaming chat-completion chunks that OpenUI's adapter parses and renders.",
    links: [
      exampleLink("google-adk"),
      { label: "Google ADK", href: "https://github.com/google/adk-js", kind: "GitHub" },
    ],
  },
  {
    slug: "mastra",
    name: "Mastra",
    logo: "/integration-logos/mastra.svg",
    category: "ai-frameworks",
    type: "Agent framework",
    summary:
      "Connect a Mastra agent to AgentInterface over AG-UI and render its streamed output as typed interfaces.",
    howItWorks:
      "Mastra owns the agent and tools, the AG-UI transport serializes the run as SSE, and OpenUI's agUIAdapter drives AgentInterface and the component renderer on the client.",
    links: [
      exampleLink("mastra-chat"),
      {
        label: "Mastra integration guide",
        href: "https://mastra.ai/guides/build-your-ui/openui",
        kind: "Guide",
      },
      { label: "Mastra", href: "https://mastra.ai", kind: "Website" },
    ],
  },
  {
    slug: "assistant-ui",
    name: "assistant-ui",
    logo: "/integration-logos/assistant-ui.svg",
    category: "frontend-platforms",
    type: "Chat framework",
    summary:
      "Render streaming OpenUI programs as assistant-ui Tool UI while assistant-ui retains its conversation lifecycle.",
    howItWorks:
      "The @openuidev/assistant-ui toolkit registers display and human-input tools, generates matching model instructions, renders partial OpenUI Lang, and sends validated form actions back through assistant-ui's tool result flow.",
    install: "npm install @openuidev/assistant-ui @assistant-ui/react",
    links: [
      ...packageLinks("@openuidev/assistant-ui", "assistant-ui"),
      {
        label: "assistant-ui guide",
        href: "https://www.assistant-ui.com/docs/tools/openui",
        kind: "Guide",
      },
      {
        label: "Runnable example",
        href: "https://github.com/assistant-ui/assistant-ui/tree/main/examples/with-openui",
        kind: "Example",
      },
    ],
  },
  {
    slug: "ag-ui",
    name: "AG-UI",
    logo: "/integration-logos/ag-ui.svg",
    category: "ai-frameworks",
    type: "Agent protocol",
    summary:
      "Consume standard AG-UI event streams in OpenUI chat surfaces with the built-in agUIAdapter.",
    howItWorks:
      "Point fetchLLM or a direct ChatLLM implementation at an AG-UI SSE endpoint and use agUIAdapter() as the stream adapter. OpenUI maps supported lifecycle, text, tool, and error events into its chat runtime.",
    links: [
      {
        label: "Adapters and formats",
        href: "/docs/agent/reference/adapters-and-formats",
        kind: "Docs",
      },
      { label: "AG-UI documentation", href: "https://docs.ag-ui.com", kind: "Website" },
      { label: "AG-UI source", href: "https://github.com/ag-ui-protocol/ag-ui", kind: "GitHub" },
    ],
  },
  {
    slug: "grok-build",
    name: "Grok Build",
    logo: "https://media.x.ai/v1/website/spacexai-symbol-black-transparent-6435cf42.png",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "Use OpenUI as a generative UI frontend for persistent Grok Build coding-agent sessions.",
    howItWorks:
      "The maintained local harness talks to Grok Build through its official Agent Client Protocol stdio mode, injects the generated OpenUI rules, and maps reasoning, text, tools, and interactions into AG-UI events for AgentInterface. As shipped, it is an unauthenticated single-user harness and needs authentication, sandboxing, and a stricter permission policy before networked deployment.",
    links: [
      exampleLink("harnesses/grok-build", "OpenUI harness"),
      { label: "Grok Build", href: "https://github.com/xai-org/grok-build", kind: "GitHub" },
    ],
  },
  {
    slug: "vercel-eve",
    name: "Vercel Eve",
    logo: "https://raw.githubusercontent.com/vercel/eve/main/.github/assets/eve.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "Connect Vercel Eve's resumable agent sessions to OpenUI while preserving Eve's native runtime.",
    howItWorks:
      "The maintained harness delivers turns over Eve's native session protocol, resumes its event stream from a stored cursor, and translates Eve text, tool, and failure events into AG-UI for AgentInterface. The example uses an unauthenticated local Eve channel; a deployed version must configure channel authentication and appropriate tool permissions.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/agent-frameworks/vercel-eve",
        kind: "Guide",
      },
      exampleLink("harnesses/vercel-eve", "OpenUI harness"),
      { label: "Vercel Eve", href: "https://github.com/vercel/eve", kind: "GitHub" },
    ],
  },
  {
    slug: "pi-coding-agent",
    name: "Pi Coding Agent",
    logo: "/integration-logos/pi.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "Embed the Pi coding-agent SDK behind OpenUI and render its answers, reasoning, and tool activity.",
    howItWorks:
      "The maintained local harness embeds @earendil-works/pi-coding-agent in a Next.js route, injects the prompt generated from OpenUI's component library, and converts Pi text, reasoning, and tool events into an OpenAI-compatible stream consumed by openAIReadableStreamAdapter(). It exposes real filesystem and shell tools, so the shipped unauthenticated harness must not be exposed to a network as-is.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/harnesses/pi",
        kind: "Guide",
      },
      exampleLink("harnesses/pi-agent-harness", "OpenUI harness"),
      { label: "Pi", href: "https://pi.dev", kind: "Website" },
      { label: "Pi source", href: "https://github.com/earendil-works/pi", kind: "GitHub" },
    ],
  },

  {
    slug: "open-webui",
    name: "Open WebUI",
    logo: "https://raw.githubusercontent.com/open-webui/open-webui/main/backend/open_webui/static/favicon-96x96.png",
    category: "frontend-platforms",
    type: "AI platform",
    summary:
      "Render charts, forms, tables, cards, and follow-ups directly inside Open WebUI conversations.",
    howItWorks:
      "The plugin gives the model a render_openui tool and returns a self-contained HTML response. A sandboxed iframe loads the OpenUI browser bundle and renders the generated program inline.",
    links: [
      {
        label: "Plugin source",
        href: "https://github.com/thesysdev/openwebui-plugin",
        kind: "Plugin",
      },
      {
        label: "Install guide",
        href: "https://openwebui.com/posts/generative_ui_plugin_for_open_webui_6c017d62",
        kind: "Guide",
      },
      { label: "Open WebUI", href: "https://openwebui.com", kind: "Website" },
    ],
  },

  // Frontend frameworks and platforms.
  {
    slug: "lynx",
    name: "Lynx",
    logo: "/integration-logos/lynx.svg",
    category: "frontend-platforms",
    type: "Cross-platform runtime",
    summary:
      "Render streaming OpenUI Lang as cross-platform interfaces through Lynx's native rendering pipeline.",
    howItWorks:
      "@lynx-js/genui/openui incrementally parses OpenUI Lang, maps registered expressions to ReactLynx components, and renders them through Lynx's native pipeline while the host application owns its component definitions, tools, and actions.",
    install: "npm install @lynx-js/genui @lynx-js/react @lynx-js/lynx-ui",
    links: [
      {
        label: "OpenUI integration guide",
        href: "https://lynxjs.org/next/react/genui/openui.html",
        kind: "Guide",
      },
      {
        label: "npm package",
        href: "https://www.npmjs.com/package/@lynx-js/genui",
        kind: "npm",
      },
      {
        label: "Source code",
        href: "https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui",
        kind: "GitHub",
      },
      { label: "Lynx", href: "https://lynxjs.org", kind: "Website" },
    ],
  },
  {
    slug: "vue",
    name: "Vue 3",
    logo: "/integration-logos/vue.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "Define model-renderable Vue components and render streamed OpenUI Lang with @openuidev/vue-lang.",
    howItWorks:
      "Vue component definitions and Zod schemas form a shared library for prompt generation and rendering. The Vue Renderer updates progressively as OpenUI Lang arrives.",
    install: "npm install @openuidev/vue-lang",
    links: [
      ...packageLinks("@openuidev/vue-lang", "vue-lang"),
      exampleLink("vue-chat"),
      { label: "Vue", href: "https://vuejs.org", kind: "Website" },
    ],
  },
  {
    slug: "react-native",
    name: "React Native",
    logo: "/integration-logos/react.svg",
    category: "frontend-platforms",
    type: "Mobile framework",
    summary:
      "Render model-generated interfaces in a native mobile chat application with a dedicated component library.",
    howItWorks:
      "The reference project pairs a React Native chat app with a backend that prompts for OpenUI Lang. Native component definitions map the same structured response model to mobile views and actions.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/app-frameworks/react-native",
        kind: "Guide",
      },
      exampleLink("openui-react-native"),
      { label: "React Native", href: "https://reactnative.dev", kind: "Website" },
    ],
  },
  {
    slug: "svelte",
    name: "Svelte 5",
    logo: "/integration-logos/svelte.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "Define Svelte components, generate prompts, and render streamed OpenUI Lang with @openuidev/svelte-lang.",
    howItWorks:
      "Svelte component definitions and Zod schemas become one component library. The package generates the model prompt and its Renderer resolves streamed statements into Svelte components.",
    install: "npm install @openuidev/svelte-lang",
    links: [
      ...packageLinks("@openuidev/svelte-lang", "svelte-lang"),
      exampleLink("svelte-chat"),
      { label: "Svelte", href: "https://svelte.dev", kind: "Website" },
    ],
  },
];

export const integrations: Integration[] = integrationCatalog;

const popularityOrder: Record<IntegrationCategoryId, string[]> = {
  "ai-frameworks": [
    "langchain-langgraph",
    "vercel-ai-sdk",
    "pi-coding-agent",
    "mastra",
    "grok-build",
    "ag-ui",
    "vercel-eve",
    "google-adk",
  ],
  "design-systems": ["shadcn-ui", "material-ui", "handsontable", "react-email"],
  "frontend-platforms": ["vue", "svelte", "react-native", "lynx", "assistant-ui", "open-webui"],
};

export const integrationBySlug = new Map(integrations.map((item) => [item.slug, item]));

export function getIntegrationCategory(id: IntegrationCategoryId): IntegrationCategory {
  const category = integrationCategories.find((item) => item.id === id);
  if (!category) throw new Error(`Unknown integration category: ${id}`);
  return category;
}

export function getIntegrationsByCategory(id: IntegrationCategoryId): Integration[] {
  const order = popularityOrder[id];
  return integrations
    .filter((item) => item.category === id)
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export function getRelatedIntegrations(integration: Integration, limit = 3): Integration[] {
  return getIntegrationsByCategory(integration.category)
    .filter((item) => item.slug !== integration.slug)
    .slice(0, limit);
}
