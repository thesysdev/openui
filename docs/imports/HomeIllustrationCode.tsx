import { Highlight, themes } from "prism-react-renderer";

type HomeIllustrationLanguage = "tsx" | "typescript" | "javascript";

export function HomeIllustrationCode({
  code,
  language = "tsx",
  className,
}: {
  code: string;
  language?: HomeIllustrationLanguage;
  className?: string;
}) {
  return (
    <Highlight theme={themes.vsDark} code={code.trimEnd()} language={language}>
      {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${highlightClassName} ${className ?? ""}`.trim()}
          style={{
            ...style,
            margin: 0,
            background: "transparent",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "0.7em",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          <code>
            {tokens.map((line, index) => (
              <div key={index} {...getLineProps({ line })}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
