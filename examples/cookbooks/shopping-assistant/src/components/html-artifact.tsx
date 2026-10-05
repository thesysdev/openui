"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import { Button, DetailedViewPanel, useDetailedView } from "@openuidev/react-ui";
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

function download(title: string, document: string) {
  const link = window.document.createElement("a");
  link.href = URL.createObjectURL(new Blob([document], { type: "text/html" }));
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// A printable page, such as a gift card, written by the model as a complete HTML document. The
// answer shows a button; the page opens in Agent Interface's side panel with Print and Download.
export const HtmlArtifact = defineComponent({
  name: "HtmlArtifact",
  description:
    "A printable page, such as a gift card, shown in a side panel with Print and Download buttons. document is a complete, self-contained HTML document with inline CSS.",
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
              <Button variant="secondary" onClick={() => download(props.title, props.document)}>
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
