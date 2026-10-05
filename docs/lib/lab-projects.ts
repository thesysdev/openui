import {
  Bot,
  Code2,
  MonitorSmartphone,
  Package,
  PlugZap,
  Server,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

/** Official and community projects built around OpenUI, shown on /lab and /docs/examples. */

export type ProjectStatus = "Official" | "Community";

export interface ProjectLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface ProjectItem {
  name: string;
  description: string;
  type: string;
  status: ProjectStatus;
  accent: "blue" | "green" | "purple" | "orange" | "slate";
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  links: ProjectLink[];
}

export const labProjects: ProjectItem[] = [
  {
    name: "Curio",
    description:
      "An open-source reading companion that uses OpenUI generative UI to explore words and phrases without leaving the text.",
    type: "App",
    status: "Community",
    accent: "green",
    icon: MonitorSmartphone,
    links: [
      { label: "GitHub", href: "https://github.com/JoseEstevez520/curio", external: true },
      { label: "Website", href: "https://curio-landing-phi.vercel.app", external: true },
    ],
  },
  {
    name: "OpenUI Forge",
    description:
      "A coding-assistant toolkit for generating and wiring OpenUI integrations across common AI stacks.",
    type: "Tool",
    status: "Community",
    accent: "purple",
    icon: Wrench,
    links: [
      { label: "GitHub", href: "https://github.com/OthmanAdi/openui-forge", external: true },
      { label: "Website", href: "https://spruce-prism-8yya.here.now/", external: true },
    ],
  },
  {
    name: "GAIA",
    description:
      "A proactive personal AI assistant for inboxes, calendars, tools, and workflows built with OpenUI.",
    type: "App",
    status: "Community",
    accent: "green",
    icon: Bot,
    links: [
      { label: "GitHub", href: "https://github.com/theexperiencecompany/gaia", external: true },
      { label: "Website", href: "https://heygaia.io/", external: true },
    ],
  },
  {
    name: "Noetic",
    description:
      "An agent framework integration for returning OpenUI interfaces through a streaming output codec, durable surface layer, and transport.",
    type: "Framework",
    status: "Community",
    accent: "orange",
    icon: Sparkles,
    links: [
      {
        label: "Docs",
        href: "https://noetic.tools/docs/framework/generative-ui",
        external: true,
      },
    ],
  },
  {
    name: "Field Theory UI",
    description:
      "A local-first web interface for exploring X/Twitter bookmarks with OpenUI-powered interactive dashboards.",
    type: "App",
    status: "Community",
    accent: "green",
    icon: MonitorSmartphone,
    links: [
      { label: "GitHub", href: "https://github.com/Gitmaxd/field-theory-ui", external: true },
    ],
  },
  {
    name: "Open WebUI Plugin",
    description: "Bring OpenUI-rendered interactive responses into Open WebUI chat workflows.",
    type: "Plugin",
    status: "Community",
    accent: "blue",
    icon: PlugZap,
    links: [
      { label: "GitHub", href: "https://github.com/thesysdev/openwebui-plugin", external: true },
      {
        label: "Guide",
        href: "https://openwebui.com/posts/generative_ui_plugin_for_open_webui_6c017d62",
        external: true,
      },
      { label: "Open", href: "https://github.com/open-webui/open-webui", external: true },
    ],
  },
  {
    name: "Ollama Integration",
    description:
      "Use OpenUI with local Ollama models through an OpenAI-compatible route or an Open WebUI workflow.",
    type: "Provider",
    status: "Community",
    accent: "green",
    icon: Bot,
    links: [
      {
        label: "Article",
        href: "https://dev.to/shogun444/i-tested-openui-with-ollama-models-heres-what-actually-worked-45m7",
        external: true,
      },
      {
        label: "GitHub",
        href: "https://github.com/shogun444/openui-ollama-localsetup",
        external: true,
      },
      { label: "Ollama", href: "https://ollama.com", external: true },
    ],
  },
  {
    name: "Genui VS Code Extension",
    description:
      "Preview '.openui' files live in VS Code and Open VSX-compatible editors while agents write OpenUI Lang.",
    type: "Extension",
    status: "Community",
    accent: "blue",
    icon: Code2,
    links: [
      {
        label: "VS Code",
        href: "https://marketplace.visualstudio.com/items?itemName=Ginaphi.generative-ui",
        external: true,
      },
      {
        label: "Open VSX",
        href: "https://open-vsx.org/extension/ginaphi/generative-ui",
        external: true,
      },
    ],
  },
  {
    name: "OpenClaw OS Plugin",
    description: "Use OpenUI inside OpenClaw OS through the external OpenClaw plugin package.",
    type: "Plugin",
    status: "Official",
    accent: "orange",
    icon: Sparkles,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openclaw-os/tree/main/packages/claw-plugin",
        external: true,
      },
      { label: "Website", href: "/openclaw-os", external: true },
    ],
  },
  {
    name: "AppLess",
    description:
      "An experimental no-app phone experience that streams OpenUI-generated native interfaces on iOS and Android.",
    type: "App",
    status: "Official",
    accent: "green",
    icon: MonitorSmartphone,
    links: [{ label: "GitHub", href: "https://github.com/thesysdev/appless", external: true }],
  },
  {
    name: "OpenUI Plotly",
    description:
      "Scaffold a Next.js generative UI chat with typed Plotly chart components for data-heavy responses.",
    type: "Package",
    status: "Community",
    accent: "purple",
    icon: Package,
    links: [
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@vishxrad/openui-plotly?activeTab=readme",
        external: true,
      },
    ],
  },
  {
    name: "Vue Lang",
    description: "Define OpenUI component libraries and render OpenUI Lang responses in Vue 3.",
    type: "Framework",
    status: "Official",
    accent: "green",
    icon: Code2,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/packages/vue-lang",
        external: true,
      },
      { label: "npm", href: "https://www.npmjs.com/package/@openuidev/vue-lang", external: true },
    ],
  },
  {
    name: "Svelte Lang",
    description: "Define OpenUI component libraries and render OpenUI Lang responses in Svelte 5.",
    type: "Framework",
    status: "Official",
    accent: "orange",
    icon: Code2,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/packages/svelte-lang",
        external: true,
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@openuidev/svelte-lang",
        external: true,
      },
    ],
  },
  {
    name: "React Native Example",
    description: "A mobile chat example showing OpenUI rendered in a React Native application.",
    type: "Example",
    status: "Official",
    accent: "slate",
    icon: MonitorSmartphone,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/examples/app-frameworks/react-native",
        external: true,
      },
      {
        label: "Docs",
        href: "/docs/openui-lang/examples/app-frameworks/react-native",
        external: true,
      },
    ],
  },
  {
    name: "FastAPI Backend Example",
    description:
      "A full-stack example streaming OpenUI Lang from a Python FastAPI backend into a Vite + React frontend.",
    type: "Example",
    status: "Community",
    accent: "green",
    icon: Server,
    links: [
      {
        label: "GitHub",
        href: "https://github.com/thesysdev/openui/tree/main/examples/app-frameworks/fastapi",
        external: true,
      },
    ],
  },
  {
    name: "AI Native Dashboard",
    description:
      "An OpenUI-powered infinite canvas for generating movable, resizable dashboard widgets from natural language.",
    type: "App",
    status: "Community",
    accent: "green",
    icon: Sparkles,
    links: [
      { label: "GitHub", href: "https://github.com/jaibhasin/AI-Native-Dashboard", external: true },
    ],
  },
];
