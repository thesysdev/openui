import {
  applyOverlay,
  resolveOverlay,
  type TemplateOverlay,
} from "../../commands/create/lib/overlays";
import type { PackageManagerName } from "../detect-package-manager";
import { copyTemplate } from "./copy";
import { applyLockfileHygiene } from "./lockfiles";
import { rewritePackageJson } from "./package-json";

export { resolveTemplateSource, type ResolvedTemplate } from "./source";

export function applyScaffoldFiles(params: {
  templateDir: string;
  targetDir: string;
  name: string;
  packageManager: PackageManagerName;
  backendFramework: string;
}): TemplateOverlay | undefined {
  const overlay = resolveOverlay(params.templateDir, params.backendFramework);
  copyTemplate(params.templateDir, params.targetDir);
  applyOverlay(params.targetDir, overlay);
  rewritePackageJson(
    params.targetDir,
    params.name,
    params.packageManager,
    overlay?.manifest.packageJson,
  );
  applyLockfileHygiene({
    targetDir: params.targetDir,
    overlay,
    packageManager: params.packageManager,
    backendFramework: params.backendFramework,
  });
  return overlay;
}
