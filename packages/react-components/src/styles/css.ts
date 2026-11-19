import { css as gooberCss } from "goober";
import { createStyleTag } from "./styleTag";

// The browser's sheet. It is only ever appended to, never rewritten.
const SHEET_ID = "openui-styles";
// A layer name, or a dotted path of them such as `app.openui`, as `@layer` accepts.
const LAYER_NAME = /^-?[a-zA-Z_][\w-]*(\.-?[a-zA-Z_][\w-]*)*$/;

type Store = {
  // Every rule Goober has registered, unlayered.
  rules: string;
  // How much of `rules` is already on the page.
  written: number;
  emitted: boolean;
  // The layer of the rules last written to the page.
  emittedLayer: string | undefined;
  scheduled: boolean;
  layer: string | undefined;
};

// One store per page, shared by every copy of this module (an ESM and a CJS build, or two
// versions). Each copy's Goober then finds rules another copy registered and skips them.
const STORE = Symbol.for("@openuidev/react-components/styles");
const store: Store = ((globalThis as { [STORE]?: Store })[STORE] ??= {
  rules: "",
  written: 0,
  emitted: false,
  emittedLayer: undefined,
  scheduled: false,
  layer: undefined,
});

// Goober 2.1.19 also tells the browser from the server by `window`.
const inBrowser = () => typeof window === "object";

// Blocks with the same layer name join into one layer, so each write is wrapped on its own.
const wrap = (text: string, name = store.layer) =>
  name && text ? `@layer ${name}{${text}}` : text;

function write() {
  store.scheduled = false;
  const fresh = store.rules.slice(store.written);
  store.written = store.rules.length;
  if (!fresh) return;
  let tag = document.getElementById(SHEET_ID);
  if (!tag) {
    tag = createStyleTag();
    tag.id = SHEET_ID;
    // After the token defaults; otherwise first in <head>, ahead of app CSS.
    const anchor = document.getElementById("openui-defaults");
    if (anchor) anchor.after(tag);
    else document.head.prepend(tag);
  }
  const nonce = (window as Window & { __nonce__?: string }).__nonce__;
  if (nonce && tag.nonce !== nonce) tag.nonce = nonce;
  tag.append(wrap(fresh));
  store.emitted = true;
  store.emittedLayer = store.layer;
}

const sink = {
  get data() {
    return store.rules;
  },
  set data(next: string) {
    store.rules = next;
    if (inBrowser() && !store.scheduled) {
      store.scheduled = true;
      queueMicrotask(write);
    }
  },
};

// Goober 2.1.19 reads querySelector(…).firstChild.data in browsers and target.data on the server.
const target = {
  querySelector: () => ({ parentNode: true, firstChild: sink }),
  get data() {
    return sink.data;
  },
  set data(next: string) {
    sink.data = next;
  },
};

export type Css = typeof gooberCss;
export type Keyframes = typeof gooberCss;

export const css: Css = gooberCss.bind({ target });
// Goober's exported keyframes is already bound, so rebinding it would discard our target.
export const keyframes: Keyframes = gooberCss.bind({ target, k: 1 });

export type ConfigureStylesOptions = {
  /** App-wide cascade layer, or undefined for unlayered component rules. */
  layer?: string;
};

// Bundlers replace `process.env.NODE_ENV` but leave `process` undefined, so a `typeof process`
// check would silence browser builds. An unbundled browser or a CDN ESM build has no `process`.
// Keep the dot form: Vite's dev server does not replace `process.env["NODE_ENV"]`.
function development(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

/** Sets the cascade layer for component rules. Call it once in the app entry, before rendering. */
export function configureStyles(options: ConfigureStylesOptions): void {
  if (options.layer !== undefined && !LAYER_NAME.test(options.layer)) {
    if (development()) {
      console.warn(
        `[OpenUI] configureStyles layer "${options.layer}" is not a cascade layer name. It is ignored.`,
      );
    }
    return;
  }
  if (
    store.emitted &&
    options.layer !== store.layer &&
    options.layer !== store.emittedLayer &&
    development()
  ) {
    console.warn(
      "[OpenUI] configureStyles was called after component rules were written. " +
        "Existing page rules cannot be re-layered. Configure once in the app entry, before rendering.",
    );
  }
  store.layer = options.layer;
}
