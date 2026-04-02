import clsx from "clsx";
import { memo } from "react";
import ReactMarkdown, { Components, type Options } from "react-markdown";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CodeBlock } from "../CodeBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableHead,
  TableHeadProps,
  TableHeader,
  TableRow,
} from "../Table";
import { useTheme } from "../ThemeProvider";

type TableAlignment = TableHeadProps["align"];

function toTableAlignment(align: string | undefined): TableAlignment {
  if (align === "left" || align === "center" || align === "right") return align;
  return undefined;
}

const MarkdownTableHead: Components["th"] = ({ align, ...props }) => (
  <TableHead {...(props as Omit<TableHeadProps, "align">)} align={toTableAlignment(align)} />
);

const MarkdownTableCell: Components["td"] = ({ align, ...props }) => (
  <TableCell {...(props as Omit<TableCellProps, "align">)} align={toTableAlignment(align)} />
);

const variantStyles = {
  clear: "",
  card: "openui-markdown-renderer-card",
  sunk: "openui-markdown-renderer-card-sunk",
};

export interface MarkDownRendererProps {
  variant?: "clear" | "card" | "sunk";
  textMarkdown: string;
  options?: Options;
  className?: string;
  isStreaming?: boolean;
}

export const MarkDownRenderer = memo((props: MarkDownRendererProps) => {
  const { mode } = useTheme();
  const theme = mode === "dark" ? vscDarkPlus : oneLight;
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");

      if (match || (!className && String(children).includes("\n"))) {
        const language = match?.[1] ?? "text";
        const codeString = String(children).trim();
        return <CodeBlock language={language} codeString={codeString} theme={theme} />;
      }

      return (
        <code className={clsx("openui-markdown-renderer-code", className)} {...props}>
          {children}
        </code>
      );
    },
    a({ href, children, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="openui-markdown-renderer-link"
          {...props}
        >
          {children}
        </a>
      );
    },
    table: Table,
    thead: TableHeader,
    th: MarkdownTableHead,
    tbody: TableBody,
    tr: TableRow,
    td: MarkdownTableCell,
  };

  const markdownProps = {
    ...props.options,
    components: { ...components, ...props.options?.components },
  };

  return (
    <div
      className={clsx(
        props["variant"] && variantStyles[props["variant"] as keyof typeof variantStyles],
        "openui-markdown-renderer",
        props.isStreaming && "openui-markdown-renderer--streaming",
        props.className,
      )}
    >
      <ReactMarkdown {...markdownProps}>{props.textMarkdown}</ReactMarkdown>
    </div>
  );
});
