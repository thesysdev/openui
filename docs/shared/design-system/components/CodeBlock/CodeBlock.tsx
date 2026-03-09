import type { ThemeMode } from "@design-system/types";
import { Highlight, themes } from "prism-react-renderer";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  code: string;
  language?: string;
  themeMode?: ThemeMode;
}

export default function CodeBlock({ code, language = "css", themeMode = "dark" }: CodeBlockProps) {
  const highlightTheme = themeMode === "light" ? themes.github : themes.vsDark;
  const wrapperThemeClass =
    themeMode === "light" ? styles.codeBlockWrapperLight : styles.codeBlockWrapperDark;

  return (
    <div className={`${styles.codeBlockWrapper} ${wrapperThemeClass}`} aria-label="Code snippet">
      <Highlight theme={highlightTheme} code={code.trim()} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} ${styles.codeBlock}`} style={style}>
            <code>
              {tokens.map((line, index) => (
                <div key={index} {...getLineProps({ line })} className={styles.codeLine}>
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
