/**
 * Entry point for the browser build (dist/devtools.browser.js). Fetched at
 * runtime by the thin npm wrapper / react-lang bootstrap — not imported as a
 * normal package entry.
 *
 * This file is the only thing evaluated eagerly. `./OpenUIDevtoolsWidget` (and
 * everything it pulls in — theme.ts's module-scope `createContext`,
 * DebugUI's `class ... extends Component`) is reached only through the
 * dynamic import() below, so the slot below is always filled — real React,
 * not the browser-shims/* placeholders — before any of that runs.
 */
import { slot } from "./browser-shims/slots";
import type { OpenUIDevtoolsWidgetProps } from "./types";

const BUS_KEY = Symbol.for("openui.observability");

/** @internal Called by the thin package wrapper after it loads this file. */
export interface MountOptions {
  React: typeof import("react");
  ReactDOM: typeof import("react-dom");
  ReactDOMClient: typeof import("react-dom/client");
  /** Closed over the host's module graph — the browser build never imports
   *  "@openuidev/react-lang" itself. Required so Debug can parse/render. */
  loadReactLang: () => Promise<unknown>;
  /** Widget props from `<OpenUIDevtools />` (theme, position, …). */
  props?: OpenUIDevtoolsWidgetProps;
  /** Explicit bus, mainly for tests. Defaults to the Symbol.for singleton
   *  that "@openuidev/observability" itself publishes to. */
  bus?: import("@openuidev/observability").Observability;
}

/** @internal Mounts the widget; call the returned function to unmount. */
export function mountOpenUIDevtools(opts: MountOptions): () => void {
  const bus = opts.bus ?? (globalThis as { [BUS_KEY]?: unknown })[BUS_KEY];
  if (!bus) {
    console.warn(
      "[@openuidev/devtools] no observability bus found on globalThis — import " +
        '"@openuidev/observability" before mounting. Widget not mounted.',
    );
    return () => {};
  }

  slot.react = opts.React;
  slot.reactDOM = opts.ReactDOM;
  slot.bus = bus as import("@openuidev/observability").Observability;
  slot.loadReactLang = opts.loadReactLang;

  let cancelled = false;
  let unmount = () => {
    cancelled = true;
  };

  import("./OpenUIDevtoolsWidget").then(({ OpenUIDevtoolsWidget }) => {
    if (cancelled) return;

    const attach = () => {
      if (cancelled || !document.body) return;
      const host = document.createElement("div");
      host.setAttribute("data-openui-devtools-root", "");
      document.body.appendChild(host);
      const root = opts.ReactDOMClient.createRoot(host);
      root.render(opts.React.createElement(OpenUIDevtoolsWidget, opts.props ?? {}));
      unmount = () => {
        root.unmount();
        host.remove();
      };
    };

    if (document.body) attach();
    else document.addEventListener("DOMContentLoaded", attach, { once: true });
  });

  return () => unmount();
}
