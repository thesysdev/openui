import clsx from "clsx";
import { CheckCheck, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { IconButton } from "../IconButton";

export interface CodeBlockProps {
  language: string;
  codeString: string;
  theme?: {
    [key: string]: React.CSSProperties;
  };
}

export const CodeBlock = ({ language, codeString, theme }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="openui-code-block-wrapper">
      <IconButton
        onClick={handleCopy}
        variant="secondary"
        size={"small"}
        className={clsx("openui-code-block-copy-button", {
          "openui-code-block-copy-button-copied": copied,
        })}
        icon={copied ? <CheckCheck /> : <Copy />}
      />
      <SyntaxHighlighter
        style={theme ?? vscDarkPlus}
        language={language}
        PreTag="div"
        className="openui-code-block-syntax-highlighter"
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};
