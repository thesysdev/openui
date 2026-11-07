import type { PageMetadataInput } from "@/lib/page-metadata";

export type IntegrationCategoryId = "ai-frameworks" | "design-systems" | "frontend-platforms";

export interface IntegrationLink {
  label: string;
  href: string;
  kind: "Docs" | "Example" | "Guide" | "GitHub" | "npm" | "Website" | "Plugin";
}

export interface Integration {
  slug: string;
  name: string;
  /** Search title for <title>; the H1 keeps `name`. */
  seoTitle: string;
  seoDescription?: string;
  logo: string;
  category: IntegrationCategoryId;
  type: string;
  summary: string;
  howItWorks: string;
  install?: string;
  links: IntegrationLink[];
}

// Each page's example and steps live in content/integrations/<slug>.mdx.

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
    seoTitle: "shadcn/ui generative UI: let LLMs render your components",
    logo: "/integration-logos/shadcn-ui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "To add generative UI to shadcn/ui, wrap your shadcn/ui components in an OpenUI library and let the model compose them as streaming interfaces.",
    howItWorks:
      "Each shadcn component is registered with defineComponent and a Zod prop schema. createLibrary produces both the prompt vocabulary and the renderer mapping used by the example chat app.",
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
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
    seoTitle: "Material UI (MUI) generative UI with OpenUI",
    logo: "/integration-logos/mui.svg",
    category: "design-systems",
    type: "Design system",
    summary:
      "To add generative UI to Material UI, expose your Material UI components to a model through OpenUI without replacing your existing React design system.",
    howItWorks:
      "The example wraps Material UI components with OpenUI definitions, generates a constrained component prompt, and renders model output back into the same Material UI primitives.",
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
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
    seoTitle: "Handsontable generative UI with OpenUI",
    logo: "https://raw.githubusercontent.com/handsontable/handsontable/develop/docs/public/favicon.png",
    category: "design-systems",
    type: "Data grid",
    summary:
      "To add generative UI to Handsontable, connect a live Handsontable spreadsheet to OpenUI so agent tools can analyze and update its data.",
    howItWorks:
      "The maintained example shares table state between Handsontable and a custom OpenUI SpreadsheetTable component. Tool calls update the server-side data, and the rendered component synchronizes those results back into the live grid.",
    install:
      "npm install @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod handsontable @handsontable/react-wrapper hyperformula",
    links: [
      exampleLink("miscellaneous/handsontable"),
      { label: "Handsontable", href: "https://handsontable.com", kind: "Website" },
    ],
  },
  {
    slug: "react-email",
    name: "React Email",
    seoTitle: "Generate React Email templates with an LLM",
    logo: "/integration-logos/react-email.svg",
    category: "design-systems",
    type: "Email component library",
    summary:
      "To generate React Email templates with an LLM, use OpenUI's React Email component package to generate, preview, and export email-safe interfaces.",
    howItWorks:
      "@openuidev/react-email provides 44 OpenUI component definitions, an emailLibrary, and prompt rules. OpenUI Lang streams into a React Email preview, which @react-email/render can convert to email-compatible HTML.",
    install: "npm install @openuidev/react-email @openuidev/react-lang @react-email/render",
    links: [
      { label: "React Email API reference", href: "/docs/api-reference/react-email", kind: "Docs" },
      ...packageLinks("@openuidev/react-email", "react-email"),
      exampleLink("miscellaneous/react-email"),
      { label: "React Email", href: "https://react.email", kind: "Website" },
    ],
  },

  // AI frameworks, SDKs, and protocols.
  {
    slug: "langchain-langgraph",
    name: "LangChain & LangGraph",
    seoTitle: "LangGraph generative UI: a frontend for LangGraph agents",
    seoDescription:
      "Let your LangChain or LangGraph agent answer with interactive charts, tables and forms. Use OpenUI to build a visual frontend beyond text-only chat.",
    logo: "https://raw.githubusercontent.com/langchain-ai/docs/main/src/images/brand/langchain-icon.png",
    category: "ai-frameworks",
    type: "Agent framework adapter",
    summary:
      "To give a LangGraph or LangChain agent a generative UI frontend, add the @openuidev/langchain stream transformer to your graph and render the stream with OpenUI. The agent's responses show up as interactive components instead of plain text.",
    howItWorks:
      "The @openuidev/langchain package transforms LangGraph protocol-v2 events into AG-UI on the server, then agUIAdapter() consumes the stream on the client. If your backend already returns native LangGraph named-event SSE, use the bundled langGraphAdapter() and langGraphMessageFormat instead.",
    install: "npm install @openuidev/langchain @langchain/langgraph",
    links: [
      ...packageLinks("@openuidev/langchain", "langchain", "/docs/api-reference/langchain"),
      {
        label: "Stream adapters",
        href: "/docs/agent/reference/adapters-and-formats#langgraphadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/langgraph",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/langgraph-platform"),
    ],
  },
  {
    slug: "vercel-ai-sdk",
    name: "Vercel AI SDK",
    seoTitle: "Vercel AI SDK generative UI with OpenUI",
    seoDescription:
      "Build a Vercel AI SDK chat app that answers with more than text. Use OpenUI to stream interactive charts, tables and forms alongside the conversation.",
    logo: "/integration-logos/vercel.svg",
    category: "ai-frameworks",
    type: "AI SDK adapter",
    summary:
      "To add generative UI to a Vercel AI SDK app, return the UIMessage stream from streamText() and render it with OpenUI's vercelAIAdapter(). It works with AI SDK v6 and v7 and handles text, tool calls and multi-step runs.",
    howItWorks:
      "Return the UIMessage SSE produced by streamText().toUIMessageStreamResponse(), then use vercelAIAdapter() with vercelAIMessageFormat on the client. OpenUI validates AI SDK v6 or v7 chunks and maps streamed text, tool inputs, tool results, multi-step lifecycles, and errors into AG-UI events.",
    install: "npm install @openuidev/react-ui ai",
    links: [
      {
        label: "Vercel AI adapter",
        href: "/docs/agent/reference/adapters-and-formats#vercelaiadapter",
        kind: "Docs",
      },
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/vercel-ai-sdk",
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
    seoTitle: "Google ADK agent UI: render rich interfaces with OpenUI",
    seoDescription:
      "Build a frontend for your Google ADK agent with OpenUI. Let users explore its answers through interactive charts, tables and forms, not just text.",
    logo: "/integration-logos/google.svg",
    category: "ai-frameworks",
    type: "Agent SDK",
    summary:
      "To give a Google ADK agent a UI, run it in a server route that maps ADK run events to AG-UI, then render the stream with OpenUI. The example uses ADK for TypeScript with tools and multi-turn sessions.",
    howItWorks:
      "A Google ADK Agent and FunctionTool run in a Next.js route. The route maps ADK runAsync events to AG-UI SSE, which agUIAdapter() parses on the client.",
    install:
      "npm install @google/adk adk-llm-bridge @openuidev/react-ui @openuidev/react-headless @openuidev/react-lang @openuidev/lang-core zod",
    links: [
      exampleLink("agent-frameworks/google-adk"),
      { label: "Google ADK", href: "https://github.com/google/adk-js", kind: "GitHub" },
    ],
  },
  {
    slug: "mastra",
    name: "Mastra",
    seoTitle: "Mastra generative UI: build a frontend for Mastra agents",
    logo: "/integration-logos/mastra.svg",
    category: "ai-frameworks",
    type: "Agent framework",
    summary:
      "To build a UI for a Mastra agent, connect it to OpenUI over AG-UI and render its streamed output as typed interfaces.",
    howItWorks:
      "Mastra owns the agent and tools, the AG-UI transport serializes the run as SSE, and OpenUI's agUIAdapter drives the chat state and component renderer on the client.",
    install:
      "npm install @mastra/core @ag-ui/mastra @ag-ui/core @openuidev/react-ui @openuidev/react-lang @openuidev/lang-core zod",
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
    seoTitle: "assistant-ui + OpenUI: generative UI in assistant-ui chats",
    seoDescription:
      "Add interactive charts, tables and forms to your assistant-ui chat app with OpenUI, while keeping your existing chat interface and conversation flow.",
    logo: "/integration-logos/assistant-ui.svg",
    category: "frontend-platforms",
    type: "Chat framework",
    summary:
      "To add generative UI to an assistant-ui chat, register the @openuidev/assistant-ui toolkit so the model can render cards, tables, charts and forms as Tool UI. assistant-ui keeps control of the conversation lifecycle.",
    howItWorks:
      "The @openuidev/assistant-ui toolkit registers display and human-input tools, generates matching model instructions, renders partial OpenUI Lang, and sends validated form actions back through assistant-ui's tool result flow.",
    install: "npm install @openuidev/assistant-ui @assistant-ui/react",
    links: [
      { label: "assistant-ui guide", href: "/docs/build-agents/assistant-ui", kind: "Docs" },
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
    seoTitle: "AG-UI frontend: render AG-UI streams as generative UI",
    seoDescription:
      "Build a frontend for agents that use the AG-UI protocol. OpenUI lets them answer with interactive charts, tables and forms instead of text-only chat.",
    logo: "/integration-logos/ag-ui.svg",
    category: "ai-frameworks",
    type: "Agent protocol",
    summary:
      "OpenUI works as a frontend for AG-UI: point it at any AG-UI SSE endpoint and agUIAdapter() renders the event stream as generative UI. Text message, tool call, tool result and run error events are supported.",
    howItWorks:
      "Point fetchLLM or a direct ChatLLM implementation at an AG-UI SSE endpoint and use agUIAdapter() as the stream adapter. OpenUI maps text message, tool call, tool result and run error events into its chat runtime, and the run ends when the stream closes.",
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
    slug: "a2ui",
    name: "A2UI",
    seoTitle: "A2UI React renderer and client with OpenUI Lang",
    seoDescription:
      "Render A2UI v1.0 surfaces in React with OpenUI. Keep A2UI's protocol for surfaces, data models and actions, and stream components as compact OpenUI Lang.",
    logo: "https://a2ui.org/assets/favicon.svg",
    category: "ai-frameworks",
    type: "Agent UI protocol",
    summary:
      "@openuidev/a2ui implements the A2UI v1.0 surface lifecycle (createSurface, updateComponents, updateDataModel, actions and functions) with OpenUI Lang statements as the component payload, plus an optional React renderer.",
    howItWorks:
      "A2UI defines what an agent says about a UI surface; AG-UI or any other transport carries the messages. The @openuidev/a2ui client keeps A2UI's message envelopes but sends components as OpenUI Lang statements instead of A2UI component JSON, so surfaces stream in fewer tokens and render progressively. Both the agent and the renderer must agree on that payload format.",
    install: "npm install @openuidev/a2ui zod @openuidev/react-lang @openuidev/react-ui",
    links: [
      ...packageLinks("@openuidev/a2ui", "a2ui", "/docs/api-reference/a2ui"),
      {
        label: "OpenUI vs A2UI vs json-render",
        href: "/docs/openui-lang/comparison",
        kind: "Guide",
      },
      { label: "A2UI specification", href: "https://a2ui.org", kind: "Website" },
    ],
  },
  {
    slug: "grok-build",
    name: "Grok Build",
    seoTitle: "Grok Build generative UI with OpenUI",
    logo: "/brand-icons/xai.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Grok Build, use OpenUI as a generative UI frontend for persistent Grok Build coding-agent sessions.",
    howItWorks:
      "The maintained local harness talks to Grok Build through its official Agent Client Protocol stdio mode, injects the generated OpenUI rules, and maps reasoning, text, and tools into AG-UI events for AgentInterface. Grok's questions and plan approvals reach the browser over a separate interactions route and open as dialogs. As shipped, it is an unauthenticated single-user harness and needs authentication, sandboxing, and a stricter permission policy before networked deployment.",
    links: [
      exampleLink("harnesses/grok-build", "OpenUI harness"),
      { label: "Grok Build", href: "https://github.com/xai-org/grok-build", kind: "GitHub" },
    ],
  },
  {
    slug: "vercel-eve",
    name: "Vercel Eve",
    seoTitle: "Vercel Eve generative UI with OpenUI",
    logo: "https://raw.githubusercontent.com/vercel/eve/main/.github/assets/eve.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Vercel Eve, connect Eve's resumable agent sessions to OpenUI while preserving Eve's native runtime.",
    howItWorks:
      "The maintained harness delivers turns over Eve's native session protocol, resumes its event stream from a stored cursor, and translates Eve text, tool, and failure events into AG-UI for AgentInterface. The example uses an unauthenticated local Eve channel; a deployed version must configure channel authentication and appropriate tool permissions.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/vercel-eve",
        kind: "Guide",
      },
      exampleLink("agent-frameworks/vercel-eve", "OpenUI harness"),
      { label: "Vercel Eve", href: "https://github.com/vercel/eve", kind: "GitHub" },
    ],
  },
  {
    slug: "pi-coding-agent",
    name: "Pi Coding Agent",
    seoTitle: "Pi Coding Agent generative UI with OpenUI",
    logo: "/integration-logos/pi.svg",
    category: "ai-frameworks",
    type: "Coding agent",
    summary:
      "To build a UI for Pi Coding Agent, embed the Pi coding-agent SDK behind OpenUI and render its answers, reasoning, and tool activity.",
    howItWorks:
      "The maintained local harness embeds @earendil-works/pi-coding-agent in a Next.js route, injects the prompt generated from OpenUI's component library, and converts Pi text, reasoning, and tool events into an OpenAI-compatible stream consumed by openAIReadableStreamAdapter(). It exposes real filesystem and shell tools, so the shipped unauthenticated harness must not be exposed to a network as-is.",
    links: [
      {
        label: "Integration guide",
        href: "/docs/build-agents/frameworks/pi",
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
    seoTitle: "Open WebUI generative UI: rich interfaces in Open WebUI",
    logo: "https://raw.githubusercontent.com/open-webui/open-webui/main/backend/open_webui/static/favicon-96x96.png",
    category: "frontend-platforms",
    type: "AI platform",
    summary:
      "To add generative UI to Open WebUI, install the OpenUI plugin to render charts, forms, tables, cards, and follow-ups directly inside Open WebUI conversations.",
    howItWorks:
      "The plugin gives the model a render_openui tool and returns a self-contained HTML response. Open WebUI shows it as an inline iframe embed, which loads the OpenUI browser bundle and renders the generated program.",
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
    seoTitle: "Lynx generative UI with OpenUI",
    logo: "/integration-logos/lynx.svg",
    category: "frontend-platforms",
    type: "Cross-platform runtime",
    summary:
      "To add generative UI to Lynx, render streaming OpenUI Lang as cross-platform interfaces through Lynx's native rendering pipeline.",
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
    seoTitle: "Generative UI for Vue",
    seoDescription:
      "Build AI-powered interfaces in Vue 3 with OpenUI. Let AI use your Vue components to show interactive charts, tables and forms instead of plain text.",
    logo: "/integration-logos/vue.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Vue, register Vue 3 single-file components with Zod schemas and render streamed OpenUI Lang with @openuidev/vue-lang. The Renderer component takes the response as a prop, and composables such as useTriggerAction connect your components to it.",
    howItWorks:
      "Each SFC declares a props prop for the parsed values and a renderNode prop for nested content, and defineComponent pairs it with a Zod schema whose key order sets the positional arguments in OpenUI Lang. Renderer reports back through callback props such as onAction, onStateUpdate and onError rather than emitted events. Inside it, composables like useTriggerAction, useSetFieldValue and useIsStreaming give components access to actions, form state and streaming status.",
    install: "npm install @openuidev/vue-lang zod",
    links: [
      { label: "Vue Lang API reference", href: "/docs/api-reference/vue-lang", kind: "Docs" },
      ...packageLinks("@openuidev/vue-lang", "vue-lang"),
      exampleLink("app-frameworks/vue"),
      { label: "Vue", href: "https://vuejs.org", kind: "Website" },
    ],
  },
  {
    slug: "angular",
    name: "Angular",
    seoTitle: "Generative UI for Angular",
    seoDescription:
      "Build AI-powered interfaces in Angular with OpenUI. Let AI use your Angular components to show interactive charts, tables and forms instead of plain text.",
    logo: "/integration-logos/angular.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Angular, register standalone components with Zod schemas and render streamed OpenUI Lang with the <openui-renderer> component from @openuidev/angular-lang. Results reach your app through outputs such as (action) and (error).",
    howItWorks:
      "Each registered component accepts props, renderNode and statementId inputs, and defineComponent pairs its class with a Zod schema. The <openui-renderer> component takes response, library and isStreaming inputs, emits (action), (stateUpdate), (parseResult) and (error) outputs, and runs Query() and mutation calls through a toolProvider. Inside it, injection helpers such as injectTriggerAction and injectIsStreaming expose actions and streaming state, the latter as a Signal.",
    install: "npm install @openuidev/angular-lang zod rxjs",
    links: [
      {
        label: "Angular Lang API reference",
        href: "/docs/api-reference/angular-lang",
        kind: "Docs",
      },
      ...packageLinks("@openuidev/angular-lang", "angular-lang"),
      exampleLink("app-frameworks/angular"),
      { label: "Angular", href: "https://angular.dev", kind: "Website" },
    ],
  },
  {
    slug: "react-native",
    name: "React Native",
    seoTitle: "Generative UI for React Native",
    logo: "/integration-logos/react.svg",
    category: "frontend-platforms",
    type: "Mobile framework",
    summary:
      "To add generative UI to a React Native app, render model-generated interfaces in a native mobile chat application with a dedicated component library.",
    howItWorks:
      "The reference project pairs a React Native chat app with a backend that prompts for OpenUI Lang. Native component definitions map the same component names to mobile views and charts, and the app renders the streamed text as it arrives.",
    install: "npm install @openuidev/react-lang zod",
    links: [
      exampleLink("app-frameworks/react-native"),
      { label: "React Native", href: "https://reactnative.dev", kind: "Website" },
    ],
  },
  {
    slug: "svelte",
    name: "Svelte 5",
    seoTitle: "Generative UI for Svelte",
    seoDescription:
      "Build AI-powered interfaces in Svelte 5 with OpenUI. Let AI use your Svelte components to show interactive charts, tables and forms instead of plain text.",
    logo: "/integration-logos/svelte.svg",
    category: "frontend-platforms",
    type: "Native runtime",
    summary:
      "To build generative UI in Svelte, register Svelte 5 components with Zod schemas and render streamed OpenUI Lang with @openuidev/svelte-lang. Components read parsed values with $props() and render nested output through a renderNode snippet.",
    howItWorks:
      "Each .svelte component receives the parsed values as props and a renderNode snippet that it renders with {@render}. Renderer takes callbacks such as onAction and onStateUpdate as ordinary props, and context helpers like getTriggerAction and getIsStreaming give components access to actions and streaming state. The Svelte runtime covers components, simple actions and form state; unlike the React, Vue and Angular runtimes, it does not yet run Query() calls, Action([...]) step plans or $variable state.",
    install: "npm install @openuidev/svelte-lang zod",
    links: [
      { label: "Svelte Lang API reference", href: "/docs/api-reference/svelte-lang", kind: "Docs" },
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
    "a2ui",
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

export function getIntegrationPageMetadata(integration: Integration): PageMetadataInput {
  return {
    pathname: `/integrations/${integration.slug}`,
    title: { absolute: `${integration.seoTitle} | OpenUI` },
    description: integration.seoDescription ?? integration.summary,
    openGraph: { title: `${integration.name} × OpenUI`, description: integration.summary },
    // Remote logos are skipped so the build never fetches from third-party hosts.
    ogImage: { partnerLogo: integration.logo.startsWith("/") ? integration.logo : undefined },
  };
}
