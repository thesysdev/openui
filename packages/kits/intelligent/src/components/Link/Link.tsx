import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { webUrl } from "../../shared/style";

export interface LinkProps {
  /** An absolute http(s) URL; anything else renders the text without a link. */
  url: string;
  /** The link text; without any, the URL's host name. */
  children?: ReactNode;
}

/** Opens an http(s) URL in a new tab. */
export function Link({ url, children }: LinkProps) {
  const href = webUrl(url);
  if (!href) return <span>{children}</span>;
  return (
    <a className="openui-intelligent-link" href={href} target="_blank" rel="noopener noreferrer">
      {children || new URL(href).hostname}
      <ArrowUpRight aria-hidden className="openui-intelligent-link-arrow" />
    </a>
  );
}
