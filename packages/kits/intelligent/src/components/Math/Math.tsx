import katex from "katex";
import "katex/dist/katex.min.css";

export interface MathBlockProps {
  /** A LaTeX formula, e.g. "E = mc^2". */
  tex: string;
  /** Sits in a line of text rather than on its own line. */
  inline?: boolean;
}

/** A LaTeX formula, rendered with KaTeX. */
export function MathBlock({ tex, inline }: MathBlockProps) {
  const html = katex.renderToString(tex, { displayMode: !inline, throwOnError: false, trust: false, strict: "ignore", output: "htmlAndMathml" });
  // KaTeX escapes its input and is configured without \href or \includegraphics.
  return inline ? <span className="iui-math" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="iui-math is-block" dangerouslySetInnerHTML={{ __html: html }} />;
}
