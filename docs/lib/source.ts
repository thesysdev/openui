import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { blogPosts, docs } from "fumadocs-mdx:collections/server";

export const BASE_URL = "https://www.openui.com";

/** Docs sections served from their own top-level path, like `/cookbooks`, instead of under `/docs`. */
export const TOP_LEVEL_SECTIONS = ["cookbooks", "examples", "demos"];

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

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.webp"];

  return {
    segments,
    url: `/og/docs/${segments.join("/")}`,
  };
}

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
