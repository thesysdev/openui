import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, "../../../../../..");

describe("RTL logical start alignment", () => {
  it("uses logical text-align: start for default unaligned blocks while preserving explicit left modifiers", () => {
    const textBlockScss = readFileSync(resolve(here, "../textBlock.scss"), "utf8");
    expect(textBlockScss).toMatch(/\.openui-text-block\s*\{[\s\S]*?text-align:\s*start;/);
    expect(textBlockScss).toMatch(
      /\.openui-text-block--align-left\s*\{[\s\S]*?text-align:\s*left;/,
    );

    const tableScss = readFileSync(resolve(here, "../../Table/table.scss"), "utf8");
    expect(tableScss).toContain("justify-content: flex-start;");
    expect(tableScss).not.toContain("justify-content: left;");

    const dashboardTableStyles = readFileSync(
      resolve(rootDir, "packages/libraries/dashboard/src/components/tables/Table/table.styles.ts"),
      "utf8",
    );
    expect(dashboardTableStyles).toMatch(
      /\.openui-dashboard-table th\s*\{[\s\S]*?text-align:\s*start;/,
    );

    const markdownStyles = readFileSync(
      resolve(
        rootDir,
        "packages/libraries/intelligent-ui/src/components/Markdown/markdown.styles.ts",
      ),
      "utf8",
    );
    expect(markdownStyles).toMatch(/headCell:\s*css`[\s\S]*?text-align:\s*start;/);
    expect(markdownStyles).toMatch(/cell:\s*css`[\s\S]*?text-align:\s*start;/);
  });

  it("places editable table dividers and last-cell overrides on the same logical side", () => {
    const styles = readFileSync(
      resolve(
        rootDir,
        "packages/react-components/src/components/EditableTable/editableTable.styles.ts",
      ),
      "utf8",
    );
    for (const part of ["head", "cell"]) {
      const rules = styles.match(new RegExp(part + ":\\s*css`([^`]*)`"))?.[1];
      expect(rules).toMatch(/border-inline-end:\s*1px solid /);
      expect(rules).toMatch(/&:last-child\s*\{\s*border-inline-end:\s*0;/);
      expect(rules).not.toMatch(/border-(left|right):/);
    }
  });
});
