import fs from "fs";
import { camelCase } from "lodash-es";
import path from "path";

// Get the directory name of the current file
const dirname = path.dirname(new URL(import.meta.url).pathname);

// Generate index.scss with @forward statements
function generateScssIndex() {
  // Go up one directory to reach src, then into components
  const srcDir = path.join(dirname, "..", "components");
  let indexScssContent = '@use "../openui-defaults.scss";\n\n';

  // Read all component directories
  // this produces an array of all the component directories
  const components = fs.readdirSync(srcDir);

  // this iterates over the array of component directories
  // for each component, it gets the component's source path and stylesheet name
  components.forEach((component) => {
    const componentSrcPath = path.join(srcDir, component);
    const componentStylesheetName = `${camelCase(component)}.scss`;

    // if the component is not a directory, it skips it
    if (!fs.statSync(componentSrcPath).isDirectory()) {
      return;
    }

    // this gets the path to the component's stylesheet
    const stylePath = path.join(componentSrcPath, componentStylesheetName);

    // if the stylesheet exists, it adds a forward statement to the index.scss file
    if (fs.existsSync(stylePath)) {
      // this creates a relative path from the index.scss file to the component's stylesheet
      const relativePath = `./${component}/${componentStylesheetName}`;

      // this appends the forward statement to the indexScssContent variable
      indexScssContent += `@forward "${relativePath}";\n`;
    } else {
      // if the stylesheet does not exist, it logs a warning
      if (component !== "ThemeProvider") {
        console.warn(`No SCSS file found for ${component}`);
      }
    }
  });

  // Write to index.scss (in the components directory)
  const indexScssPath = path.join(dirname, "..", "components", "index.scss");
  fs.writeFileSync(indexScssPath, indexScssContent);
}

try {
  generateScssIndex();
  console.log("index.scss generated successfully!");
} catch (error) {
  console.error("Error generating index.scss:", error);
  process.exit(1);
}
