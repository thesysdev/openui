import catalog from "../../examples/examples.json";
import type { ExampleCategoryId } from "./example-categories";

/**
 * The Examples tab is generated from `examples/examples.json`, the same manifest
 * `openui create --example` reads, so a new example appears in both places at once.
 */

export const EXAMPLES_REPO_URL = "https://github.com/thesysdev/openui/tree/main/examples";

/** Docs pages that walk through an example, keyed by its path in `examples/`. */
const EXAMPLE_GUIDES: Record<string, string> = {
  "agent-frameworks/langgraph-platform": "/docs/agent/agent-runtimes/langgraph-platform",
  "agent-frameworks/vercel-ai-sdk": "/docs/agent/agent-runtimes/vercel-ai-sdk",
  "agent-frameworks/vercel-eve": "/docs/agent/agent-runtimes/vercel-eve",
  "app-frameworks/angular": "/docs/api-reference/angular-lang",
  "design-systems/shadcn": "/docs/openui-lang/examples/design-systems/shadcn",
  "harnesses/pi": "/docs/agent/agent-runtimes/pi",
  "miscellaneous/html-artifact": "/docs/agent/guides/open-ended-html",
  "miscellaneous/react-email": "/docs/openui-lang/examples/miscellaneous/react-email",
};

export type RepoExample = {
  /** The name `openui create --example` accepts: the last segment of the path. */
  name: string;
  title: string;
  description: string;
  category: ExampleCategoryId;
  sourceUrl: string;
  guideUrl?: string;
  /** The key the CLI asks for while scaffolding. Omitted when the example needs several. */
  envKey?: string;
};

export const REPO_EXAMPLES: RepoExample[] = catalog.examples.map((example) => {
  const [category, name] = example.path.split("/") as [ExampleCategoryId, string];

  return {
    name,
    title: example.title,
    description: example.description,
    category,
    sourceUrl: `${EXAMPLES_REPO_URL}/${example.path}`,
    guideUrl: EXAMPLE_GUIDES[example.path],
    envKey: example.envKey,
  };
});

export function getExamplesInCategory(category: ExampleCategoryId): RepoExample[] {
  return REPO_EXAMPLES.filter((example) => example.category === category);
}
