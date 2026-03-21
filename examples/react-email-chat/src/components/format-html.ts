const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

export function formatHtml(html: string): string {
  const s = html.replace(/>\s+</g, "><").trim();
  const out: string[] = [];
  let indent = 0;
  let i = 0;

  while (i < s.length) {
    if (s.startsWith("<!--", i)) {
      const end = s.indexOf("-->", i + 4);
      const closeIdx = end === -1 ? s.length : end + 3;
      out.push("  ".repeat(indent) + s.slice(i, closeIdx));
      i = closeIdx;
      continue;
    }

    if (s.startsWith("<!", i) || s.startsWith("<?", i)) {
      const end = s.indexOf(">", i);
      const closeIdx = end === -1 ? s.length : end + 1;
      out.push("  ".repeat(indent) + s.slice(i, closeIdx));
      i = closeIdx;
      continue;
    }

    if (s.startsWith("</", i)) {
      const end = s.indexOf(">", i);
      const closeIdx = end === -1 ? s.length : end + 1;
      indent = Math.max(0, indent - 1);
      out.push("  ".repeat(indent) + s.slice(i, closeIdx));
      i = closeIdx;
      continue;
    }

    if (s[i] === "<") {
      const end = s.indexOf(">", i);
      const closeIdx = end === -1 ? s.length : end + 1;
      const tag = s.slice(i, closeIdx);

      const nameMatch = tag.match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);
      const tagName = nameMatch ? nameMatch[1]!.toLowerCase() : "";
      const isSelfClosing = tag.endsWith("/>") || VOID_ELEMENTS.has(tagName);

      if (tagName === "style" || tagName === "script") {
        const closeTag = `</${tagName}>`;
        const closeStart = s.indexOf(closeTag, closeIdx);
        if (closeStart !== -1) {
          const innerContent = s.slice(closeIdx, closeStart);
          out.push("  ".repeat(indent) + tag);
          const lines = innerContent.split("\n").map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            out.push("  ".repeat(indent + 1) + line);
          }
          if (lines.length === 0 && innerContent.trim()) {
            out.push("  ".repeat(indent + 1) + innerContent.trim());
          }
          out.push("  ".repeat(indent) + closeTag);
          i = closeStart + closeTag.length;
          continue;
        }
      }

      out.push("  ".repeat(indent) + tag);
      if (!isSelfClosing) {
        indent++;
      }
      i = closeIdx;

      if (i < s.length && s[i] !== "<") {
        const nextTag = s.indexOf("<", i);
        const textContent = nextTag === -1 ? s.slice(i) : s.slice(i, nextTag);

        if (textContent.length < 80 && nextTag !== -1 && s.startsWith("</", nextTag)) {
          const closeEnd = s.indexOf(">", nextTag);
          const closeTag = s.slice(nextTag, closeEnd + 1);
          indent = Math.max(0, indent - 1);
          out[out.length - 1] = "  ".repeat(indent) + tag + textContent + closeTag;
          i = closeEnd + 1;
        } else if (textContent.trim()) {
          out.push("  ".repeat(indent) + textContent.trim());
          i = nextTag === -1 ? s.length : nextTag;
        } else {
          i = nextTag === -1 ? s.length : nextTag;
        }
      }
      continue;
    }

    const nextTag = s.indexOf("<", i);
    const text = (nextTag === -1 ? s.slice(i) : s.slice(i, nextTag)).trim();
    if (text) {
      out.push("  ".repeat(indent) + text);
    }
    i = nextTag === -1 ? s.length : nextTag;
  }

  return out.join("\n");
}
