import { fetchSourceFile } from "./checkout";
import { CreateError } from "./telemetry";

export const EXAMPLES_CATALOG_PATH = "examples/examples.json";

export type ExampleProject = {
  name: string;
  label: string;
  description: string;
  /** Path inside the OpenUI repo, e.g. `examples/app-frameworks/vue`. */
  path: string;
  envFile: ".env";
  /** Primary env var to prompt for. Omit when the example needs several keys. */
  envKey?: string;
};

function catalogError(message: string): CreateError {
  return new CreateError("args_resolution", message, "invalid_input", "EXAMPLES_CATALOG_INVALID");
}

function parseCatalogEntry(item: unknown): ExampleProject {
  const entry = item as {
    title?: unknown;
    description?: unknown;
    path?: unknown;
    envKey?: unknown;
  };
  if (
    typeof entry.title !== "string" ||
    typeof entry.description !== "string" ||
    typeof entry.path !== "string"
  ) {
    throw catalogError(
      `${EXAMPLES_CATALOG_PATH} has an example missing title, description, or path.`,
    );
  }
  const relative = entry.path.replace(/^\/+/, "");
  const name = relative.split("/").filter(Boolean).at(-1);
  if (!name) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} has an example with an empty path.`);
  }
  if (entry.envKey !== undefined) {
    if (typeof entry.envKey !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(entry.envKey)) {
      throw catalogError(`${EXAMPLES_CATALOG_PATH} example "${name}" has an invalid envKey.`);
    }
  }
  return {
    name,
    label: entry.title,
    description: entry.description,
    path: relative.startsWith("examples/") ? relative : `examples/${relative}`,
    envFile: ".env",
    envKey: typeof entry.envKey === "string" ? entry.envKey : undefined,
  };
}

function parseExamplesCatalog(raw: string): ExampleProject[] {
  const parsed = JSON.parse(raw) as { examples?: unknown };
  if (!Array.isArray(parsed.examples) || parsed.examples.length === 0) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} must contain a non-empty "examples" array.`);
  }
  return parsed.examples.map(parseCatalogEntry);
}

/** Prefetch the examples catalog from GitHub. */
export async function loadExamplesCatalog(): Promise<ExampleProject[]> {
  const { content } = await fetchSourceFile(EXAMPLES_CATALOG_PATH);
  return parseExamplesCatalog(content);
}

export function findExample(name: string, examples: ExampleProject[]): ExampleProject {
  const normalized = name.toLowerCase();
  const match = examples.find((entry) => entry.name.toLowerCase() === normalized);
  if (!match) {
    const available = examples.map((entry) => entry.name).join(" | ") || "(none loaded)";
    throw new CreateError(
      "args_resolution",
      `unknown example "${name}". Use: ${available}.`,
      "invalid_input",
      "INVALID_EXAMPLE",
    );
  }
  return match;
}

export function rejectConflictingScaffoldSelectors(opts: {
  example?: string;
  backendFramework?: string;
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

function categoryLabel(key: string): string {
  return key
    .split("-")
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function groupedExampleChoices(
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
    choices.push(new Separator(categoryLabel(key)));
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
