import { css as gooberCss } from "goober";
import { createStyleTag } from "./styleTag";

// The browser's sheet. It is only ever appended to, never rewritten.
const SHEET_ID = "openui-styles";
// Server-rendered sheets: <ComponentStyles> (React gives it data-href), a hand-written tag with the
// attribute, or plain HTML using the browser's own id. The browser only reads them.
const SERVER_SHEET = `style[data-href="${SHEET_ID}"], style[data-openui-styles], style#${SHEET_ID}`;
// A layer name, or a dotted path of them such as `app.openui`, as `@layer` accepts.
const LAYER_NAME = /^-?[a-zA-Z_][\w-]*(\.-?[a-zA-Z_][\w-]*)*$/;

// Every rule Goober has registered, unlayered. In the browser it starts with the server sheet.
let rules = "";
// How much of `rules` is already on the page.
let written = 0;
let emitted = false;
// The layer of the rules last emitted: written in the browser, read from a server sheet, or
// returned by getComponentStyles on the server, whose `layer` option leaves `layer` unchanged.
let emittedLayer: string | undefined;
let seeded = false;
let scheduled = false;
let layer: string | undefined;

// Goober 2.1.19 also tells the browser from the server by `window`.
const inBrowser = () => typeof window === "object";

// Blocks with the same layer name join into one layer, so each write is wrapped on its own.
const wrap = (text: string, name = layer) => (name && text ? `@layer ${name}{${text}}` : text);

// The server sheet holds every rule verbatim, layered or not, so Goober's indexOf dedupe skips
// them and the browser writes only what the server did not send.
function seed() {
  if (seeded || !inBrowser()) return;
  seeded = true;
  for (const tag of document.querySelectorAll(SERVER_SHEET)) {
    const text = tag.textContent ?? "";
    rules += text;
    if (!text.trim()) continue;
    // A layered server sheet names its layer; rules the browser adds go in the same one. A
    // hand-written tag may start with whitespace before it.
    const named = /^@layer ([^\s{]+)\{/.exec(text.trimStart())?.[1];
    layer ??= named;
    emitted = true;
    emittedLayer = named;
  }
  written = rules.length;
}

function write() {
  scheduled = false;
  const fresh = rules.slice(written);
  written = rules.length;
  if (!fresh) return;
  let tag = document.getElementById(SHEET_ID);
  if (!tag) {
    tag = createStyleTag();
    tag.id = SHEET_ID;
    // After the server sheet or the token defaults; otherwise first in <head>, ahead of app CSS.
    const anchor = [...document.querySelectorAll(`${SERVER_SHEET}, #openui-defaults`)].pop();
    if (anchor) anchor.after(tag);
    else document.head.prepend(tag);
  }
  const nonce = (window as Window & { __nonce__?: string }).__nonce__;
  if (nonce && tag.nonce !== nonce) tag.nonce = nonce;
  tag.append(wrap(fresh));
  emitted = true;
  emittedLayer = layer;
}

const sink = {
  get data() {
    seed();
    return rules;
  },
  set data(next: string) {
    seed();
    rules = next;
    if (inBrowser() && !scheduled) {
      scheduled = true;
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
  seed();
  if (emitted && options.layer !== layer && options.layer !== emittedLayer && development()) {
    console.warn(
      "[OpenUI] configureStyles was called after component rules were written. " +
        "Existing page rules cannot be re-layered. Configure once in the app entry, before rendering.",
    );
  }
  layer = options.layer;
}

/**
 * Every component rule registered so far, for `<style data-openui-styles>` in server HTML.
 * Pass the layer to wrap them in; the browser reads its name from the `@layer x{` prefix.
 */
export const getComponentStyles = (options: ConfigureStylesOptions = {}): string => {
  seed();
  if (!inBrowser() && rules.trim()) {
    emitted = true;
    emittedLayer = options.layer ?? layer;
  }
  return wrap(rules, options.layer ?? layer) || " ";
};
