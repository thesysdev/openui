import fs from "fs";
import { camelCase } from "lodash-es";
import path from "path";
import { fileURLToPath } from "url";
import {
  mirrorStylesWithLayer,
  stripBom,
  UNLAYERED_DEFAULTS,
  writeLayeredCopy,
} from "./css-layer-utils.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Replace .scss imports with .css imports in compiled JS files
function fixScssImportsInJs(dir) {
  const entries = fs.readdirSync(dir);
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixScssImportsInJs(fullPath);
    } else if (entry.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const fixed = content.replace(/(['"])([^'"]*\.scss)\1/g, (match, quote, p) => {
        return `${quote}${p.replace(/\.scss$/, ".css")}${quote}`;
      });
      if (fixed !== content) {
        fs.writeFileSync(fullPath, fixed, "utf8");
      }
    }
  });
}

// Strip Sass's leading UTF-8 BOM (compressed-mode output for non-ASCII) from
// every *.css under dir, in place — so the unlayered default exports
// (./components.css, ./styles/*) ship BOM-free. The layered mirror strips it
// separately via wrapInLayer.
function stripBomFromCssInDir(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      stripBomFromCssInDir(full);
    } else if (entry.endsWith(".css")) {
      const content = fs.readFileSync(full, "utf8");
      const stripped = stripBom(content);
      if (stripped !== content) fs.writeFileSync(full, stripped, "utf8");
    }
  }
}

// Copy CSS files from src to dist
function copyCssFiles() {
  const srcDir = path.join(dirname, "dist", "components");
  const distDir = path.join(dirname, "dist", "styles");

  // Ensure the dist/styles directory exists
  ensureDirectoryExists(distDir);

  // Strip Sass's leading BOM from the unlayered sass output before copying, so
  // the default exports (./components.css, ./styles/*) ship BOM-free.
  stripBomFromCssInDir(srcDir);
  for (const name of UNLAYERED_DEFAULTS) {
    const defaultsCssSrc = path.join(dirname, "dist", name);
    if (fs.existsSync(defaultsCssSrc)) {
      const content = fs.readFileSync(defaultsCssSrc, "utf8");
      const stripped = stripBom(content);
      if (stripped !== content) fs.writeFileSync(defaultsCssSrc, stripped, "utf8");
    }
  }

  // Read all component directories
  const components = fs.readdirSync(srcDir);

  components.forEach((component) => {
    const componentSrcPath = path.join(srcDir, component);
    const componentStylesheetName = `${camelCase(component)}.css`;

    // Skip if not a directory
    if (!fs.statSync(componentSrcPath).isDirectory()) {
      return;
    }

    const stylePath = path.join(componentSrcPath, componentStylesheetName);
    const distFile = path.join(distDir, componentStylesheetName);
    if (fs.existsSync(stylePath)) {
      fs.copyFileSync(stylePath, distFile);
    } else {
      console.warn(`No stylesheet found for ${component}`);
    }
  });

  const indexCSSContent = fs.readFileSync(path.join(srcDir, "index.css"), "utf8");
  fs.writeFileSync(path.join(distDir, "index.css"), indexCSSContent);

  const cssUtilsSrc = fs.readFileSync(path.join(dirname, "src", "cssUtils.scss"), "utf8");
  fs.writeFileSync(path.join(distDir, "cssUtils.scss"), cssUtilsSrc);

  for (const name of UNLAYERED_DEFAULTS) {
    const defaultsCssPath = path.join(dirname, "dist", name);
    if (fs.existsSync(defaultsCssPath)) {
      fs.copyFileSync(defaultsCssPath, path.join(distDir, name));
    }
  }

  // Emit the opt-in layered mirror (./layered-components.css and
  // ./layered/styles/*). The default exports above stay unlayered — see
  // README "Styling integration".
  writeLayeredCopy(
    path.join(srcDir, "index.css"),
    path.join(dirname, "dist", "layered", "components", "index.css"),
  );
  mirrorStylesWithLayer(distDir, path.join(dirname, "dist", "layered", "styles"));

  // Fix .scss imports in compiled JS to point to .css files instead
  fixScssImportsInJs(path.join(dirname, "dist"));
}

try {
  copyCssFiles();
  console.log("CSS files copied successfully!");
} catch (error) {
  console.error("Error copying CSS files:", error);
  process.exit(1);
}
