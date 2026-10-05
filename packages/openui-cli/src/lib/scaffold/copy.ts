import * as fs from "node:fs";
import * as path from "node:path";

import { OVERLAYS_DIR } from "../../commands/create/lib/overlays";

export function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // Copy the base template only; selected backend overlays are applied later.
  // Also exclude install/build artifacts that may sit in a template directory.
  return ![OVERLAYS_DIR, "node_modules", ".next", ".turbo", "dist"].includes(top);
}

export function restoreDotfiles(projectDir: string) {
  // Templates ship `gitignore` un-dotted: npm silently strips `.gitignore`
  // files (at any depth) from published packages, so a dotted copy never
  // reaches the scaffold — and freshly created apps would commit `.env`.
  // Restore the real name here instead.
  const plain = path.join(projectDir, "gitignore");
  if (fs.existsSync(plain)) {
    fs.renameSync(plain, path.join(projectDir, ".gitignore"));
  }
}

export function copyTemplate(templateDir: string, targetDir: string): void {
  fs.cpSync(templateDir, targetDir, {
    recursive: true,
    filter: (src) => shouldCopyTemplatePath(templateDir, src),
  });
  restoreDotfiles(targetDir);
}
