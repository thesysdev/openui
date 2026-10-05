/**
 * Auto-mounts the OpenUI Inspect widget in development.
 *
 * This module runs as a top-level side effect when the web entry is loaded in
 * a browser. In production builds the whole block is dead-code-eliminated by
 * the consumer's bundler (the NODE_ENV condition folds to false), so
 * `@openuidev/devtools` never enters the production graph. The React Native
 * entry (index.native.ts) never imports this module.
 *
 * This module is inlined into the web entry (dist/index.*), which is listed
 * in package.json's `sideEffects` so bundlers preserve the side effect while
 * the rest of the package stays tree-shakeable.
 */

// Strict equality with "development" (rather than !== "production") keeps the
// widget out of test runners like Jest with jsdom, where NODE_ENV is "test".
// Defer the `document` check so bundlers (Next/Turbopack) cannot DCE the whole
// block by treating `typeof document` as `"undefined"` at compile time.
if (process.env.NODE_ENV === "development") {
  const AUTO_MOUNT_FLAG = Symbol.for("openui.devtools.autoMount");
  const flags = globalThis as { [key: symbol]: boolean | undefined };
  // Once per JS realm, even if multiple copies of this module load
  // (ESM/CJS dual build, multiple package versions).
  if (!flags[AUTO_MOUNT_FLAG]) {
    flags[AUTO_MOUNT_FLAG] = true;
    void Promise.resolve().then(() => {
      if (typeof document === "undefined") return;
      // Render <OpenUIDevtools /> — same public entry apps use manually. The
      // thin component fetches the CDN browser build and injects this app's
      // React / ReactDOM / react-lang. Pin major 0 so a protocol-breaking
      // release ships as @1 instead of taking every app down.
      void Promise.all([import("@openuidev/devtools"), import("react"), import("react-dom/client")])
        .then(([{ OpenUIDevtools }, React, ReactDOMClient]) => {
          const attach = () => {
            const host = document.createElement("div");
            host.setAttribute("data-openui-devtools-auto-mount", "");
            document.body.appendChild(host);
            ReactDOMClient.createRoot(host).render(
              React.createElement(OpenUIDevtools, {
                version: "0",
                __autoMounted: true,
              }),
            );
          };
          if (document.body) attach();
          else document.addEventListener("DOMContentLoaded", attach, { once: true });
        })
        .catch(() => {
          // Never let a devtools loading failure break the host app.
        });
    });
  }
}

export {};
