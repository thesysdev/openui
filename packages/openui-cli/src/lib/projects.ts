import { styleText } from "node:util";

import type { OverlayName } from "./create-types";
import { promptSelect } from "./resolve-args";
import { CreateError } from "./telemetry";
import type { CatalogOverlay } from "./templates-catalog";
import { findByNormalizedKey } from "./utils";

export type ProjectCategory = "template" | "example";

export type EnvFileHint = ".env" | ".env.local";

export interface TemplateProject {
  name: OverlayName;
  label: string;
  description: string;
  category: "template";
}

export interface ExampleProject {
  name: string;
  label: string;
  description: string;
  category: "example";
  /** Path inside the OpenUI repo, e.g. `examples/app-frameworks/vue`. */
  path: string;
  /** Where the example expects its primary API key. */
  envFile: EnvFileHint;
  /** Primary env var to prompt for. Omit when the example needs several keys. */
  envKey?: string;
}

export type ProjectMetadata = TemplateProject | ExampleProject;

const OPENUI_EXAMPLES_CHOICE = "openui-examples";
const GO_BACK_CHOICE = "__back__";

function erasePromptLines(count: number) {
  const out = process.stdout;
  if (!out.isTTY) return;
  for (let i = 0; i < count; i++) {
    out.moveCursor(0, -1);
    out.clearLine(0);
  }
  out.cursorTo(0);
}

export function templatesFromOverlays(overlays: CatalogOverlay[]): TemplateProject[] {
  return overlays.map((overlay) => ({
    name: overlay.key,
    label: overlay.name,
    description: overlay.description,
    category: "template",
  }));
}

export function findTemplate(name: OverlayName, templates: TemplateProject[]): TemplateProject {
  return findByNormalizedKey(
    templates,
    name,
    (entry) => entry.name,
    (available) =>
      new CreateError(
        "args_resolution",
        `unknown backend framework "${name}". Use: ${available}.`,
        "invalid_input",
        "INVALID_BACKEND_FRAMEWORK",
      ),
  );
}

export function findExample(name: string, examples: ExampleProject[]): ExampleProject {
  return findByNormalizedKey(
    examples,
    name,
    (entry) => entry.name,
    (available) =>
      new CreateError(
        "args_resolution",
        `unknown example "${name}". Use: ${available}.`,
        "invalid_input",
        "INVALID_EXAMPLE",
      ),
  );
}

export function rejectConflictingScaffoldSelectors(opts: {
  example?: string;
  backendFramework?: OverlayName;
  template?: string;
}): void {
  if (opts.example && opts.backendFramework) {
    throw new CreateError(
      "bad_args",
      "Cannot use --example with --backend-framework. Choose one scaffold selector.",
      "invalid_input",
      "CONFLICTING_SCAFFOLD_SELECTORS",
    );
  }
  if (opts.example && opts.template) {
    throw new CreateError(
      "bad_args",
      "Cannot use --example with --template. Choose one scaffold selector.",
      "invalid_input",
      "CONFLICTING_SCAFFOLD_SELECTORS",
    );
  }
}

function heading(label: string): string {
  return styleText("bold", label);
}

function categoryLabel(key: string): string {
  return key
    .split("-")
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function groupedExampleChoices(
  examples: ExampleProject[],
  Separator: new (heading?: string) => object,
): unknown[] {
  const groups = new Map<string, ExampleProject[]>();
  for (const example of examples) {
    const key = example.path.replace(/^examples\//, "").split("/")[0] ?? "miscellaneous";
    const group = groups.get(key) ?? [];
    group.push(example);
    groups.set(key, group);
  }

  const choices: unknown[] = [];
  for (const [key, group] of groups) {
    choices.push(new Separator(heading(categoryLabel(key))));
    for (const project of group) {
      choices.push({
        value: project.name,
        name: project.label,
        description: project.description,
      });
    }
  }
  return choices;
}

export async function resolveProject(params: {
  backendFramework?: OverlayName;
  example?: string;
  examples: ExampleProject[];
  templates: TemplateProject[];
  interactive: boolean;
}): Promise<ProjectMetadata> {
  const { backendFramework, example, examples, templates, interactive } = params;

  if (example) return findExample(example, examples);
  if (backendFramework) return findTemplate(backendFramework, templates);
  if (!interactive) return findTemplate("default", templates);

  const { Separator } = await import("@inquirer/prompts");
  for (;;) {
    const starterChoices: unknown[] = [
      new Separator(" "),
      new Separator(heading("Starter Templates")),
      ...templates.map((project) => ({
        value: project.name,
        name: project.label,
        description: project.description,
      })),
    ];
    if (examples.length > 0) {
      starterChoices.push(new Separator());
      starterChoices.push({
        value: OPENUI_EXAMPLES_CHOICE,
        name: "Scaffold from OpenUI Examples →",
        description: "Browse examples from the OpenUI repo",
      });
    }

    const selected = await promptSelect("Select a project to scaffold:", starterChoices);
    if (selected !== OPENUI_EXAMPLES_CHOICE) {
      return findTemplate(selected as OverlayName, templates);
    }

    const exampleSelected = await promptSelect(
      "Select an OpenUI example:",
      [
        { value: GO_BACK_CHOICE, name: "← Back" },
        new Separator(),
        ...groupedExampleChoices(examples, Separator),
      ],
      { pageSize: 10, loop: false, pinCount: 2 },
    );
    if (exampleSelected === GO_BACK_CHOICE) {
      // Inquirer prints a ✔ line for every resolved select. Drop the
      // examples visit so Back returns to a clean starter prompt.
      erasePromptLines(2);
      continue;
    }
    const selectedExample = findExample(exampleSelected, examples);
    erasePromptLines(2);
    const prefix = styleText("green", "✔");
    const answer = styleText("cyan", selectedExample.label);
    console.info(`${prefix} Select a project to scaffold: ${answer}`);
    return selectedExample;
  }
}
