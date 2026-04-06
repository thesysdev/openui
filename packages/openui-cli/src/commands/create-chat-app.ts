import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { KNOWN_EXAMPLES } from "../generated/known-examples";
import { detectPackageManager } from "../lib/detect-package-manager";
import { fetchExample } from "../lib/fetch-example";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { resolveArgs } from "../lib/resolve-args";

export interface CreateChatAppOptions {
  name?: string;
  example?: string;
  skill?: boolean;
  noInteractive?: boolean;
}

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const relativePath = path.relative(templateDir, src);

  if (!relativePath) return true;

  return relativePath !== "openui-chat" && !relativePath.startsWith(`openui-chat${path.sep}`);
}

export async function runCreateChatApp(options: CreateChatAppOptions): Promise<void> {
  let useExample: boolean;

  if (options.example) {
    useExample = true;
  } else if (!options.noInteractive) {
    try {
      const { select } = await import("@inquirer/prompts");
      useExample = (await select({
        message: "Start from:",
        choices: [
          { value: false, name: "Clean template (default)" },
          { value: true, name: "Example from the repo" },
        ],
        default: false,
      })) as boolean;
    } catch (err) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (err instanceof ExitPromptError) process.exit(0);
      throw err;
    }
  } else {
    useExample = false;
  }

  const args = await resolveArgs(
    {
      name: options.name
        ? { value: options.name }
        : {
            prompt: { type: "input", message: "Project name?" },
            required: true,
          },
      ...(useExample
        ? {
            example: options.example
              ? { value: options.example }
              : {
                  prompt: {
                    type: "select",
                    message: "Which example?",
                    choices: KNOWN_EXAMPLES.map((e) => ({ value: e })),
                  },
                  required: true as const,
                },
          }
        : {}),
    },
    !options.noInteractive,
  );

  const { name } = args as { name: string; example?: string };
  const resolvedExample = useExample ? (args as { example: string }).example : undefined;

  if (
    resolvedExample &&
    !KNOWN_EXAMPLES.includes(resolvedExample as (typeof KNOWN_EXAMPLES)[number])
  ) {
    console.error(
      `Error: Unknown example "${resolvedExample}".\n\nAvailable examples:\n${KNOWN_EXAMPLES.map((e) => `  ${e}`).join("\n")}`,
    );
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), name);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${name}" already exists.`);
    process.exit(1);
  }

  const runner = detectPackageManager();

  if (resolvedExample) {
    await fetchExample(resolvedExample, targetDir);
  } else {
    const templateDir = path.join(__dirname, "..", "templates", "openui-chat");
    if (!fs.existsSync(templateDir)) {
      console.error("Error: Template not found. Please rebuild the CLI with `pnpm build`.");
      process.exit(1);
    }

    console.info(`\nScaffolding OpenUI Chat app into "${name}"...\n`);

    const nestedTemplateDir = path.join(templateDir, "openui-chat");
    if (fs.existsSync(nestedTemplateDir)) {
      console.warn("Warning: Ignoring nested template directory left by a previous CLI build.");
    }

    fs.cpSync(templateDir, targetDir, {
      recursive: true,
      filter: (src) => shouldCopyTemplatePath(templateDir, src),
    });
  }

  const pkgPath = path.join(targetDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      name: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    pkg.name = name;
    for (const section of ["dependencies", "devDependencies"] as const) {
      for (const key of Object.keys(pkg[section] ?? {})) {
        if (pkg[section]![key] === "workspace:*") {
          pkg[section]![key] = "latest";
        }
      }
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }

  const installCmd =
    runner === "pnpm dlx"
      ? "pnpm install"
      : runner === "yarn dlx"
        ? "yarn"
        : runner === "bunx"
          ? "bun install"
          : "npm install";

  console.info(`Installing dependencies with: ${installCmd}\n`);

  try {
    execSync(installCmd, { stdio: "inherit", cwd: targetDir });
  } catch {
    console.error("\nFailed to install dependencies.");
    process.exit(1);
  }

  const installSkill = await shouldInstallSkill(options.skill, !options.noInteractive);
  if (installSkill) {
    runSkillInstall(targetDir);
  }

  const devCmd =
    runner === "pnpm dlx"
      ? "pnpm"
      : runner === "yarn dlx"
        ? "yarn"
        : runner === "bunx"
          ? "bun"
          : "npm";

  let apiKeyWritten = false;
  if (!options.noInteractive) {
    const { input } = await import("@inquirer/prompts");
    const apiKey = (
      await input({ message: "Enter your OpenAI API key (leave blank to skip):" })
    ).trim();

    if (apiKey) {
      fs.writeFileSync(path.join(targetDir, ".env"), `OPENAI_API_KEY=${apiKey}\n`);
      apiKeyWritten = true;
    }
  }

  console.info(getStartedMessage(name, devCmd, installSkill, apiKeyWritten));
}

const getStartedMessage = (
  name: string,
  devCmd: string,
  skillInstalled: boolean,
  apiKeyWritten: boolean,
) => {
  const envInstructions = apiKeyWritten
    ? "✅ .env file created with your API key."
    : `touch .env

Add your API key to .env:
OPENAI_API_KEY=sk-your-key-here`;

  const skillMessage = skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI."
    : "";

  return `${skillMessage}

Done!
Get started:

${envInstructions}

> cd ${name}
> ${devCmd} run dev
`;
};
