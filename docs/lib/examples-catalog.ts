import catalog from "../../examples/examples.json";
import type { ExampleCategoryId } from "./example-categories";

/**
 * The Examples tab is generated from `examples/examples.json`, the same manifest
 * `openui create --example` reads, so a new example appears in both places at once.
 */

export const EXAMPLES_REPO_URL = "https://github.com/thesysdev/openui/tree/main/examples";

/** Docs pages that walk through an example, keyed by its path in `examples/`. */
const EXAMPLE_GUIDES: Record<string, string> = {
  "agent-frameworks/langgraph-platform": "/docs/build-agents/frameworks/langgraph",
  "agent-frameworks/vercel-ai-sdk": "/docs/build-agents/frameworks/vercel-ai-sdk",
  "agent-frameworks/vercel-eve": "/docs/build-agents/frameworks/vercel-eve",
  "app-frameworks/angular": "/docs/api-reference/angular-lang",
  "design-systems/shadcn": "/docs/openui-lang/examples/design-systems/shadcn",
  "harnesses/pi": "/docs/build-agents/frameworks/pi",
  "miscellaneous/html-artifact": "/docs/agent/guides/open-ended-html",
  "miscellaneous/react-email": "/docs/openui-lang/examples/miscellaneous/react-email",
};

/**
 * Logo for each example's card, keyed by its path in `examples/`. Logos match the marketing
 * integrations page. Examples without an entry show the OpenUI mark.
 */
const EXAMPLE_LOGOS: Record<string, string> = {
  "agent-frameworks/google-adk": "/integration-logos/google.svg",
  "agent-frameworks/langgraph-platform":
    "https://raw.githubusercontent.com/langchain-ai/docs/main/src/images/brand/langchain-icon.png",
  "agent-frameworks/mastra": "/integration-logos/mastra.svg",
  "agent-frameworks/vercel-ai-sdk": "/integration-logos/vercel.svg",
  "agent-frameworks/vercel-eve":
    "https://raw.githubusercontent.com/vercel/eve/main/.github/assets/eve.svg",
  "app-frameworks/angular": "/integration-logos/angular.svg",
  "app-frameworks/fastapi": "/integration-logos/fastapi.svg",
  "app-frameworks/react-native": "/integration-logos/react.svg",
  "app-frameworks/svelte": "/integration-logos/svelte.svg",
  "app-frameworks/vue": "/integration-logos/vue.svg",
  "design-systems/material-ui": "/integration-logos/mui.svg",
  "design-systems/shadcn": "/integration-logos/shadcn-ui.svg",
  "harnesses/grok-build": "/brand-icons/xai.svg",
  "harnesses/pi": "/integration-logos/pi.svg",
  "miscellaneous/autofix": "/shiro-logo.svg",
  "miscellaneous/handsontable":
    "https://raw.githubusercontent.com/handsontable/handsontable/develop/docs/public/favicon.png",
  "miscellaneous/html-artifact": "/shiro-logo.svg",
  "miscellaneous/react-email": "/integration-logos/react-email.svg",
  "miscellaneous/supabase": "/integration-logos/supabase.svg",
};

/** Examples whose logo is a black mark, inverted in dark mode so it stays visible. */
const DARK_LOGOS = new Set([
  "agent-frameworks/mastra",
  "agent-frameworks/vercel-ai-sdk",
  "agent-frameworks/vercel-eve",
  "app-frameworks/angular",
  "design-systems/shadcn",
  "harnesses/grok-build",
  "harnesses/pi",
  "miscellaneous/react-email",
]);

export type RepoExample = {
  /** The name `openui create --example` accepts: the last segment of the path. */
  name: string;
  title: string;
  description: string;
  category: ExampleCategoryId;
  sourceUrl: string;
  guideUrl?: string;
  logo: string;
  logoIsDark: boolean;
  /** Environment setup used by the CLI while scaffolding. */
  env?: { file: string; key?: string };
  /** False for integrations without an example in this repo, so there is no `openui create` command. */
  runnable: boolean;
  /** Hosted outside the thesysdev GitHub org, shown with a "Community" tag. Set from `sourceUrl`. */
  community?: boolean;
  /** Examples in this repo and official integrations such as Lynx, listed first in each section. */
  firstParty: boolean;
  /** Shown with a "Featured" tag. */
  featured?: boolean;
};

/** Examples shown in a different section than their folder in `examples/`, keyed by path. */
const CATEGORY_OVERRIDES: Record<string, ExampleCategoryId> = {
  "app-frameworks/fastapi": "backend-frameworks",
};

export const REPO_EXAMPLES: RepoExample[] = catalog.examples.flatMap((example) => {
  // `repo:` paths live in another repository, outside `examples/`.
  if (example.path.startsWith("repo:")) return [];
  const [category, name] = example.path.split("/") as [ExampleCategoryId, string];

  return {
    name,
    title: example.title,
    description: example.description,
    category: CATEGORY_OVERRIDES[example.path] ?? category,
    sourceUrl: `${EXAMPLES_REPO_URL}/${example.path}`,
    guideUrl: EXAMPLE_GUIDES[example.path],
    logo: EXAMPLE_LOGOS[example.path] ?? "/shiro-logo.svg",
    logoIsDark: DARK_LOGOS.has(example.path),
    env: example.env,
    runnable: true,
    firstParty: true,
  };
});

/** Integrations listed on the integrations page that have no example in this repo. */
const EXTERNAL_INTEGRATIONS: RepoExample[] = [
  {
    name: "lynx",
    title: "Lynx",
    description:
      "Streaming OpenUI Lang rendered as cross-platform ReactLynx interfaces with @lynx-js/genui.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui",
    logo: "/integration-logos/lynx.svg",
    logoIsDark: true,
    runnable: false,
    firstParty: true,
    featured: true,
  },
  {
    name: "openui-channels",
    title: "Slack, Teams, Telegram & WhatsApp",
    description:
      "Compiles OpenUI Lang into native chat-platform messages such as Slack Block Kit cards, with buttons that update the card in place and charts rendered as images.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/rabisg/openui-channels",
    logo: "https://github.com/slackapi.png",
    logoIsDark: false,
    runnable: false,
    firstParty: true,
  },
  {
    name: "telegram-mini-app",
    title: "Telegram Mini App",
    description:
      "A reference Telegram Mini App that validates Telegram's signed launch data and renders OpenUI Cloud responses, charts, reports, and presentations in the OpenUI Agent Interface.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/thesysdev/telegram-mini-app",
    logo: "https://cdn.simpleicons.org/telegram",
    logoIsDark: false,
    runnable: false,
    firstParty: true,
  },
  {
    name: "openui-dotnet",
    title: ".NET",
    description:
      "OpenUI Lang for .NET: a streaming parser, validator, evaluator, and prompt builder, plus an ASP.NET Core endpoint for the stock React chat.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/DeepForgeTech/openui-dotnet",
    logo: "https://cdn.simpleicons.org/dotnet",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-swiftui",
    title: "SwiftUI",
    description:
      "A native SwiftUI renderer for iOS and macOS with the parser, streaming parser, evaluator, reactive state, and prompt generator ported from lang-core.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/martinmitrevski/OpenUI",
    logo: "https://cdn.simpleicons.org/swift",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "stream-chat-openui",
    title: "Stream Chat iOS",
    description:
      "StreamChatOpenUI, an OpenUI Lang 1.0 renderer in Stream's iOS chat SDK that shows AI replies as native SwiftUI components. Unreleased, on develop.",
    category: "app-frameworks",
    sourceUrl:
      "https://github.com/GetStream/stream-chat-swift/tree/develop/Sources/StreamChatOpenUI",
    logo: "https://github.com/GetStream.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-lang-flutter",
    title: "Flutter (openui_lang)",
    description:
      "A pure-Dart Flutter renderer on pub.dev for OpenUI Lang 1.0 and the full GenUI component library, aligned with @openuidev/react-ui.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/titanseason/openui-flutter",
    logo: "https://cdn.simpleicons.org/flutter",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-flutter",
    title: "Flutter (openui_flutter)",
    description:
      "A Flutter port of OpenUI: streaming OpenUI Lang in, Flutter widgets out, with component libraries and prompts defined in Dart.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/mtwichel/openui_flutter",
    logo: "https://cdn.simpleicons.org/flutter",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "harmony-openui",
    title: "HarmonyOS",
    description:
      "Renders OpenUI Lang as native HarmonyOS ArkUI interfaces with the official OpenUI parser, and returns user actions to the host app.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/hreyulog/harmony-openui",
    logo: "https://cdn.simpleicons.org/harmonyos",
    logoIsDark: true,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-rs",
    title: "Rust",
    description:
      "An engine-agnostic Rust runtime for OpenUI Lang on docs.rs, whose output any renderer can draw: a game engine, a native toolkit, a terminal, or a web page.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/voxell-tech/openui-rs",
    logo: "https://cdn.simpleicons.org/rust",
    logoIsDark: true,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-elixir",
    title: "Elixir (openui_lang)",
    description:
      "A zero-dependency Elixir parser, streaming engine, evaluator, schema validator, and prompt generator for OpenUI Lang 1.0.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/boxxxie/openui_lang",
    logo: "https://cdn.simpleicons.org/elixir",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-rails",
    title: "Rails",
    description:
      "OpenUI Lang for Rails and Hotwire: parses responses against a component library defined in Ruby and renders each component with an ERB partial.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/OverskillDev/openui-rails",
    logo: "https://cdn.simpleicons.org/rubyonrails",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "pi-openui",
    title: "Terminal (pi)",
    description:
      "Interactive dashboards, charts, diagrams, and maps drawn in the terminal for the pi coding agent, from OpenUI Lang the agent writes.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/newtonapple/pi-openui",
    logo: "/integration-logos/pi.svg",
    logoIsDark: true,
    runnable: false,
    firstParty: false,
  },
  {
    name: "agno",
    title: "Agno",
    description:
      "An Agno AgentOS agent streamed over AG-UI into OpenUI's AgentInterface, with charts, follow-up actions, and forms that submit back to the same conversation.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/agno-agi/agno/tree/main/cookbook/05_agent_os/16_agui/openui",
    logo: "https://github.com/agno-agi.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "trueforge",
    title: "TrueForge",
    description:
      "TrueFoundry's open-source agent harness ships OpenUI as a built-in capability, and its UI kit renders OpenUI Lang blocks in chat.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/truefoundry/trueforge",
    logo: "https://github.com/truefoundry.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "awaken",
    title: "Awaken",
    description:
      "A chat client for the Awaken Rust agent runtime that renders OpenUI over AG-UI as a full-screen chat, a copilot sidebar, or a bottom tray.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/awakenworks/awaken/tree/main/examples/openui-chat",
    logo: "https://github.com/awakenworks.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "skybridge",
    title: "Skybridge",
    description:
      "An MCP App for ChatGPT and Claude that streams the model's OpenUI Lang into a Skybridge view and renders it with OpenUI's React components.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/alpic-ai/skybridge/tree/main/examples/openui-generative-ui",
    logo: "https://github.com/alpic-ai.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "oracle-ai-database",
    title: "Oracle AI Database",
    description:
      "Oracle's reference data chat: the model plans SQL, vector, or hybrid retrieval over Oracle AI Database 26ai and answers with charts, tables, and KPI cards.",
    category: "miscellaneous",
    sourceUrl:
      "https://github.com/oracle-devrel/oracle-ai-developer-hub/tree/main/apps/generative-ui-data-chat",
    logo: "https://github.com/oracle.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-elixir-liveview",
    title: "Elixir (openui)",
    description:
      "An Elixir implementation of OpenUI Lang 1.0 on Hex with a Phoenix LiveView renderer. It passes the 1.0 conformance suite.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/ideia4it/openui",
    logo: "https://cdn.simpleicons.org/elixir",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "inglorious-openui",
    title: "Inglorious Web",
    description:
      "@inglorious/openui renders OpenUI Lang from a model with Inglorious UI components, streamed into an Inglorious Web app.",
    category: "app-frameworks",
    sourceUrl: "https://github.com/IngloriousCoderz/inglorious-forge",
    logo: "https://github.com/IngloriousCoderz.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "volcengine-chatkit",
    title: "Volcengine ChatKit",
    description:
      "ChatKit, Volcengine's chat UI and headless runtime for agent apps, renders OpenUI messages through its optional @volcengine/chatkit/openui entry point.",
    category: "frontend-platforms",
    sourceUrl: "https://www.npmjs.com/package/@volcengine/chatkit",
    logo: "https://github.com/volcengine.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "open-wa-openui",
    title: "WhatsApp (open-wa)",
    description:
      "open-wa's OpenUI adapter gives agent plugins one component catalogue that renders in its Neo chat and compiles to native WhatsApp text and interactive messages.",
    category: "app-frameworks",
    sourceUrl:
      "https://github.com/open-wa/wa-automate-nodejs/blob/master/packages/plugin-sdk/src/openui.ts",
    guideUrl: "https://openwa.dev/docs/guides/openui",
    logo: "https://cdn.simpleicons.org/whatsapp",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "genui-py",
    title: "Python (genui-py)",
    description:
      "A Python package on PyPI that generates the prompt, validates, and streams OpenUI Lang from any Python agent to a React app.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/AD1TYA03/genui",
    logo: "https://cdn.simpleicons.org/python",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "laravel-openui",
    title: "Laravel",
    description:
      "Connects OpenUI to the Laravel AI SDK: system prompt injection, component library management, and streamed OpenUI Lang responses.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/RanaMoizHaider/laravel-openui",
    logo: "https://cdn.simpleicons.org/laravel",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-convex",
    title: "Convex",
    description:
      "Durable, reactive state for OpenUI interfaces on Convex, so a generated form keeps its state across reloads and stays in sync across clients.",
    category: "backend-frameworks",
    sourceUrl: "https://github.com/aayush962/openui-convex",
    logo: "https://cdn.simpleicons.org/convex",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "kamod-openui",
    title: "Kamod UI",
    description:
      "@kamod-ch/openui, the OpenUI adapter for Kamod UI: a typed component library that lets a model compose only approved Kamod UI components in Preact.",
    category: "design-systems",
    sourceUrl: "https://github.com/kamod-ch/kamod-ui/tree/main/packages/openui",
    logo: "https://github.com/kamod-ch.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "k8ordo-ui",
    title: "k8ordo",
    description:
      "k8o's React component library with semantic design tokens and built-in adapters that let a model generate UI from its components with OpenUI.",
    category: "design-systems",
    sourceUrl: "https://github.com/k35o/k8ordo",
    logo: "https://github.com/k35o.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "noetic",
    title: "Noetic",
    description:
      "Noetic's @noetic-tools/openui package turns a component library into a streaming output codec, so a model step builds its system prompt from your components and returns the rendered document.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/mattapperson/noetic/tree/main/packages/openui",
    guideUrl: "https://noetic.tools/docs/framework/generative-ui",
    logo: "https://noetic.tools/favicon.svg",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "open-webui-plugin",
    title: "Open WebUI",
    description: "Bring OpenUI-rendered interactive responses into Open WebUI chat workflows.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/thesysdev/openwebui-plugin",
    guideUrl: "https://openwebui.com/posts/generative_ui_plugin_for_open_webui_6c017d62",
    logo: "https://github.com/open-webui.png",
    logoIsDark: false,
    runnable: false,
    firstParty: true,
  },
  {
    name: "qwenpaw-openui",
    title: "QwenPaw",
    description:
      "A QwenPaw plugin that brings tables, charts, forms, and sliders into chat, themed to match QwenPaw, so you can adjust inputs and send your choices back.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/agentscope-ai/QwenPaw/tree/main/plugins/bundle/qwenpaw-openui",
    logo: "https://github.com/agentscope-ai.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "genui-vscode",
    title: "VS Code (Genui)",
    description:
      "Preview '.openui' files live in VS Code and Open VSX-compatible editors while agents write OpenUI Lang.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/ginaphi/genui",
    guideUrl: "https://marketplace.visualstudio.com/items?itemName=Ginaphi.generative-ui",
    logo: "https://raw.githubusercontent.com/ginaphi/genui/main/images/icon.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-plotly",
    title: "Plotly",
    description:
      "A Next.js generative UI chat scaffold, or a drop-in <PlotlyChat /> for existing apps, with 47 typed Plotly chart components.",
    category: "miscellaneous",
    sourceUrl: "https://www.npmjs.com/package/@vishxrad/openui-plotly",
    logo: "https://cdn.simpleicons.org/plotly",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "openui-forge",
    title: "OpenUI Forge",
    description:
      "An agent skill that adds OpenUI to existing projects, with backend templates for Python, Go, Rust, C#, Java, Ruby, PHP, and Elixir.",
    category: "miscellaneous",
    sourceUrl: "https://github.com/OthmanAdi/openui-forge",
    guideUrl: "https://spruce-prism-8yya.here.now/",
    logo: "https://raw.githubusercontent.com/OthmanAdi/openui-forge/main/media/logo.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "assistant-ui",
    title: "assistant-ui",
    description:
      "Renders streaming OpenUI programs as assistant-ui Tool UI while assistant-ui keeps control of the conversation and tool lifecycle.",
    category: "frontend-platforms",
    sourceUrl: "https://github.com/thesysdev/openui/tree/main/packages/assistant-ui",
    guideUrl: "/docs/build-agents/assistant-ui",
    logo: "/integration-logos/assistant-ui.svg",
    logoIsDark: true,
    runnable: false,
    firstParty: true,
  },
  {
    name: "sage",
    title: "Sage",
    description:
      "Sage Desktop parses OpenUI Lang with the official parser and renders it with a native Flutter renderer for streaming interactive interfaces.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/ZHangZHengEric/Sage",
    guideUrl: "https://github.com/ZHangZHengEric/Sage/blob/v2.1.0/docs/en/applications/DESKTOP.md",
    logo: "https://raw.githubusercontent.com/ZHangZHengEric/Sage/main/assets/logo.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
  {
    name: "everruns",
    title: "Everruns",
    description:
      "The Everruns durable agent harness ships OpenUI as a built-in capability, so agents can render charts, tables, forms, and cards in chat.",
    category: "agent-frameworks",
    sourceUrl: "https://github.com/everruns/everruns",
    guideUrl: "https://github.com/everruns/everruns/blob/main/knowledge/ui/openui.md",
    logo: "https://github.com/everruns.png",
    logoIsDark: false,
    runnable: false,
    firstParty: false,
  },
];

export function getExamplesInCategory(category: ExampleCategoryId): RepoExample[] {
  return [...REPO_EXAMPLES, ...EXTERNAL_INTEGRATIONS]
    .filter((example) => example.category === category)
    .map((example) => ({
      ...example,
      community: !example.sourceUrl.startsWith("https://github.com/thesysdev/"),
    }));
}

/**
 * A section's cards in page order: official first, then featured, then the rest of the community.
 * Within each group, first-party cards lead, then the longest description, so cards sharing a row
 * have similar heights.
 */
export function getSortedExamplesInCategory(category: ExampleCategoryId): RepoExample[] {
  const rank = (example: RepoExample) => (!example.community ? 0 : example.featured ? 1 : 2);
  return getExamplesInCategory(category).sort(
    (a, b) =>
      rank(a) - rank(b) ||
      Number(b.firstParty) - Number(a.firstParty) ||
      b.description.length - a.description.length,
  );
}

/** Whether a link points at a card on the Integrations page, so the Demos page can skip it. */
export function isIntegrationUrl(href: string): boolean {
  return [...REPO_EXAMPLES, ...EXTERNAL_INTEGRATIONS].some(
    (example) =>
      href.startsWith(example.sourceUrl) ||
      (example.guideUrl !== undefined && href.startsWith(example.guideUrl)),
  );
}
