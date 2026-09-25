import { CliCancelledError, CreateError } from "../../../lib/errors";
import { resolveArgs } from "../../../lib/resolve-args";
import type { RetryAttemptInfo } from "../../../lib/retry";
import type { OverlayName, TemplateName } from "./create-types";
import {
  findExample,
  groupedExampleChoices,
  loadExamplesCatalog,
  rejectConflictingScaffoldSelectors,
  type ExampleProject,
} from "./examples-catalog";
import { resolveAvailableTarget } from "./target-dir";
import type { CreateTelemetryClient } from "./telemetry";
import {
  DEFAULT_TEMPLATE_KEY,
  findCatalogOverlay,
  findCatalogTemplate,
  loadTemplatesCatalog,
  type CatalogOverlay,
  type CatalogTemplate,
} from "./templates-catalog";

export function rejectConflictingImmediateFlags(args: string[]): void {
  const separatorIndex = args.indexOf("--");
  const optionArgs = separatorIndex === -1 ? args : args.slice(0, separatorIndex);
  const hasImmediate = optionArgs.some((arg) => arg === "--immediate" || arg === "-i");
  const hasNoImmediate = optionArgs.includes("--no-immediate");
  if (hasImmediate && hasNoImmediate) {
    throw new CreateError("bad_args", "--immediate and --no-immediate cannot be used together.");
  }
}

export type CreateCatalog = {
  examples: ExampleProject[];
  template?: TemplateName;
  templateEntry?: CatalogTemplate;
};

export async function loadCreateCatalog(params: {
  example?: string;
  template?: TemplateName;
  backendFramework?: OverlayName;
  interactive: boolean;
  onRetry?: (info: RetryAttemptInfo) => void;
}): Promise<CreateCatalog> {
  const { example, template: requestedTemplate, backendFramework, interactive, onRetry } = params;

  rejectConflictingScaffoldSelectors({
    example,
    backendFramework,
    template: requestedTemplate,
  });

  // Interactive runs always scaffold the Cloud backend; openui-self-hosted stays
  // available, but only when requested explicitly with --template.
  if (!interactive && !example && !requestedTemplate) {
    throw new CreateError(
      "args_resolution",
      "Missing required argument --template",
      "invalid_input",
      "MISSING_REQUIRED_ARG",
    );
  }

  if (example) {
    const examples = await loadExamplesCatalog({ onRetry });
    findExample(example, examples);
    return { examples };
  }

  if (interactive) {
    const [catalog, examples] = await Promise.all([
      loadTemplatesCatalog({ onRetry }),
      loadExamplesCatalog({ onRetry }),
    ]);
    const template = requestedTemplate ?? DEFAULT_TEMPLATE_KEY;
    const templateEntry = findCatalogTemplate(catalog, template);
    if (backendFramework) {
      findCatalogOverlay(templateEntry, backendFramework);
    }
    return { examples, template, templateEntry };
  }

  const catalog = await loadTemplatesCatalog({ onRetry });
  const template = requestedTemplate ?? DEFAULT_TEMPLATE_KEY;
  const templateEntry = findCatalogTemplate(catalog, template);
  if (backendFramework) {
    findCatalogOverlay(templateEntry, backendFramework);
  }
  return { examples: [], template, templateEntry };
}

export async function resolveProjectIdentity(
  requestedName: string | undefined,
  interactive: boolean,
  tel: CreateTelemetryClient,
): Promise<{ name: string; targetDir: string }> {
  const nameArgs = await resolveArgs(
    {
      name: requestedName
        ? { value: requestedName }
        : {
            prompt: { type: "input", message: "Project name?", default: "openui-agent" },
            required: true,
          },
    },
    interactive,
  );
  return resolveAvailableTarget((nameArgs as { name: string }).name, interactive, tel);
}

const OPENUI_EXAMPLES_CHOICE = "openui-examples";
const GO_BACK_CHOICE = "__back__";

export async function resolveCreateSelection(params: {
  backendFramework?: OverlayName;
  example?: string;
  examples: ExampleProject[];
  overlays: CatalogOverlay[];
  interactive: boolean;
}): Promise<
  { kind: "overlay"; overlay: OverlayName } | { kind: "example"; example: ExampleProject }
> {
  const { backendFramework, example, examples, overlays, interactive } = params;
  if (example) return { kind: "example", example: findExample(example, examples) };
  if (backendFramework) return { kind: "overlay", overlay: backendFramework };
  if (!interactive) return { kind: "overlay", overlay: "default" };

  const { select, Separator } = await import("@inquirer/prompts");
  const prompt = async <T extends string>(
    message: string,
    choices: unknown[],
    pageSize: number,
  ) => {
    try {
      return (await select({
        message,
        choices: choices as never,
        pageSize,
        loop: false,
      })) as T;
    } catch (err) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (err instanceof ExitPromptError) {
        throw new CliCancelledError("args_resolution");
      }
      throw err;
    }
  };

  for (;;) {
    const starterChoices: unknown[] = overlays.map((overlay) => ({
      value: overlay.key,
      name: overlay.name,
      description: overlay.description,
    }));
    if (examples.length > 0) {
      starterChoices.push(new Separator());
      starterChoices.push({
        value: OPENUI_EXAMPLES_CHOICE,
        name: "Scaffold from OpenUI Examples",
        description: "Browse examples from the OpenUI repo",
      });
    }

    const selected = await prompt<string>(
      "Choose your backend framework",
      starterChoices,
      starterChoices.length,
    );
    if (selected !== OPENUI_EXAMPLES_CHOICE) {
      return { kind: "overlay", overlay: selected as OverlayName };
    }

    const exampleSelected = await prompt<string>(
      "Select an OpenUI example",
      [
        { value: GO_BACK_CHOICE, name: "← Back" },
        new Separator(),
        ...groupedExampleChoices(examples, Separator),
      ],
      10,
    );
    if (exampleSelected === GO_BACK_CHOICE) continue;
    return { kind: "example", example: findExample(exampleSelected, examples) };
  }
}

const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export function resolveImmediate(
  immediate: boolean | undefined,
  noInstall: boolean | undefined,
  interactive: boolean,
): {
  immediate: boolean;
  installDependencies: boolean;
  source: "flag" | "interactive_default" | "no_install" | "noninteractive_default";
} {
  if (noInstall) {
    return { immediate: false, installDependencies: false, source: "no_install" };
  }
  if (immediate !== undefined) {
    return {
      immediate,
      installDependencies: true,
      source: "flag",
    };
  }
  if (!interactive || !isInteractiveTerminal()) {
    return {
      immediate: false,
      installDependencies: true,
      source: "noninteractive_default",
    };
  }
  return { immediate: true, installDependencies: true, source: "interactive_default" };
}
