import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CHART_CLASS_PREFIX } from "./utils/constants";

/**
 * Self-audit: every chart class, keyframe, and CSS custom property the charts
 * emits must be composed from CHART_CLASS_PREFIX (TS) / brand.$prefix (SCSS) —
 * never hardcoded — so the prefix stays a one-line rename. The only sanctioned
 * literal is the print/PPTX exporter data attribute (`data-openui-chart` — see
 * utils/constants.ts).
 */

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = THIS_DIR;

const walkFiles = (startDir: string): string[] => {
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
      continue;
    }
    files.push(absolutePath);
  }
  return files;
};

interface PrefixSource {
  relativePath: string;
  content: string;
}

const ALL_SOURCES: PrefixSource[] = walkFiles(SRC_DIR)
  .filter(
    (absolutePath) =>
      [".ts", ".tsx", ".scss"].includes(path.extname(absolutePath)) &&
      !/\.test\.tsx?$/.test(absolutePath),
  )
  .map((absolutePath) => ({
    relativePath: path.relative(SRC_DIR, absolutePath).split(path.sep).join("/"),
    content: fs.readFileSync(absolutePath, "utf8"),
  }));

const SCSS_SOURCES = ALL_SOURCES.filter(({ relativePath }) => relativePath.endsWith(".scss"));
const TS_SOURCES = ALL_SOURCES.filter(({ relativePath }) => !relativePath.endsWith(".scss"));

const stripSourceComments = (content: string): string =>
  content
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (comment) => " ".repeat(comment.length));

// The exporter contract attribute is the ONLY sanctioned brand literal; blank
// it (preserving offsets) before scanning. Word boundary on the right so
// `data-openui-chart-extra` still flags.
const EXPORT_ATTRIBUTE_RE = /\bdata-openui-chart(?![a-z0-9-])/g;
const blankExportAttributes = (content: string): string =>
  content.replace(EXPORT_ATTRIBUTE_RE, (token) => " ".repeat(token.length));

const BRANDS = CHART_CLASS_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// react-ui's theme tokens share the brand (`--openui-foreground`); a literal
// right after `--` is a theme CSS variable, not a chart class.
const PREFIX_LITERAL_RE = new RegExp(`(?<!--)\\b${BRANDS}-[a-z0-9-]+\\b`, "g");
const SCSS_LITERAL_SELECTOR_RE = new RegExp(`\\.${BRANDS}-[a-z0-9-]+`, "g");
const SCSS_LITERAL_CUSTOM_PROP_RE = new RegExp(`--${BRANDS}-[a-z0-9-]+`, "g");
const SCSS_LITERAL_KEYFRAMES_RE = new RegExp(`@keyframes\\s+${BRANDS}[-_][a-z0-9_-]+`, "g");
const SCSS_LITERAL_ANIMATION_REF_RE = new RegExp(
  `animation(?:-name)?\\s*:[^;]*\\b${BRANDS}[-_][a-z0-9_-]+`,
  "g",
);

const lineNumberAt = (content: string, index: number): number =>
  content.slice(0, index).split("\n").length;

const collectViolations = (sources: PrefixSource[], patterns: RegExp[]): string[] => {
  const violations: string[] = [];
  for (const { relativePath, content } of sources) {
    const stripped = blankExportAttributes(stripSourceComments(content));
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of stripped.matchAll(pattern)) {
        violations.push(
          `${relativePath}:${lineNumberAt(stripped, match.index)}:${match[0].trim()}`,
        );
      }
    }
  }
  return violations;
};

describe("Charts class prefix self-audit", () => {
  it("keeps the TS and SCSS prefix declarations mirrored", () => {
    const scss = fs.readFileSync(path.join(SRC_DIR, "_prefix.scss"), "utf8");
    const match = scss.match(/\$prefix:\s*([a-zA-Z0-9_-]+)\s*;/);
    expect(match?.[1]).toBe(CHART_CLASS_PREFIX);
    expect(CHART_CLASS_PREFIX).toBe("openui");
  });

  it("bans hardcoded brand literals in TS/TSX sources", () => {
    const violations = collectViolations(TS_SOURCES, [PREFIX_LITERAL_RE]);
    expect(
      violations,
      [
        "Hardcoded chart brand literals found — compose from CHART_CLASS_PREFIX.",
        ...violations,
      ].join("\n"),
    ).toEqual([]);
  });

  it("bans literal brand selectors, custom properties, and keyframes in SCSS", () => {
    const violations = collectViolations(SCSS_SOURCES, [
      SCSS_LITERAL_SELECTOR_RE,
      SCSS_LITERAL_CUSTOM_PROP_RE,
      SCSS_LITERAL_KEYFRAMES_RE,
      SCSS_LITERAL_ANIMATION_REF_RE,
    ]);
    expect(
      violations,
      ["Hardcoded brand usage in SCSS — compose via #{brand.$prefix}.", ...violations].join("\n"),
    ).toEqual([]);
  });

  it("requires every non-barrel stylesheet to compose from the prefix partial", () => {
    const failures: string[] = [];
    for (const { relativePath, content } of SCSS_SOURCES) {
      if (relativePath === "_prefix.scss" || relativePath === "charts.scss") {
        continue;
      }
      const stripped = stripSourceComments(content);
      const usesPartial = /@use\s+['"][^'"]*prefix['"]\s+as\s+brand/.test(stripped);
      const referencesPrefix = stripped.includes("#{brand.$prefix}");
      if (!usesPartial || !referencesPrefix) {
        failures.push(
          `${relativePath}: ${usesPartial ? "" : "missing @use of the prefix partial as brand; "}${referencesPrefix ? "" : "never references #{brand.$prefix}"}`,
        );
      }
    }
    expect(
      failures,
      ["Stylesheets not composed from _prefix.scss:", ...failures].join("\n"),
    ).toEqual([]);
  });

  it("pins the exporter attribute contract", () => {
    for (const file of [
      "shared/core/ChartShell.tsx",
      "shared/cartesian/layouts/CartesianChartLayout.tsx",
    ]) {
      const stripped = stripSourceComments(fs.readFileSync(path.join(SRC_DIR, file), "utf8"));
      expect(stripped, `${file} must keep the exporter attribute`).toMatch(/data-openui-chart=/);
    }
  });
});
