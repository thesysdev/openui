"use client";

import clsx from "clsx";
import { CheckCheck, Copy } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus";
import { IconButton } from "../IconButton";
import { codeBlockCopyButtonStyles, codeBlockStyles, names } from "./codeBlock.styles";

// The default frame is owned CSS so the stable class can override it. Keep code/token
// styles in the vendor API; explicit themes and replacement classes retain that API in full.
const defaultTokenTheme = { ...vscDarkPlus, 'pre[class*="language-"]': {} };

function CopyButton({ className, ...props }: ComponentProps<"button">) {
  const styles = codeBlockCopyButtonStyles;
  return <button {...props} className={clsx(styles.root, names.copyButton, className)} />;
}

export interface CodeBlockProps {
  /** Added to the wrapper, next to its own classes. */
  className?: string;
  /**
   * Replaces the highlighter's `openui-code-block-syntax-highlighter` class, and with it the
   * library's highlighter rules, when a parent owns those styles.
   */
  syntaxHighlighterClassName?: string;
  language: string;
  codeString: string;
  theme?: {
    [key: string]: React.CSSProperties;
  };
}

export const CodeBlock = ({
  language,
  codeString,
  theme,
  className,
  syntaxHighlighterClassName,
}: CodeBlockProps) => {
  const styles = codeBlockStyles;
  const [copied, setCopied] = useState(false);
  const useDefaultFrame = theme == null && syntaxHighlighterClassName == null;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className={clsx(styles.root, names.root, className)}>
      <IconButton
        onClick={handleCopy}
        variant="secondary"
        size={"small"}
        asChild
        data-state={copied ? "copied" : "idle"}
        icon={copied ? <CheckCheck /> : <Copy />}
        aria-label={copied ? "Copied to clipboard" : "Copy code"}
      >
        <CopyButton />
      </IconButton>
      <SyntaxHighlighter
        style={theme ?? (useDefaultFrame ? defaultTokenTheme : vscDarkPlus)}
        language={language}
        PreTag="div"
        className={
          syntaxHighlighterClassName ??
          clsx(
            useDefaultFrame && styles.defaultFrame,
            styles.syntaxHighlighter,
            names.syntaxHighlighter,
          )
        }
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
