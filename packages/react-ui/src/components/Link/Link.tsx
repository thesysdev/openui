import clsx from "clsx";
import { AnchorHTMLAttributes, memo, useEffect, useRef, useState } from "react";
import { getFaviconUrl } from "../Sources/SourceContext";
import { useTheme } from "../ThemeProvider";

// Per-favicon outcome, so a domain doesn't retry and flicker on every streamed
// re-render: "ok" shows the cached image at once, "miss" goes straight to the globe.
const faviconStatus = new Map<string, "ok" | "miss">();

type Status = "loading" | "ok" | "miss";
const initialStatus = (src: string): Status =>
  src ? (faviconStatus.get(src) ?? "loading") : "miss";

// Inline (not the lazily imported icon set) so the slot is never empty.
const Globe = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

/**
 * Site favicon sized to the surrounding text. The globe shows while it loads
 * and stays if it fails, so the slot is never blank.
 */
export const LinkFavicon = memo(({ href }: { href?: string }) => {
  const src = getFaviconUrl(href, 64);
  const ref = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>(() => initialStatus(src));

  const settle = (next: "ok" | "miss") => {
    if (src) faviconStatus.set(src, next);
    setStatus(next);
  };

  // A server-rendered or cached image can finish before React attaches
  // onLoad/onError, so settle from the element's own state too.
  const check = (img: HTMLImageElement | null) => {
    if (!img?.complete) return;
    settle(img.naturalWidth > 16 ? "ok" : "miss");
  };

  useEffect(() => {
    setStatus(initialStatus(src));
    check(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <span
      className={clsx("openui-link-favicon", status === "ok" && "openui-link-favicon--loaded")}
      aria-hidden="true"
    >
      {status !== "ok" && <Globe />}
      {status !== "miss" && (
        <img
          src={src}
          alt=""
          decoding="async"
          // Google sees the linked domain, never the page it is shown on.
          referrerPolicy="no-referrer"
          ref={ref}
          onError={() => settle("miss")}
          // Google answers a miss with a 16x16 globe; treat it as one.
          onLoad={(e) => check(e.currentTarget)}
        />
      )}
    </span>
  );
});

LinkFavicon.displayName = "LinkFavicon";

export const isWebUrl = (href?: string) => !!href && /^https?:\/\//i.test(href);

export type FaviconLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * External link with the site's favicon before its text. Non-web hrefs
 * (mailto:, #anchors, relative paths) render as a plain link.
 */
export const FaviconLink = ({ href, children, className, ...props }: FaviconLinkProps) => {
  const { mode } = useTheme();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "openui-favicon-link",
        mode === "dark" && "openui-favicon-link--dark",
        className,
      )}
      {...props}
    >
      {isWebUrl(href) && (
        <>
          <LinkFavicon href={href} />
          {/* Word joiner: keeps the icon on the same line as the first word. */}
          {"⁠"}
        </>
      )}
      {children}
    </a>
  );
};
