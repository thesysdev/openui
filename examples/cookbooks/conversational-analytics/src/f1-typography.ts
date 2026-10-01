import { defaultLightTheme, type Theme } from "@openuidev/react-ui";

// Swap OpenUI's Inter for Titillium Web (served from public/fonts) and scale the type up.
const F1_FONT = '"Titillium Web", system-ui, sans-serif';
const BODY_SCALE = 1.25;
const HEADING_SCALE = 2;

const scalePx = (value: string, scale: number) =>
  value.replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${Math.round(Number(n) * scale)}px`);

// Derived from OpenUI's own default theme, not hand-written, so every font token is covered. Only
// font tokens are returned; ThemeProvider merges this partial theme over its defaults, so colours
// and spacing stay OpenUI's.
export const f1Theme: Theme = Object.fromEntries(
  Object.entries(defaultLightTheme).flatMap(([key, value]) => {
    if (typeof value !== "string" || (!value.includes('"Inter"') && !key.startsWith("fontSize"))) {
      return [];
    }
    if (key.startsWith("fontSize")) return [[key, scalePx(value, BODY_SCALE)]];
    if (!key.startsWith("text")) return [[key, F1_FONT]];

    const isHeading = key.includes("Heading");
    const font = scalePx(value, isHeading ? HEADING_SCALE : BODY_SCALE)
      .replace('"Inter", sans-serif', F1_FONT)
      .replace(/^[56]00 /, isHeading ? "900 " : "600 ");
    return [[key, font]];
  }),
);
