// A model-supplied color is written into an inline `style` attribute of the exported HTML, so
// only accept CSS color syntax (hex, named, rgb()/hsl()) and never free text that could add
// further declarations.
const CSS_COLOR_RE = /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,%\s/deg]+\))$/i;

export function safeColor(value: unknown, fallback: string): string {
  return typeof value === "string" && CSS_COLOR_RE.test(value.trim()) ? value.trim() : fallback;
}
