import { INTER_LATIN_WOFF2_BASE64 } from "./font-data";

/**
 * Scoped family name: a plain `Inter` face would also restyle host page text
 * that asks for Inter, so the widget renders under its own family instead.
 */
export const INTER_FAMILY = "OpenUI Devtools Inter";

export const INTER_FONT_FACE = `@font-face{font-family:"${INTER_FAMILY}";font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${INTER_LATIN_WOFF2_BASE64}) format("woff2");}`;
