import { styleText } from "node:util";

import { fetchSourceFile, type SourceRepo } from "../../../lib/checkout";
import { CreateError } from "../../../lib/errors";
import type { RetryAttemptInfo } from "../../../lib/retry";

export const EXAMPLES_CATALOG_PATH = "examples/examples.json";

/** GitHub owners whose repositories `--example <owner>/<repo>[/<path>]` may clone. */
const ALLOWED_EXAMPLE_REPO_OWNERS = ["thesysdev"];

/** Catalog `path` prefix for an example outside the OpenUI repo: `repo:<owner>/<repo>[/<path>]`. */
const REPO_PATH_PREFIX = "repo:";

const REPO_SEGMENT_RE = /^[A-Za-z0-9_.-]+$/;

export type ExampleProject = {
  name: string;
  label: string;
  description: string;
  /** Path inside the source repo, e.g. `examples/app-frameworks/vue`; `""` is the repo root. */
  path: string;
  /** Source repository. Omitted means the OpenUI repo. */
  repo?: SourceRepo;
  env: {
    /** Environment file relative to the example root. */
    file: string;
    /** Primary env var to prompt for. Omit when the example needs several keys. */
    key?: string;
  };
  /** Show this example in the curated interactive picker. */
  featured?: boolean;
};

function catalogError(message: string): CreateError {
  return new CreateError("args_resolution", message, "invalid_input", "EXAMPLES_CATALOG_INVALID");
}

/** Parse `[repo:]<owner>/<repo>[/<path>]`; `undefined` when invalid or the owner is not allowed. */
function parseRepoSpec(spec: string): { repo: SourceRepo; subpath: string } | undefined {
  const withoutPrefix = spec.startsWith(REPO_PATH_PREFIX)
    ? spec.slice(REPO_PATH_PREFIX.length)
    : spec;
  const [owner = "", name = "", ...rest] = withoutPrefix.replace(/^\/+|\/+$/g, "").split("/");
  const subpath = rest.filter(Boolean);
  if (
    !REPO_SEGMENT_RE.test(owner) ||
    !REPO_SEGMENT_RE.test(name) ||
    !ALLOWED_EXAMPLE_REPO_OWNERS.includes(owner.toLowerCase()) ||
    subpath.some((part) => part === "." || part === "..")
  ) {
    return undefined;
  }
  return { repo: { owner, name }, subpath: subpath.join("/") };
}

function parseCatalogEntry(item: unknown): ExampleProject {
  const entry = item as {
    title?: unknown;
    description?: unknown;
    path?: unknown;
    env?: unknown;
    featured?: unknown;
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
  if (entry.featured !== undefined && typeof entry.featured !== "boolean") {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} has an example with an invalid featured flag.`);
  }
  let repo: SourceRepo | undefined;
  let relative = entry.path.replace(/^\/+/, "");
  if (relative.startsWith(REPO_PATH_PREFIX)) {
    const parsed = parseRepoSpec(relative);
    if (!parsed) {
      throw catalogError(
        `${EXAMPLES_CATALOG_PATH} has an invalid path "${entry.path}". Use ${REPO_PATH_PREFIX}<owner>/<repo>[/<path>] with a repository from ${ALLOWED_EXAMPLE_REPO_OWNERS.join(", ")}.`,
      );
    }
    repo = parsed.repo;
    relative = parsed.subpath;
  }
  const name = relative.split("/").filter(Boolean).at(-1) ?? repo?.name;
  if (!name) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} has an example with an empty path.`);
  }
  if (
    entry.env !== undefined &&
    (typeof entry.env !== "object" || entry.env === null || Array.isArray(entry.env))
  ) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} example "${name}" has an invalid env.`);
  }
  const env = (entry.env ?? {}) as { file?: unknown; key?: unknown };
  if (env.key !== undefined) {
    if (typeof env.key !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(env.key)) {
      throw catalogError(`${EXAMPLES_CATALOG_PATH} example "${name}" has an invalid env.key.`);
    }
  }
  const file = env.file ?? ".env";
  if (typeof file !== "string" || !/^(?:[A-Za-z0-9_-]+\/)*\.env(?:\.local)?$/.test(file)) {
    throw catalogError(`${EXAMPLES_CATALOG_PATH} example "${name}" has an invalid env.file.`);
  }
  return {
    name,
    label: entry.title,
    description: entry.description,
    path: repo || relative.startsWith("examples/") ? relative : `examples/${relative}`,
    repo,
    env: { file, key: typeof env.key === "string" ? env.key : undefined },
    featured: entry.featured === true,
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
export async function loadExamplesCatalog(
  opts: {
    onRetry?: (info: RetryAttemptInfo) => void;
  } = {},
): Promise<ExampleProject[]> {
  const { content } = await fetchSourceFile(EXAMPLES_CATALOG_PATH, { onRetry: opts.onRetry });
  return parseExamplesCatalog(content);
}

/** Keep catalog order so curators control which five examples are shown. */
export function featuredExamples(examples: ExampleProject[]): ExampleProject[] {
  return examples.filter((example) => example.featured === true).slice(0, 5);
}

function sameRepo(a: SourceRepo | undefined, b: SourceRepo): boolean {
  const left = a ?? { owner: "thesysdev", name: "openui" };
  return (
    left.owner.toLowerCase() === b.owner.toLowerCase() &&
    left.name.toLowerCase() === b.name.toLowerCase()
  );
}

/** Resolve `<owner>/<repo>[/<path>]`, preferring a matching catalog entry for its env setup. */
function findRepoExample(spec: string, examples: ExampleProject[]): ExampleProject {
  const parsed = parseRepoSpec(spec);
  if (!parsed) {
    throw new CreateError(
      "args_resolution",
      `unsupported example repository "${spec}". Use <owner>/<repo>[/<path>] with a repository from ${ALLOWED_EXAMPLE_REPO_OWNERS.join(", ")}, or an example name from ${EXAMPLES_CATALOG_PATH}.`,
      "invalid_input",
      "INVALID_EXAMPLE",
    );
  }
  const { repo, subpath } = parsed;
  const match = examples.find(
    (entry) => sameRepo(entry.repo, repo) && entry.path.toLowerCase() === subpath.toLowerCase(),
  );
  if (match) return match;
  return {
    name: subpath.split("/").at(-1) || repo.name,
    label: `${repo.owner}/${repo.name}${subpath ? `/${subpath}` : ""}`,
    description: "",
    path: subpath,
    repo,
    env: { file: ".env" },
  };
}

export function findExample(name: string, examples: ExampleProject[]): ExampleProject {
  if (name.includes("/") || name.startsWith(REPO_PATH_PREFIX)) {
    return findRepoExample(name, examples);
  }
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
    const key = example.repo
      ? "miscellaneous"
      : (example.path.replace(/^examples\//, "").split("/")[0] ?? "miscellaneous");
    const group = groups.get(key) ?? [];
    group.push(example);
    groups.set(key, group);
  }

  const choices: unknown[] = [];
  for (const [key, group] of groups) {
    choices.push(new Separator(styleText("bold", categoryLabel(key))));
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
