import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  mirrorStylesWithLayer,
  UNLAYERED_DEFAULTS,
  wrapInLayer,
  writeLayeredCopy,
} from "./css-layer-utils.mjs";

describe("wrapInLayer", () => {
  it("wraps plain css in @layer openui", () => {
    expect(wrapInLayer(".a{color:red}")).toBe("@layer openui{.a{color:red}}");
  });

  it("strips a leading BOM before wrapping so the first rule stays valid", () => {
    // U+FEFF inside a layer block parses as an identifier and kills the
    // first rule (e.g. the :root theme tokens) — the 2026-06 BOM incident.
    expect(wrapInLayer("\uFEFF:root{--x:1}")).toBe("@layer openui{:root{--x:1}}");
  });

  it("is idempotent", () => {
    const once = wrapInLayer(".a{color:red}");
    expect(wrapInLayer(once)).toBe(once);
  });

  it("leaves empty/whitespace-only content untouched", () => {
    expect(wrapInLayer("")).toBe("");
    expect(wrapInLayer("  \n")).toBe("  \n");
  });
});

describe("writeLayeredCopy", () => {
  it("writes a wrapped copy, creating parent directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-"));
    const src = path.join(dir, "in.css");
    const dest = path.join(dir, "nested", "out.css");
    fs.writeFileSync(src, ".a{color:red}");
    writeLayeredCopy(src, dest);
    expect(fs.readFileSync(dest, "utf8")).toBe("@layer openui{.a{color:red}}");
  });
});

describe("mirrorStylesWithLayer", () => {
  it("wraps css files, copies unwrapped names verbatim, skips non-css", () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-src-"));
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-dest-")), "layered");
    fs.writeFileSync(path.join(src, "button.css"), ".b{color:red}");
    fs.writeFileSync(path.join(src, "openui-defaults.css"), ":root{--x:1}");
    fs.writeFileSync(path.join(src, "cssUtils.scss"), "$x: 1;");
    mirrorStylesWithLayer(src, dest);
    expect(fs.readFileSync(path.join(dest, "button.css"), "utf8")).toBe("@layer openui{.b{color:red}}");
    expect(fs.readFileSync(path.join(dest, "openui-defaults.css"), "utf8")).toBe(":root{--x:1}");
    expect(fs.existsSync(path.join(dest, "cssUtils.scss"))).toBe(false);
  });

  it("keeps the scheme-pinned defaults unlayered", () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-src-"));
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-dest-")), "layered");
    for (const name of UNLAYERED_DEFAULTS) {
      fs.writeFileSync(path.join(src, name), ":root{--x:1}");
    }
    mirrorStylesWithLayer(src, dest);
    expect(UNLAYERED_DEFAULTS).toContain("openui-defaults-light.css");
    expect(UNLAYERED_DEFAULTS).toContain("openui-defaults-dark.css");
    for (const name of UNLAYERED_DEFAULTS) {
      expect(fs.readFileSync(path.join(dest, name), "utf8")).toBe(":root{--x:1}");
    }
  });
});

describe("scheme-pinned defaults (generated)", () => {
  const read = (name) => fs.readFileSync(path.join(import.meta.dirname, "src", name), "utf8");
  const tokens = (css) =>
    [...css.matchAll(/^\s*(--openui-[\w-]+):\s*(.+);$/gm)].map((m) => m.slice(1));

  it("carry the same token names as openui-defaults.scss, with no media query", () => {
    const base = tokens(read("openui-defaults.scss"));
    // base file lists light tokens then dark overrides; compare against the light block.
    const baseLight = tokens(read("openui-defaults.scss").split("@media")[0]);
    for (const file of ["openui-defaults-light.scss", "openui-defaults-dark.scss"]) {
      const css = read(file);
      expect(css).not.toContain("prefers-color-scheme");
      expect(tokens(css).map(([k]) => k)).toEqual(baseLight.map(([k]) => k));
    }
    expect(base.length).toBeGreaterThan(baseLight.length);
  });

  it("light equals the light tokens and dark applies the dark overrides", () => {
    const [baseCss, darkOverrides] = read("openui-defaults.scss").split("@media");
    const light = new Map(tokens(read("openui-defaults-light.scss")));
    const dark = new Map(tokens(read("openui-defaults-dark.scss")));
    expect(light).toEqual(new Map(tokens(baseCss)));
    for (const [key, value] of tokens(darkOverrides)) {
      expect(dark.get(key)).toBe(value);
    }
    // A scheme-independent token (spacing) is identical in both.
    expect(dark.get("--openui-space-000")).toBe(light.get("--openui-space-000"));
    expect(dark.get("--openui-background")).not.toBe(light.get("--openui-background"));
  });
});
