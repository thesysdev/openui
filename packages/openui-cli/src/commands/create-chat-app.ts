import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { detectPackageManager } from "../lib/detect-package-manager";
import { resolveArgs } from "../lib/resolve-args";

export interface CreateChatAppOptions {
  name?: string;
  noInteractive?: boolean;
}

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const relativePath = path.relative(templateDir, src);

  if (!relativePath) return true;

  return relativePath !== "openui-chat" && !relativePath.startsWith(`openui-chat${path.sep}`);
}

export async function runCreateChatApp(options: CreateChatAppOptions): Promise<void> {
  const args = await resolveArgs(
    {
      name: options.name
        ? { value: options.name }
        : {
            prompt: { type: "input", message: "Project name?" },
            required: true,
          },
    },
    !options.noInteractive,
  );

  const { name } = args as { name: string };
  const targetDir = path.resolve(process.cwd(), name);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${name}" already exists.`);
    process.exit(1);
  }

  const runner = detectPackageManager();

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

  const pkgPath = path.join(targetDir, "package.json");
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

  const devCmd =
    runner === "pnpm dlx"
      ? "pnpm"
      : runner === "yarn dlx"
        ? "yarn"
        : runner === "bunx"
          ? "bun"
          : "npm";

  console.info(getStartedMessage(name, devCmd));
}

const getStartedMessage = (name: string, devCmd: string) =>
  `
Done!
Get started: 

cd ${name}

touch .env

Add your API key to .env:
OPENAI_API_KEY=sk-your-key-here

${devCmd} run dev
`;
