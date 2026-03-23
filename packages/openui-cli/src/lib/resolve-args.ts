type InputPromptConfig = {
  type: "input";
  message: string;
  default?: string;
};

type SelectPromptConfig = {
  type: "select";
  message: string;
  choices: Array<{ value: string; name?: string }>;
};

type PromptConfig = InputPromptConfig | SelectPromptConfig;

export type ArgDef<T> = { value: T } | { prompt: PromptConfig; required: true };

type ResolvedArgs<T extends Record<string, ArgDef<unknown>>> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : string;
};

async function resolveOne(prompt: PromptConfig): Promise<string> {
  const { input, select } = await import("@inquirer/prompts");
  if (prompt.type === "select") {
    return select({ message: prompt.message, choices: prompt.choices });
  }
  return input({ message: prompt.message, default: prompt.default });
}

export async function resolveArgs<T extends Record<string, ArgDef<unknown>>>(
  defs: T,
  interactive: boolean,
): Promise<ResolvedArgs<T>> {
  const result: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(defs)) {
    if ("value" in def) {
      result[key] = def.value;
      continue;
    }

    if (!interactive) {
      console.error(`Error: Missing required argument --${key}`);
      process.exit(1);
    }

    try {
      result[key] = await resolveOne(def.prompt);
    } catch (err) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (err instanceof ExitPromptError) {
        process.exit(0);
      }
      throw err;
    }
  }

  return result as ResolvedArgs<T>;
}
