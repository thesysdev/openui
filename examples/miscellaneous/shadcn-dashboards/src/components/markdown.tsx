import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// The assistant's replies, as Markdown styled with the theme's tokens.
const components: Components = {
  p: ({ node: _node, ...props }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-3" {...props} />
  ),
  strong: ({ node: _node, ...props }) => <strong className="font-semibold" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a
      className="font-medium underline underline-offset-4 hover:text-foreground/80"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  ul: ({ node: _node, ...props }) => <ul className="my-3 ml-5 list-disc space-y-1" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="my-3 ml-5 list-decimal space-y-1" {...props} />,
  li: ({ node: _node, ...props }) => <li className="leading-7" {...props} />,
  h1: ({ node: _node, ...props }) => (
    <h3 className="mt-4 mb-2 text-base font-semibold" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h3 className="mt-4 mb-2 text-base font-semibold" {...props} />
  ),
  h3: ({ node: _node, ...props }) => <h3 className="mt-4 mb-2 text-sm font-semibold" {...props} />,
  code: ({ node: _node, ...props }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-sm [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="my-3 border-l-2 pl-4 text-muted-foreground" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => (
    <th className="border-b bg-muted/50 px-3 py-2 text-left font-medium" {...props} />
  ),
  td: ({ node: _node, ...props }) => <td className="border-b px-3 py-2" {...props} />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
