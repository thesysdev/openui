export type IntegrationCategoryId = "ai-frameworks" | "design-systems" | "frontend-platforms";

export interface IntegrationLink {
  label: string;
  href: string;
  kind: "Docs" | "Example" | "Guide" | "GitHub" | "npm" | "Website" | "Plugin";
}

export interface IntegrationStep {
  title: string;
  description: string;
}

export interface Integration {
  slug: string;
  name: string;
  logo: string;
  category: IntegrationCategoryId;
  type: string;
  summary: string;
  howItWorks: string;
  steps: IntegrationStep[];
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
    steps: [
      {
        title: "Wrap your shadcn/ui components",
        description:
          "Register each component with defineComponent and a Zod prop schema, then combine them with createLibrary. The example library covers 45+ components, including cards, tables, charts, forms, and dialogs.",
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on the library file. The chat route passes that spec to generateSystemPrompt({ cloud: true }), so the model can only call components the client can render.",
      },
      {
        title: "Render in AgentInterface",
        description:
          "Pass the library to AgentInterface as componentLibrary and parse the Chat Completions stream with openAIAdapter(). Each streamed node renders as a shadcn/ui component.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/openui-lang/examples/design-systems/shadcn",
        kind: "Guide",
      },
      exampleLink("design-systems/shadcn"),
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
    steps: [
      {
        title: "Map MUI components to OpenUI",
        description:
          "Wrap Material UI components with defineComponent and Zod schemas, and export them through createLibrary. Charts use @mui/x-charts.",
      },
      {
        title: "Generate the library spec",
        description:
          "Run openui generate --spec on src/library.ts. The chat route sends that spec to OpenUI Cloud and runs app-owned tools with runChatToolLoop.",
      },
      {
        title: "Render inside your MUI theme",
        description:
          "Render AgentInterface with the MUI library inside your ThemeProvider, so generated components use the app's theme and light or dark mode.",
      },
    ],
    links: [
      exampleLink("design-systems/material-ui"),
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
    steps: [
      {
        title: "Share the table state",
        description:
          "Keep the table in a server-side store that both the grid and the chat route use. Edits made in Handsontable sync back to the server through POST /api/table.",
      },
      {
        title: "Give the model spreadsheet tools",
        description:
          "Expose tools such as get_table_data, update_cells, add_rows, and set_formula. After a write, the model responds with a SpreadsheetTable component.",
      },
      {
        title: "Sync results into the grid",
        description:
          "The Renderer draws SpreadsheetTable from the custom library, and the useSpreadsheetSync hook pushes the new data into the live Handsontable instance.",
      },
    ],
    links: [
      exampleLink("miscellaneous/handsontable"),
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
    steps: [
      {
        title: "Import the email library",
        description:
          "Use emailLibrary from @openuidev/react-email. It covers 44 email-safe components, including headers, feature grids, pricing cards, and checkout tables.",
      },
      {
        title: "Generate the email prompt",
        description:
          "Build the system prompt from emailLibrary and emailPromptOptions, so the model composes emails only from those components.",
      },
      {
        title: "Preview and export HTML",
        description:
          "Stream the response into Renderer from @openuidev/react-lang for a live preview, then convert the email to client-compatible HTML with @react-email/render.",
      },
    ],
    links: [
      ...packageLinks("@openuidev/react-email", "react-email", "/docs/api-reference/react-email"),
      exampleLink("miscellaneous/react-email"),
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
    steps: [
      {
        title: "Add the stream transformer",
        description:
          "Add openUIStreamTransformer from @openuidev/langchain/transformer to your graph's streamTransformers, and give the agent the generated OpenUI system prompt.",
      },
      {
        title: "Expose an AG-UI route",
        description:
          "Return createLangChainStreamResponse(request, options) from a server route. It starts a protocol-v2 run and relays the output as AG-UI SSE while the API key and deployment URL stay on the server.",
      },
      {
        title: "Connect AgentInterface",
        description:
          "Point fetchLLM at the route with agUIAdapter(). If your backend already returns native LangGraph named-event SSE, use langGraphAdapter() with langGraphMessageFormat instead.",
      },
    ],
    links: [
      ...packageLinks("@openuidev/langchain", "langchain", "/docs/api-reference/langchain"),
      {
        label: "Stream adapters",
        href: "/docs/agent/reference/adapters-and-formats#langgraphadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/agent/agent-runtimes/langgraph-platform",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/langgraph-platform"),
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
    steps: [
      {
        title: "Stream with streamText",
        description:
          "Call streamText with the generated OpenUI system prompt and your AI SDK tools, then return toUIMessageStreamResponse() from the route.",
      },
      {
        title: "Configure the adapter",
        description:
          "Create the client connection with fetchLLM({ streamAdapter: vercelAIAdapter(), messageFormat: vercelAIMessageFormat }).",
      },
      {
        title: "Render in AgentInterface",
        description:
          "Pass that llm to AgentInterface. Streamed text, tool inputs and results, and multi-step runs render in the chat as they arrive.",
      },
    ],
    links: [
      {
        label: "Vercel AI adapter",
        href: "/docs/agent/reference/adapters-and-formats#vercelaiadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/agent/agent-runtimes/vercel-ai-sdk",
        kind: "Guide",
      },
      ...packageLinks("@openuidev/react-headless", "react-headless"),
      exampleLink("agent-frameworks/vercel-ai-sdk"),
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
      "A Google ADK Agent and FunctionTool run in a Next.js route. The route maps ADK runAsync events to AG-UI SSE, which agUIAdapter() parses for AgentInterface.",
    steps: [
      {
        title: "Define the agent",
        description:
          "Create an ADK Agent with FunctionTool tools and use the generated OpenUI system prompt as its instruction. The example calls OpenUI Cloud through adk-llm-bridge's Custom() model adapter.",
      },
      {
        title: "Bridge events to AG-UI",
        description:
          "Run the agent with a Runner whose sessions are keyed by chat thread, and map text, functionCall, and functionResponse parts to AG-UI text and tool events.",
      },
      {
        title: "Render in AgentInterface",
        description:
          "Use fetchLLM with agUIAdapter() so AgentInterface renders the streamed OpenUI Lang and keeps multi-turn history per thread.",
      },
    ],
    links: [
      exampleLink("agent-frameworks/google-adk"),
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
    steps: [
      {
        title: "Build the Mastra agent",
        description:
          "Define the Agent with createTool tools and the generated OpenUI instructions. The example registers a custom Mastra gateway that routes model calls through OpenUI Cloud.",
      },
      {
        title: "Stream AG-UI events",
        description:
          "Wrap the agent with MastraAgent from @ag-ui/mastra in a server route and stream its AG-UI events to the browser as SSE.",
      },
      {
        title: "Render in AgentInterface",
        description:
          "Set agUIAdapter() as the stream adapter in the llm you pass to AgentInterface. Storage is optional and defaults to in-memory threads.",
      },
    ],
    links: [
      exampleLink("agent-frameworks/mastra"),
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
    steps: [
      {
        title: "Register the OpenUI toolkit",
        description:
          "Inside AssistantRuntimeProvider, add openuiIntegration.toolkit through AuiConfig and pass openuiIntegration.instructions to useAssistantInstructions.",
      },
      {
        title: "Let the model call the OpenUI tools",
        description:
          "present_openui renders complete cards, tables, and charts. prompt_openui renders forms and choices, and completes only when the user submits a result.",
      },
      {
        title: "Bring your own components",
        description:
          "Call createOpenUIIntegration with your own library so the tool schemas, model instructions, and renderers share one component vocabulary.",
      },
    ],
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
    steps: [
      {
        title: "Prompt your agent for OpenUI Lang",
        description:
          "Give the agent a system prompt generated from the same component library the client renders, so its text output is valid OpenUI Lang.",
      },
      {
        title: "Serve AG-UI events",
        description:
          "Expose the agent as an SSE endpoint that emits standard AG-UI run lifecycle, text message, tool call, and error events.",
      },
      {
        title: "Connect the adapter",
        description:
          "Point fetchLLM, or your own ChatLLM implementation, at that endpoint with agUIAdapter() as the stream adapter, and pass it to AgentInterface.",
      },
    ],
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
    steps: [
      {
        title: "Install and sign in to Grok Build",
        description:
          "Put the grok CLI on your PATH and run grok login. In non-interactive environments, set XAI_API_KEY instead.",
      },
      {
        title: "Start the harness on a workspace",
        description:
          "Launch the example with the project directory Grok Build should work in. It runs one grok agent stdio process and opens a separate ACP session for each OpenUI thread, with the OpenUI prompt added as session rules.",
      },
      {
        title: "Answer questions and approve plans in the browser",
        description:
          "Grok's clarifying questions and plan approvals appear as browser dialogs, and your answers go back over ACP so the same turn can continue.",
      },
    ],
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
    steps: [
      {
        title: "Add the OpenUI instructions",
        description:
          "Add an Eve instruction that injects the generated OpenUI Lang prompt when each session starts, alongside the agent's own identity and tools.",
      },
      {
        title: "Deliver turns over Eve's session protocol",
        description:
          "Send each turn through Eve's HTTP channel and store the session cursor per OpenUI thread, so the NDJSON event stream can resume where it stopped.",
      },
      {
        title: "Map events with eveAdapter()",
        description:
          "Use eveAdapter() from @openuidev/react-headless as the stream protocol of the llm you pass to AgentInterface. It converts Eve text, tool call, and failure events into AG-UI.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/agent/agent-runtimes/vercel-eve",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/vercel-eve", "OpenUI harness"),
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
    steps: [
      {
        title: "Embed the Pi SDK",
        description:
          "Create one Pi AgentSession per chat thread with createAgentSession in a Node.js route. Point its model at OpenUI Cloud and append the generated OpenUI prompt.",
      },
      {
        title: "Translate Pi events",
        description:
          "Write Pi text deltas to delta.content and its reasoning and tool executions to delta.tool_calls, one OpenAI chat.completion.chunk per NDJSON line.",
      },
      {
        title: "Render with the NDJSON adapter",
        description:
          "Use openAIReadableStreamAdapter() in AgentInterface with openuiLibrary to render the answers, reasoning, and tool activity.",
      },
    ],
    links: [
      {
        label: "Integration guide",
        href: "/docs/agent/agent-runtimes/pi",
        kind: "Guide",
      },
      exampleLink("harnesses/pi", "OpenUI harness"),
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
    steps: [
      {
        title: "Install the tool",
        description:
          "Import the plugin from the Open WebUI community site, or create a tool in Admin > Tools and paste in the plugin's tool.py.",
      },
      {
        title: "Enable it for a model",
        description:
          "Turn the tool on for the models or chats that should render UI. The model calls render_openui when an answer needs a chart, form, table, or card.",
      },
      {
        title: "Choose where the bundle loads from",
        description:
          "The cdn_base_url valve sets where the OpenUI browser bundle loads from. By default it is the latest @openuidev/browser-bundle on jsDelivr.",
      },
    ],
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
    steps: [
      {
        title: "Create the library",
        description:
          "Build a component library with createOpenUiLibrary() from @lynx-js/genui/openui, and import the renderer stylesheet from @lynx-js/genui/openui/styles/renderer.css.",
      },
      {
        title: "Generate the agent instructions",
        description:
          "On the server, build the system prompt with buildOpenUiSystemPrompt() from @lynx-js/genui/openui/prompt.",
      },
      {
        title: "Render with OpenUiRenderer",
        description:
          "Pass the full text received so far, not just the latest delta, to OpenUiRenderer with the library. Handle host-side effects such as navigation in onAction.",
      },
    ],
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
    steps: [
      {
        title: "Define Vue components",
        description:
          "Register each Vue component with defineComponent and a Zod prop schema, then combine them with createLibrary.",
      },
      {
        title: "Generate the system prompt",
        description:
          "Build the prompt from the same library with library.prompt(), or with generateSystemPrompt on the server, so the model only calls components the renderer knows.",
      },
      {
        title: "Render the stream",
        description:
          "Bind the streamed text to the Renderer component's response prop along with library and is-streaming. Handle button and form actions with on-action.",
      },
    ],
    links: [
      ...packageLinks("@openuidev/vue-lang", "vue-lang"),
      exampleLink("app-frameworks/vue"),
      { label: "Vue", href: "https://vuejs.org", kind: "Website" },
    ],
  },
  {
    slug: "angular",
    name: "Angular",
    logo: "/integration-logos/angular.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "Define model-renderable Angular components and render streamed OpenUI Lang with @openuidev/angular-lang.",
    howItWorks:
      "Standalone Angular components and Zod schemas form one library for prompt generation and rendering. The openui-renderer component resolves streamed statements into those components, and injection helpers give them access to actions, form state, and query loading.",
    install: "npm install @openuidev/angular-lang zod rxjs",
    steps: [
      {
        title: "Define Angular components",
        description:
          "Write standalone components that accept props, renderNode, and statementId inputs. Register each one with defineComponent and a Zod schema, then combine them with createLibrary.",
      },
      {
        title: "Generate the system prompt",
        description:
          "Call library.prompt() in the app, or share the Zod schemas with a Node backend and use @openuidev/lang-core so the server never imports Angular classes.",
      },
      {
        title: "Render with openui-renderer",
        description:
          "Import Renderer and bind response, library, and isStreaming. Handle the (action), (stateUpdate), and (error) outputs, and pass a toolProvider to run Query and Mutation calls.",
      },
    ],
    links: [
      ...packageLinks(
        "@openuidev/angular-lang",
        "angular-lang",
        "/docs/api-reference/angular-lang",
      ),
      exampleLink("app-frameworks/angular"),
      { label: "Angular", href: "https://angular.dev", kind: "Website" },
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
    steps: [
      {
        title: "Describe the components on the backend",
        description:
          "Define the component vocabulary (Card, Text, and chart components) with defineComponent and createLibrary in a Node-compatible file, with renderers set to null. The CLI compiles it into the system prompt.",
      },
      {
        title: "Stream plain text",
        description:
          "Return raw text/plain chunks from the chat route instead of SSE, so the mobile app can read the stream without a browser EventSource.",
      },
      {
        title: "Render native components",
        description:
          "Use Renderer from @openuidev/react-lang in the Expo app with a library that maps the same component names to native views and charts.",
      },
    ],
    links: [
      exampleLink("app-frameworks/react-native"),
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
    steps: [
      {
        title: "Define Svelte components",
        description:
          "Pair each .svelte component with defineComponent and a Zod prop schema, then combine them with createLibrary.",
      },
      {
        title: "Generate the system prompt",
        description:
          "Build the prompt from the same library with library.prompt(), or with generateSystemPrompt on the server, so the model only calls components the renderer knows.",
      },
      {
        title: "Render the stream",
        description:
          "Pass the streamed text, the library, and isStreaming to the Renderer component. It resolves each statement into a Svelte component as it arrives.",
      },
    ],
    links: [
      ...packageLinks("@openuidev/svelte-lang", "svelte-lang"),
      exampleLink("app-frameworks/svelte"),
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
  "frontend-platforms": [
    "vue",
    "angular",
    "svelte",
    "react-native",
    "lynx",
    "assistant-ui",
    "open-webui",
  ],
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
