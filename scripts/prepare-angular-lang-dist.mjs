import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const workspacePath = path.join(rootDir, "pnpm-workspace.yaml");
const langCorePackagePath = path.join(rootDir, "packages", "lang-core", "package.json");
const angularLangDistPackagePath = path.join(rootDir, "dist", "angular-lang", "package.json");

const workspaceSource = await readFile(workspacePath, "utf8");
const catalog = parseCatalog(workspaceSource);
const langCorePackage = JSON.parse(await readFile(langCorePackagePath, "utf8"));
const angularLangDistPackage = JSON.parse(await readFile(angularLangDistPackagePath, "utf8"));

angularLangDistPackage.dependencies = {
  "@openuidev/lang-core": `^${langCorePackage.version}`,
  tslib: getCatalogVersion(catalog, "tslib"),
};

angularLangDistPackage.peerDependencies = {
  "@angular/common": getCatalogVersion(catalog, "@angular/common"),
  "@angular/core": getCatalogVersion(catalog, "@angular/core"),
  rxjs: getCatalogVersion(catalog, "rxjs"),
  zod: getCatalogVersion(catalog, "zod"),
};

delete angularLangDistPackage.files;
delete angularLangDistPackage.scripts;
delete angularLangDistPackage.devDependencies;

await writeFile(angularLangDistPackagePath, `${JSON.stringify(angularLangDistPackage, null, 2)}\n`);

function parseCatalog(source) {
  const lines = source.split(/\r?\n/);
  const catalog = {};
  let inCatalog = false;

  for (const line of lines) {
    if (!inCatalog) {
      if (/^catalog:\s*$/.test(line)) {
        inCatalog = true;
      }
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    if (!/^\s{2,}/.test(line)) {
      break;
    }

    const match = line.match(/^\s{2}(["'][^"']+["']|[^:]+):\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }

    const rawKey = match[1].trim();
    const key = rawKey.replace(/^['"]|['"]$/g, "");
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    catalog[key] = value;
  }

  return catalog;
}

function getCatalogVersion(catalog, key) {
  const value = catalog[key];
  if (!value) {
    throw new Error(`Missing catalog version for ${key}`);
  }

  return value;
}
