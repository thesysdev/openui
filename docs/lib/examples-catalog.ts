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
  "harnesses/grok-build":
    "https://media.x.ai/v1/website/spacexai-symbol-black-transparent-6435cf42.png",
  "harnesses/pi": "/integration-logos/pi.svg",
  "miscellaneous/autofix": "/favicon.svg",
  "miscellaneous/handsontable":
    "https://raw.githubusercontent.com/handsontable/handsontable/develop/docs/public/favicon.png",
  "miscellaneous/html-artifact": "/favicon.svg",
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
};

export const REPO_EXAMPLES: RepoExample[] = catalog.examples.flatMap((example) => {
  // `repo:` paths live in another repository, outside `examples/`.
  if (example.path.startsWith("repo:")) return [];
  const [category, name] = example.path.split("/") as [ExampleCategoryId, string];

  return {
    name,
    title: example.title,
    description: example.description,
    category,
    sourceUrl: `${EXAMPLES_REPO_URL}/${example.path}`,
    guideUrl: EXAMPLE_GUIDES[example.path],
    logo: EXAMPLE_LOGOS[example.path] ?? "/favicon.svg",
    logoIsDark: DARK_LOGOS.has(example.path),
    env: example.env,
  };
});

export function getExamplesInCategory(category: ExampleCategoryId): RepoExample[] {
  return REPO_EXAMPLES.filter((example) => example.category === category);
}
