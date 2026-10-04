import * as fs from "node:fs";
import * as path from "node:path";

import type { TemplateOverlay } from "../../commands/create/lib/overlays";
import type { PackageManagerName } from "../detect-package-manager";

export function applyLockfileHygiene(params: {
  targetDir: string;
  overlay: TemplateOverlay | undefined;
  packageManager: PackageManagerName;
  backendFramework: string;
}): void {
  const { targetDir, overlay, packageManager, backendFramework } = params;
  // An overlay that changes dependencies without a lock must not keep the base lock
  const overlayShipsNpmLock = Boolean(
    overlay && fs.existsSync(path.join(overlay.dir, "package-lock.json")),
  );
  if (packageManager !== "npm" || (overlay && !overlayShipsNpmLock)) {
    fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
  }
  // The Cloud template ships pnpm's lock/workspace files for reproducible pnpm
  // installs and native-build policy. A framework changes dependencies, so
  // regenerate its lock; non-pnpm scaffolds do not need either pnpm file.
  if (packageManager !== "pnpm" || backendFramework !== "default") {
    fs.rmSync(path.join(targetDir, "pnpm-lock.yaml"), { force: true });
  }
  if (packageManager !== "pnpm") {
    fs.rmSync(path.join(targetDir, "pnpm-workspace.yaml"), { force: true });
  }
}
