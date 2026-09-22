import { THESYS_KEYS_URL } from "../../../lib/auth/mint";
import type { TemplateName } from "./create-types";

export function getStartedMessage(o: {
  name: string;
  devCmd: string;
  template: TemplateName;
  backendGettingStarted?: string;
  skillInstalled: boolean;
  envWritten: boolean;
  startDev: boolean;
  installCmd: string;
  dependencyInstalled: boolean;
}): string {
  const skillMessage = o.skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI.\n"
    : "";

  const envNote =
    o.template === "openui-cloud"
      ? o.envWritten
        ? "✅ .env created with your OpenUI Cloud API key + base URL."
        : `[!] .env created without a key. Add THESYS_API_KEY=… (get one at ${THESYS_KEYS_URL}).`
      : o.envWritten
        ? "✅ .env created with your API key."
        : "Add your API key to .env:\nOPENAI_API_KEY=sk-your-key-here";

  const nextStep = o.startDev
    ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
    : [
        `> cd ${o.name}`,
        ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
        `> ${o.devCmd} run dev`,
      ].join("\n");

  const deployHint = "Share a preview:\n> npx @openuidev/cli@latest deploy";

  const frameworkNote = o.backendGettingStarted?.replaceAll("{{packageManager}}", o.devCmd) ?? "";

  return `\n${[skillMessage.trim(), "Done!", envNote, frameworkNote, nextStep, deployHint]
    .filter(Boolean)
    .join("\n\n")}\n`;
}
