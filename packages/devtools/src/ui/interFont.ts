import { INTER_LATIN_WOFF2_BASE64 } from "./interFontData";

/**
 * Scoped family name: a plain `Inter` face would also restyle host page text
 * that asks for Inter, so the widget renders under its own family instead.
 */
export const INTER_FAMILY = "OpenUI Devtools Inter";

const STYLE_ID = "openui-devtools-font";

const FONT_FACE = `@font-face{font-family:"${INTER_FAMILY}";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${INTER_LATIN_WOFF2_BASE64}) format("woff2");}`;

/** Installs the bundled Inter face once per document. */
export function ensureInterFont(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = FONT_FACE;
  doc.head.appendChild(style);
}
