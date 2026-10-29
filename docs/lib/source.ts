import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { blogPosts, docs, integrationGuides } from "fumadocs-mdx:collections/server";
import { BASE_URL } from "./site-url";

export { BASE_URL };

/** Docs sections served from their own top-level path, like `/cookbooks`, instead of under `/docs`. */
export const TOP_LEVEL_SECTIONS = ["cookbooks", "demos"];

export function isTopLevelSection(slugs: string[] | undefined): boolean {
  return TOP_LEVEL_SECTIONS.includes(slugs?.[0] ?? "");
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/docs",
  url: (slugs) => (isTopLevelSection(slugs) ? `/${slugs.join("/")}` : `/docs/${slugs.join("/")}`),
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const blog = loader({
  baseUrl: "/blog",
  source: toFumadocsSource(blogPosts, []),
});

/** Example and steps for each integration page, keyed by the integration's slug. */
export const integrationGuide = loader({
  baseUrl: "/integrations",
  source: toFumadocsSource(integrationGuides, []),
});

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");
  const description = page.data.description || `OpenUI documentation for ${page.data.title}.`;
  const canonicalUrl = new URL(page.url, BASE_URL);

  return `# ${page.data.title}

> ${description}

Source: ${canonicalUrl}

${processed.trim()}
`;
}
