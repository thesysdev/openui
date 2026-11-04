import type { CardLinkItem, ShowcaseItem } from "@/components/showcase/cards";
import { FEATURED_PROJECTS, PLAYGROUND } from "./demo-projects";
import { EXAMPLE_CATEGORIES, type ExampleCategoryId } from "./example-categories";
import { getSortedExamplesInCategory } from "./examples-catalog";
import { getCommunityProjects } from "./lab-projects";

/**
 * Markdown for the card grids on the Integrations and Demos pages. The grids are React components,
 * so the pages' Markdown versions (`.mdx` and `llms-full.txt`) would otherwise show only the
 * component tags and none of the entries agents look for.
 */

const BASE_URL = "https://www.openui.com";

function absolute(href: string): string {
  return new URL(href, BASE_URL).toString();
}

function linkList(links: CardLinkItem[]): string {
  return links.map((link) => `[${link.label}](${absolute(link.href)})`).join(" · ");
}

function exampleCategoryMarkdown(id: ExampleCategoryId): string {
  const category = EXAMPLE_CATEGORIES.find((c) => c.id === id);
  const examples = getSortedExamplesInCategory(id);
  if (!category || examples.length === 0) return "";

  const items = examples.map((example) => {
    const tags = [
      example.featured ? "Featured" : null,
      example.community ? "Community" : "Official",
    ]
      .filter(Boolean)
      .join(", ");
    const links = linkList([
      { label: "Source", href: example.sourceUrl },
      ...(example.guideUrl ? [{ label: "Guide", href: example.guideUrl }] : []),
    ]);
    const run = example.runnable
      ? ` Run locally: \`npx @openuidev/cli@latest create --example ${example.name}\``
      : "";
    return `- **${example.title}** (${tags}): ${example.description} ${links}${run}`;
  });
  return `${category.description}\n\n${items.join("\n")}`;
}

function showcaseMarkdown(items: ShowcaseItem[]): string {
  return items
    .map((item) => `- **${item.name}**: ${item.description} ${linkList(item.links)}`)
    .join("\n");
}

function communityProjectsMarkdown(): string {
  return getCommunityProjects()
    .map((project) => {
      const tags = [
        project.featured ? "Featured" : null,
        project.type === "App" ? null : project.type,
      ]
        .filter(Boolean)
        .join(", ");
      return `- **${project.name}**${tags ? ` (${tags})` : ""}: ${project.description} ${linkList(project.links)}`;
    })
    .join("\n");
}

/** Replaces the card-grid component tags in a page's Markdown with the entries they render. */
export function expandShowcaseComponents(markdown: string): string {
  return markdown
    .replace(/<ExampleCategory id="([\w-]+)" \/>/g, (_, id: ExampleCategoryId) =>
      exampleCategoryMarkdown(id),
    )
    .replace(/<FeaturedProjects \/>/g, () => showcaseMarkdown(FEATURED_PROJECTS))
    .replace(/<Playground \/>/g, () => showcaseMarkdown(PLAYGROUND))
    .replace(/<CommunityProjects \/>/g, () => communityProjectsMarkdown());
}
