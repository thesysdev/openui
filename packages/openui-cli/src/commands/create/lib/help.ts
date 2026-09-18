import type { Command } from "commander";

import {
  loadTemplatesCatalog,
  type CatalogOverlay,
  type CatalogTemplate,
} from "./templates-catalog";

type HelpEntry = { key: string; description: string };

const FALLBACK_TEMPLATES: HelpEntry[] = [
  {
    key: "openui-cloud",
    description:
      "Recommended default for prototypes and evaluations. Hosted models, managed conversation history, built-in tools, and ready-to-use reports and presentations.",
  },
  {
    key: "openui-self-hosted",
    description:
      "Choose when owning the OpenAI-compatible provider, AI route, and persistence is a requirement. Available only via --template; interactive runs default to openui-cloud.",
  },
];

const FALLBACK_FRAMEWORKS: HelpEntry[] = [
  { key: "default", description: "Uses OpenAI SDK." },
  { key: "langgraph", description: "Bootstraps a LangGraph agent with the selected model backend." },
  {
    key: "vercel-ai-sdk",
    description: "Scaffolds a Vercel AI SDK agent with the selected model backend.",
  },
  {
    key: "vercel-eve",
    description: "Scaffolds a Vercel Eve agent with the selected model backend.",
  },
];

function formatSection(title: string, entries: HelpEntry[]): string {
  const width = Math.max(...entries.map((entry) => entry.key.length), 0);
  const lines = entries.map((entry) => `  ${entry.key.padEnd(width)}  ${entry.description}`);
  return `${title}\n${lines.join("\n")}`;
}

function uniqueOverlays(templates: CatalogTemplate[]): CatalogOverlay[] {
  const seen = new Map<string, CatalogOverlay>();
  for (const template of templates) {
    for (const overlay of template.overlays) {
      if (!seen.has(overlay.key)) seen.set(overlay.key, overlay);
    }
  }
  return [...seen.values()];
}

async function loadCreateHelpText(): Promise<string> {
  const sections: string[] = [];
  try {
    const templates = await loadTemplatesCatalog();
    sections.push(
      formatSection(
        "Templates:",
        templates.map((template) => ({
          key: template.key,
          description: template.description,
        })),
      ),
    );
    sections.push(
      formatSection(
        "Backend frameworks:",
        uniqueOverlays(templates).map((overlay) => ({
          key: overlay.key,
          description: overlay.description,
        })),
      ),
    );
  } catch {
    sections.push(formatSection("Templates:", FALLBACK_TEMPLATES));
    sections.push(formatSection("Backend frameworks:", FALLBACK_FRAMEWORKS));
    sections.push("  Live catalog could not be fetched.");
  }

  sections.push(`OpenUI examples:
  Loaded at runtime from examples/examples.json in the OpenUI repo.
  Pick "Scaffold from OpenUI Examples" in the interactive prompt, or pass
  --example <name> with any catalog folder name.`);

  return `\n${sections.join("\n\n")}\n`;
}

/** Built-in `--help` is sync; print flags now, then the fetched catalog. */
export async function printCreateHelp(command: Command): Promise<void> {
  process.stdout.write(command.helpInformation());
  process.stdout.write(await loadCreateHelpText());
}
