"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Button, DetailedViewPanel, useDetailedView } from "@openuidev/react-ui";
import { toPng } from "html-to-image";
import { useEffect, useId, useRef } from "react";
import { z } from "zod/v4";

// The page may only show inline styles and the store's product photos: no scripts, no network
// requests, no other images. Injected into the document so it applies however the model wrote it.
const policy =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; ' +
  "img-src https://cdn.shopify.com data:; style-src 'unsafe-inline'; font-src data:\">";

function withPolicy(document: string) {
  return /<head[^>]*>/i.test(document)
    ? document.replace(/<head[^>]*>/i, (head) => head + policy)
    : policy + document;
}

// Save the page as a PNG at twice its size. The card is the element with class "card" when the
// model wrote one, otherwise the whole body. Shopify's CDN allows cross-origin reads, so the
// product photos are drawn into the image.
async function download(title: string, frame: HTMLIFrameElement | null) {
  const page = frame?.contentDocument;
  if (!page) return;
  const card = page.querySelector<HTMLElement>(".card") ?? page.body;
  const link = window.document.createElement("a");
  link.href = await toPng(card, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
  link.click();
}

// A printable page, such as a gift card, written by the model as a complete HTML document. The
// answer shows a button; the page opens in Agent Interface's side panel with Print and Download,
// which saves it as a PNG.
export const HtmlArtifact = defineComponent({
  name: "HtmlArtifact",
  description:
    "A printable page, such as a gift card, shown in a side panel with Print and Download (as an image) buttons. document is a complete, self-contained HTML document with inline CSS, with the page inside one element with class card.",
  props: z.object({ title: z.string(), document: z.string() }),
  component: ({ props }) => {
    const isStreaming = useIsStreaming();
    const viewId = useId();
    const { open } = useDetailedView(viewId);
    const frame = useRef<HTMLIFrameElement>(null);

    // Open the panel when a page finishes streaming, but not for pages in a thread opened again.
    const streamed = useRef(false);
    useEffect(() => {
      if (isStreaming) streamed.current = true;
      else if (streamed.current) open();
    }, [isStreaming, open]);

    if (isStreaming)
      return <div className="html-artifact__status">Designing {props.title || "your page"}…</div>;

    // The iframe runs no scripts. allow-same-origin lets the Print button reach its window, and
    // allow-modals lets it open the print dialog.
    return (
      <>
        <Button variant="secondary" onClick={open}>
          Open {props.title}
        </Button>
        <DetailedViewPanel viewId={viewId} title={props.title}>
          <div className="html-artifact">
            <div className="html-artifact__actions">
              <Button variant="primary" onClick={() => frame.current?.contentWindow?.print()}>
                Print
              </Button>
              <Button variant="secondary" onClick={() => void download(props.title, frame.current)}>
                Download
              </Button>
            </div>
            <iframe
              ref={frame}
              title={props.title}
              sandbox="allow-same-origin allow-modals"
              referrerPolicy="no-referrer"
              srcDoc={withPolicy(props.document)}
            />
          </div>
        </DetailedViewPanel>
      </>
    );
  },
});
