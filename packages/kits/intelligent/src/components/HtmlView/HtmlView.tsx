"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "../../shared/scheme";

export interface HtmlViewProps {
  /** A whole page: markup, inline styles and inline scripts. */
  html: string;
  /** In px; without one, the view fits its content. */
  height?: number;
  title?: string;
  /** Shows a placeholder instead, e.g. while the page is still streaming, so it does not reload on every chunk. */
  pending?: boolean;
}

// The page runs in a sandboxed iframe: scripts only, an opaque origin (no
// allow-same-origin, so no access to this app, its cookies or storage), no
// forms, popups or navigation of the app. Its CSP allows inline code and a few
// script CDNs, and no network otherwise.
const CDNS = "https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://esm.sh";

const CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline' ${CDNS}`,
  `style-src 'unsafe-inline' ${CDNS} https://fonts.googleapis.com`,
  "font-src https://fonts.gstatic.com data:",
  "img-src data: blob: https:",
  "media-src data: blob:",
  `connect-src ${CDNS}`,
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");

const MIN_HEIGHT = 80;

const MAX_HEIGHT = 2400;

const AUTO_START = 360;

// Reports the content height to the parent, so the view fits the page. The
// parent can ask again ("openui-intelligent-html-view-measure"): a server-rendered frame may
// report before the app is listening.
const REPORTER = `<script>(function(){var last=0;function send(){var h=Math.ceil(document.documentElement.getBoundingClientRect().height);if(Math.abs(h-last)>1){last=h;parent.postMessage({type:"openui-intelligent-html-view-height",height:h},"*")}}addEventListener("message",function(e){if(e.source===parent&&e.data==="openui-intelligent-html-view-measure"){last=0;send()}});addEventListener("load",send);new ResizeObserver(send).observe(document.documentElement);send()})()</script>`;

function documentFor(html: string, scheme: "light" | "dark") {
  // The policy comes first, so it covers everything in the model's markup.
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:${scheme}}html,body{margin:0}body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}</style>${REPORTER}${html}`;
}

/** A sandboxed HTML page with inline JS, for games and canvas. */
export function HtmlView({ html, height, title, pending }: HtmlViewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const scheme = useColorScheme(box);
  const fixed = typeof height === "number" && height > 0 ? Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height)) : null;
  const [measured, setMeasured] = useState<number | null>(null);
  const srcDoc = useMemo(() => documentFor(html, scheme), [html, scheme]);

  useEffect(() => {
    if (fixed) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as { type?: unknown; height?: unknown };
      if (data?.type === "openui-intelligent-html-view-height" && typeof data.height === "number" && Number.isFinite(data.height)) {
        setMeasured(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, data.height)));
      }
    };
    window.addEventListener("message", onMessage);
    frame.current?.contentWindow?.postMessage("openui-intelligent-html-view-measure", "*");
    return () => window.removeEventListener("message", onMessage);
  }, [fixed]);

  // A page that is still streaming would reload on every chunk; it runs once complete.
  const boxHeight = fixed ?? measured ?? AUTO_START;
  return (
    <div ref={box} className="openui-intelligent-html-view" style={{ height: boxHeight }}>
      {pending ? (
        <div className="openui-intelligent-html-view-wait">Preparing the interactive view…</div>
      ) : (
        <iframe ref={frame} title={title || "Interactive view"} sandbox="allow-scripts" srcDoc={srcDoc} referrerPolicy="no-referrer" loading="lazy" />
      )}
    </div>
  );
}
