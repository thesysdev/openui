import type { OpenUIDevtoolsProps, OpenUIDevtoolsWidgetProps } from "./types";

/** Major (`0`), minor (`0.1`), or exact (`0.1.0`). */
const VERSION_RE = /^\d+(\.\d+){0,2}$/;

/**
 * Normalize a CDN version pin. Returns `"latest"` when omitted/empty.
 * Returns `null` when the string is present but not a major/minor/exact pin.
 */
export function normalizeCdnVersion(version?: string): string | null {
  const trimmed = version?.trim();
  if (!trimmed) return "latest";
  return VERSION_RE.test(trimmed) ? trimmed : null;
}

/**
 * jsDelivr URL for the browser bundle.
 * Omit `version` → `@latest`. Otherwise major (`"0"`), minor (`"0.1"`),
 * or exact (`"0.1.0"`) npm tags.
 */
const ALIAS_CACHE_MS = 5 * 60 * 1000;

export function browserBundleUrl(version?: string): string | null {
  const tag = normalizeCdnVersion(version);
  if (tag === null) return null;
  const url = `https://cdn.jsdelivr.net/npm/@openuidev/devtools@${tag}/dist/devtools.browser.js`;
  if (/^\d+\.\d+\.\d+$/.test(tag)) return url;
  return `${url}?t=${Math.floor(Date.now() / ALIAS_CACHE_MS)}`;
}

export type MountFromCdnOptions = OpenUIDevtoolsProps;

type BrowserModule = {
  mountOpenUIDevtools: (opts: {
    React: typeof import("react");
    ReactDOM: typeof import("react-dom");
    ReactDOMClient: typeof import("react-dom/client");
    loadReactLang: () => Promise<unknown>;
    props?: OpenUIDevtoolsWidgetProps;
  }) => () => void;
};

/**
 * Fetches the CDN browser bundle and mounts it with the host's React /
 * ReactDOM / react-lang. Used by `<OpenUIDevtools />` and by react-lang's
 * auto-mount (with `version: "0"`).
 */
export function mountOpenUIDevtoolsFromCdn(opts: MountFromCdnOptions = {}): () => void {
  const { version, enabled, ...widgetProps } = opts;
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");

  if (!isEnabled || typeof document === "undefined") {
    return () => {};
  }

  const url = browserBundleUrl(version);
  if (url === null) {
    console.warn(
      `[@openuidev/devtools] invalid version "${version?.trim()}" — use a major ("0"), ` +
        `minor ("0.1"), or exact ("0.1.0") pin. Widget not mounted.`,
    );
    return () => {};
  }

  let cancelled = false;
  let unmount = () => {
    cancelled = true;
  };

  Promise.all([
    import(/* webpackIgnore: true */ /* @vite-ignore */ url) as Promise<BrowserModule>,
    import("react"),
    import("react-dom"),
    import("react-dom/client"),
  ])
    .then(([devtools, react, reactDom, reactDomClient]) => {
      if (cancelled) return;
      const attach = () => {
        if (cancelled) return;
        unmount = devtools.mountOpenUIDevtools({
          React: react,
          ReactDOM: reactDom,
          ReactDOMClient: reactDomClient,
          // Closed over this module's graph so the bundler resolves it —
          // the CDN file never imports "@openuidev/react-lang" itself.
          loadReactLang: () => import("@openuidev/react-lang"),
          props: {
            ...widgetProps,
            enabled,
          },
        });
      };
      if (document.body) attach();
      else document.addEventListener("DOMContentLoaded", attach, { once: true });
    })
    .catch(() => {
      // Never let a CDN / mount failure break the host app.
    });

  return () => unmount();
}
