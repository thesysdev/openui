// A new <style> carrying the page's CSP nonce (`window.__nonce__`, Goober's convention) before it
// enters the document. A nonce-only style-src blocks a tag inserted without it, and reports one
// that gets it only afterwards.
export function createStyleTag(): HTMLStyleElement {
  const tag = document.createElement("style");
  const nonce = (window as Window & { __nonce__?: string }).__nonce__;
  if (nonce) tag.nonce = nonce;
  return tag;
}
