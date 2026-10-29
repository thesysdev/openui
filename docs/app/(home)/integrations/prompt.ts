import { BASE_URL } from "@/lib/site-url";
import type { Integration } from "./data";

/*
 * The "Copy prompt" text: a self-contained brief a coding agent can follow to
 * add the integration to the reader's project, built from the page's metadata
 * and its content/integrations/<slug>.mdx guide.
 */

// A JSX attribute in the guide: name="value" or name={"value"}.
function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`${name}=(?:"([^"]*)"|\\{("(?:[^"\\\\]|\\\\.)*")\\})`));
  if (!match) return undefined;
  return match[1] ?? JSON.parse(match[2]);
}

// Guide prose escapes `{`, `}` and `<` for MDX, and code fences carry a title.
// Code inside the fences is left exactly as written.
function toMarkdown(mdx: string): string {
  let inCode = false;
  return mdx
    .split("\n")
    .map((line) => {
      const fence = line.match(/^```(\w+) title=(?:"([^"]*)"|\{"([^"]*)"\})$/);
      if (fence) {
        inCode = true;
        return `File: \`${fence[2] ?? fence[3]}\`\n\n\`\`\`${fence[1]}`;
      }
      if (line.startsWith("```")) {
        inCode = !inCode;
        return line;
      }
      return inCode ? line : line.replace(/\\([{}<])/g, "$1");
    })
    .join("\n")
    .trim();
}

function guideSteps(mdx: string): string {
  const steps = [...mdx.matchAll(/(<Step\b[^>]*>)([\s\S]*?)<\/Step>/g)];
  return steps
    .map(([, tag, body], index) => {
      const title = attribute(tag, "title") ?? `Step ${index + 1}`;
      const source = attribute(tag, "source");
      return [
        `### Step ${index + 1}: ${title}`,
        toMarkdown(body),
        ...(source ? [`Full file for reference: ${source}`] : []),
      ].join("\n\n");
    })
    .join("\n\n");
}

const absolute = (href: string) => (href.startsWith("/") ? `${BASE_URL}${href}` : href);

export function integrationPrompt(integration: Integration, guideMdx: string | undefined): string {
  const exampleTag = guideMdx?.match(/<Example\b[^>]*>/)?.[0];
  const exampleHref = exampleTag ? attribute(exampleTag, "href") : undefined;
  const steps = guideMdx ? guideSteps(guideMdx) : "";

  const linked = (href: string) => integration.links.some((link) => absolute(link.href) === href);
  const references = [
    ...(exampleHref && !linked(exampleHref) ? [`- Working example: ${exampleHref}`] : []),
    ...integration.links.map((link) => `- ${link.label} (${link.kind}): ${absolute(link.href)}`),
  ];

  return [
    `Help me integrate OpenUI with ${integration.name} in this project.`,
    `OpenUI renders a model's output as interactive UI components (generative UI) instead of plain text. ${integration.summary}`,
    `How it connects: ${integration.howItWorks}`,
    `Full guide: ${BASE_URL}/integrations/${integration.slug}`,
    ...(integration.install ? [`Install:\n\n\`\`\`bash\n${integration.install}\n\`\`\``] : []),
    ...(steps ? [`## Steps\n\n${steps}`] : []),
    "Adapt file paths, names and the model or provider setup to this project instead of copying the example as is, and use the package versions it already has where they're compatible. When you're done, summarize what you changed.",
    `## References\n\n${references.join("\n")}`,
  ].join("\n\n");
}
