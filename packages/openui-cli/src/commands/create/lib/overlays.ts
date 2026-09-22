import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "../../../lib/errors";

export const OVERLAYS_DIR = "overlays";
export const OVERLAY_MANIFEST = "manifest.json";

/**
 * Describes everything a framework overlay changes beyond the files it ships.
 * The overlay's own files are copied implicitly; each key below names one
 * other surface the overlay needs to touch.
 */
export type OverlayManifest = {
  /** Prompt label for `--backend-framework` / the interactive picker. */
  label?: string;
  /** Optional prompt description. */
  description?: string;
  /** Merged into the scaffolded package.json. */
  packageJson?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    /** Base-template dependencies this overlay makes redundant. */
    removeDependencies?: string[];
  };
  /** Applied after the overlay's files are copied. */
  files?: {
    /** Base-template paths this overlay supersedes, relative to the project root. */
    remove?: string[];
  };
  /** Printed after scaffolding. `{{packageManager}}` is substituted. */
  gettingStarted?: string;
};

export type TemplateOverlay = {
  dir: string;
  manifest: OverlayManifest;
};

export type OverlayChoice = {
  name: string;
  label: string;
  description?: string;
};

const DEFAULT_OVERLAY: OverlayChoice = {
  name: "default",
  label: "Default — minimal SDK route",
  description: "Minimal SDK route",
};

export function listOverlays(templateDir: string): OverlayChoice[] {
  const overlaysDir = path.join(templateDir, OVERLAYS_DIR);
  const choices = [DEFAULT_OVERLAY];
  if (!fs.existsSync(overlaysDir)) return choices;

  const extra: OverlayChoice[] = [];
  for (const entry of fs.readdirSync(overlaysDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(overlaysDir, entry.name, OVERLAY_MANIFEST);
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as OverlayManifest;
    extra.push({
      name: entry.name,
      label: manifest.label ?? entry.name,
      description: manifest.description,
    });
  }
  extra.sort((a, b) => a.name.localeCompare(b.name));
  return [...choices, ...extra];
}

export function resolveOverlay(
  templateDir: string,
  overlayName: string,
): TemplateOverlay | undefined {
  if (overlayName === "default") return undefined;

  const overlayDir = path.join(templateDir, OVERLAYS_DIR, overlayName);
  const manifestPath = path.join(overlayDir, OVERLAY_MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    const available = listOverlays(templateDir)
      .map((overlay) => overlay.name)
      .join(" | ");
    throw new CreateError(
      "template_missing",
      `Backend framework "${overlayName}" not found. Use: ${available}.`,
      "invalid_input",
      "INVALID_BACKEND_FRAMEWORK",
    );
  }

  return {
    dir: overlayDir,
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) as OverlayManifest,
  };
}

function removeEmptyParentDirs(projectDir: string, removedRelativePath: string) {
  let dir = path.dirname(path.join(projectDir, removedRelativePath));

  while (true) {
    const relative = path.relative(projectDir, dir);
    if (!relative || relative.startsWith("..")) break;
    if (fs.readdirSync(dir).length > 0) break;
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

export function applyOverlay(projectDir: string, overlay?: TemplateOverlay) {
  if (!overlay) return;

  for (const entry of fs.readdirSync(overlay.dir)) {
    if (entry === OVERLAY_MANIFEST) continue;
    fs.cpSync(path.join(overlay.dir, entry), path.join(projectDir, entry), {
      recursive: true,
    });
  }

  for (const relativePath of overlay.manifest.files?.remove ?? []) {
    fs.rmSync(path.join(projectDir, relativePath), { recursive: true, force: true });
    removeEmptyParentDirs(projectDir, relativePath);
  }
}
