import clsx from "clsx";
import { CheckCheck, Copy, SquareTerminal } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider";
import { openuiLightTheme } from "./lightTheme";

export interface CodeBlockProps {
  language: string;
  codeString: string;
  theme?: {
    [key: string]: React.CSSProperties;
  };
}

const SHELL_LANGUAGES = new Set(["bash", "sh", "shell", "zsh", "console"]);

export const CodeBlock = ({ language, codeString, theme }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  // Without an explicit theme, follow the app: light syntax theme in light
  // mode, dark in dark mode, so the copy button matches the surface.
  const { mode } = useTheme();
  const syntaxTheme = theme ?? (mode === "dark" ? vscDarkPlus : openuiLightTheme);

  const isShell = SHELL_LANGUAGES.has(language?.toLowerCase());
  const isSingleLine = !codeString.trim().includes("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div
      className={clsx("openui-code-block-wrapper", {
        "openui-code-block-wrapper--single-line": isSingleLine,
        "openui-code-block-wrapper--shell": isShell,
      })}
    >
      {isShell && <SquareTerminal className="openui-code-block-shell-icon" aria-hidden />}
      <IconButton
        onClick={handleCopy}
        variant="tertiary"
        size="extra-small"
        className={clsx("openui-code-block-copy-button", {
          "openui-code-block-copy-button-copied": copied,
        })}
        icon={copied ? <CheckCheck /> : <Copy />}
        aria-label={copied ? "Copied to clipboard" : "Copy code"}
      />
      <SyntaxHighlighter
        style={syntaxTheme}
        language={language}
        PreTag="div"
        className="openui-code-block-syntax-highlighter"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
