import fs from "fs";
import { camelCase } from "lodash-es";
import path from "path";
import { fileURLToPath } from "url";

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

// Copy CSS files from src to dist
function copyCssFiles() {
  const srcDir = path.join(dirname, "dist", "components");
  const distDir = path.join(dirname, "dist", "styles");

  // Ensure the dist/styles directory exists
  ensureDirectoryExists(distDir);

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

  const defaultsCssPath = path.join(dirname, "dist", "openui-defaults.css");
  if (fs.existsSync(defaultsCssPath)) {
    fs.copyFileSync(defaultsCssPath, path.join(distDir, "openui-defaults.css"));
  }

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
