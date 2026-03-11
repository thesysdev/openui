// @ts-nocheck
"use client";

import {
  FoundationTable,
  PreviewCode,
  PreviewPage,
  PreviewSection,
} from "@design-system/components/preview";
import tableStyles from "@design-system/components/preview/FoundationTokenTable.module.css";
import { useMemo } from "react";

function formatShadowLabel(token) {
  const rawLabel = token.replace("--shadow-", "");
  if (/^[a-z]+$/.test(rawLabel)) {
    return `${rawLabel.charAt(0).toUpperCase()}${rawLabel.slice(1)}`;
  }
  return rawLabel.toUpperCase();
}

function getDeclaredTokenMap() {
  if (typeof document === "undefined") return {};

  const baseDeclared = {};
  const darkDeclared = {};

  const assignDeclared = (target, style: CSSStyleDeclaration) => {
    Array.from(style).forEach((propertyName: string) => {
      if (propertyName.startsWith("--")) {
        target[propertyName] = style.getPropertyValue(propertyName).trim();
      }
    });
  };

  Array.from(document.styleSheets).forEach((sheet) => {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      return;
    }
    if (!rules) return;

    Array.from(rules).forEach((rule) => {
      const styleRule = rule as CSSStyleRule;
      const style = styleRule.style;
      if (!style) return;

      const selector = typeof styleRule.selectorText === "string" ? styleRule.selectorText : "";
      if (selector.includes('[data-theme="dark"]')) {
        assignDeclared(darkDeclared, style);
        return;
      }

      if (selector.includes(":root")) {
        assignDeclared(baseDeclared, style);
      }
    });
  });

  const isDark = document.documentElement.dataset.theme === "dark";
  return isDark ? { ...baseDeclared, ...darkDeclared } : baseDeclared;
}

function resolveDeclaredValue(value, declaredMap, visited = new Set()) {
  if (!value || !value.includes("var(")) return value;

  return value.replace(/var\((--[^),\s]+)\)/g, (_, varName) => {
    if (visited.has(varName)) return `var(${varName})`;
    const declared = declaredMap[varName];
    if (!declared) return `var(${varName})`;

    const nextVisited = new Set(visited);
    nextVisited.add(varName);
    return resolveDeclaredValue(declared, declaredMap, nextVisited);
  });
}

function srgbChannelToLinear(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.04045) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function formatNumber(value, maxDecimals = 3) {
  const rounded = Number(value.toFixed(maxDecimals));
  if (!Number.isFinite(rounded)) return "0";
  if (Math.abs(rounded) < 0.0005) return "0";
  return `${rounded}`;
}

function rgbaToOklchDisplay(r, g, b, alpha = 1) {
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);

  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const lCbrt = Math.cbrt(l);
  const mCbrt = Math.cbrt(m);
  const sCbrt = Math.cbrt(s);

  const okl = 0.2104542553 * lCbrt + 0.793617785 * mCbrt - 0.0040720468 * sCbrt;
  const oka = 1.9779984951 * lCbrt - 2.428592205 * mCbrt + 0.4505937099 * sCbrt;
  const okb = 0.0259040371 * lCbrt + 0.7827717662 * mCbrt - 0.808675766 * sCbrt;

  const c = Math.sqrt(oka * oka + okb * okb);
  const h = (Math.atan2(okb, oka) * 180) / Math.PI;
  const hue = c < 1e-6 ? 0 : h < 0 ? h + 360 : h;
  const alphaString = Number.isFinite(alpha) ? formatNumber(alpha, 3) : "1";

  return `oklch(${formatNumber(okl)} ${formatNumber(c)} ${formatNumber(hue, 2)} / ${alphaString})`;
}

function hexToOklchDisplay(hexValue) {
  const hex = hexValue.replace("#", "");
  let red;
  let green;
  let blue;
  let alpha = 1;

  if (hex.length === 3 || hex.length === 4) {
    red = Number.parseInt(`${hex[0]}${hex[0]}`, 16);
    green = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
    blue = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
    if (hex.length === 4) alpha = Number.parseInt(`${hex[3]}${hex[3]}`, 16) / 255;
  } else if (hex.length === 6 || hex.length === 8) {
    red = Number.parseInt(hex.slice(0, 2), 16);
    green = Number.parseInt(hex.slice(2, 4), 16);
    blue = Number.parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) alpha = Number.parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return hexValue;
  }

  return rgbaToOklchDisplay(red, green, blue, alpha);
}

function rgbStringToOklchDisplay(rgbValue) {
  const match = rgbValue.match(/rgba?\(([^)]+)\)/i);
  if (!match) return rgbValue;

  const channels = match[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map((part) => Number.parseFloat(part));

  if (channels.length < 3 || channels.some((value) => Number.isNaN(value))) return rgbValue;
  const [r, g, b, a = 1] = channels;
  return rgbaToOklchDisplay(r, g, b, a);
}

function normalizeShadowValueToOklch(value) {
  if (!value || value === "none") return value;

  let normalized = value;
  normalized = normalized.replace(
    /#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})\b/g,
    (hex) => hexToOklchDisplay(hex),
  );
  normalized = normalized.replace(/rgba?\([^)]+\)/gi, (rgb) => rgbStringToOklchDisplay(rgb));
  return normalized;
}

export default function ShadowsPreviewPage() {
  const shadowTokens = useMemo(
    () => [
      "--shadow-none",
      "--shadow-s",
      "--shadow-m",
      "--shadow-l",
      "--shadow-xl",
      "--shadow-2xl",
      "--shadow-3xl",
    ],
    [],
  );

  const tokenValues = useMemo(() => {
    if (typeof window === "undefined") return {};

    const computedStyles = getComputedStyle(document.documentElement);
    const declaredMap = getDeclaredTokenMap();
    const map = {};
    shadowTokens.forEach((token) => {
      const declared = declaredMap[token];
      const resolvedDeclared = resolveDeclaredValue(declared, declaredMap);
      const rawValue = resolvedDeclared || computedStyles.getPropertyValue(token).trim() || "none";
      map[token] = normalizeShadowValueToOklch(rawValue);
    });
    return map;
  }, [shadowTokens]);

  const shadowCode = `:root {
  --shadow-none: none;
  --shadow-s: 0 1px 3px -2px oklch(0 0 0 / 0.02), 0 2px 5px -2px oklch(0 0 0 / 0.04);
  --shadow-m: 0 4px 6px -2px oklch(0 0 0 / 0.025), 0 2px 2px -2px oklch(0 0 0 / 0.05);
  --shadow-l: 0 4px 4px -2px oklch(0 0 0 / 0.05), 0 4px 8px -2px oklch(0 0 0 / 0.04);
  --shadow-xl: 0 12px 28px var(--swatch-black-a20);
}`;

  const shadowItems = useMemo(
    () => shadowTokens.map((token) => ({ token, value: tokenValues[token] ?? "..." })),
    [shadowTokens, tokenValues],
  );

  return (
    <PreviewPage>
      <PreviewSection
        title="Shadows"
        headingLevel="h1"
        description="Elevation tokens represent depth and hierarchy for surfaces like cards, modals, and dropdowns."
      >
        <FoundationTable
          columns={[
            { key: "name", label: "Name" },
            { key: "value", label: "Variable value" },
            { key: "className", label: "Class name" },
          ]}
        >
          {shadowItems.map((item) => (
            <tr key={item.token} className={tableStyles.foundationTableBodyRow}>
              <td className={tableStyles.foundationTableCell}>
                <span>{formatShadowLabel(item.token)}</span>
              </td>
              <td className={tableStyles.foundationTableCell}>
                <code className={tableStyles.foundationTokenName}>{item.value ?? "..."}</code>
              </td>
              <td className={tableStyles.foundationTableCell}>
                <code className={tableStyles.foundationTokenName}>{item.token}</code>
              </td>
            </tr>
          ))}
        </FoundationTable>
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Shadow components preview coming soon.
        </div>
        <PreviewCode code={shadowCode} />
      </PreviewSection>
    </PreviewPage>
  );
}
