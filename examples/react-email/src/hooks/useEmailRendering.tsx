"use client";

import { emailLibrary } from "@openuidev/react-email";
import type { ParseResult } from "@openuidev/react-lang";
import { Renderer } from "@openuidev/react-lang";
import { render } from "@react-email/render";
import { useCallback, useEffect, useRef, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTemplate(node: any): any {
  if (node?.typeName === "EmailTemplate") return node;
  const children = node?.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findTemplate(child);
      if (found) return found;
    }
  }
  return null;
}

function renderToHtml(openuiCode: string) {
  return render(<Renderer response={openuiCode} library={emailLibrary} isStreaming={false} />, {
    pretty: true,
  });
}

export function useEmailRendering(openuiCode: string | null, isStreaming: boolean, isRunning: boolean) {
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState<string | null>(null);
  const lastParsedRef = useRef<ParseResult | null>(null);
  const renderingRef = useRef(false);
  const wasStreamingRef = useRef(false);
  const wasRunningRef = useRef(false);

  const triggerRender = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (template: any, code: string) => {
      renderingRef.current = true;
      setHtmlLoading(true);
      setEmailSubject(String(template.props?.subject ?? ""));

      renderToHtml(code)
        .then((html) => setRenderedHtml(html))
        .catch(() => setRenderedHtml(null))
        .finally(() => {
          setHtmlLoading(false);
          renderingRef.current = false;
        });
    },
    [],
  );

  const handleParseResult = useCallback(
    (result: ParseResult | null) => {
      lastParsedRef.current = result;

      // On refresh (not streaming, no HTML yet), render as soon as parse completes
      if (result?.root && openuiCode && !isStreaming && !renderingRef.current) {
        const template = findTemplate(result.root);
        if (template && !renderedHtml) {
          requestAnimationFrame(() => triggerRender(template, openuiCode));
        }
      }
    },
    [openuiCode, isStreaming, renderedHtml, triggerRender],
  );

  const onStreamingEnd = useCallback(() => {
    if (renderingRef.current || !openuiCode) return;
    const result = lastParsedRef.current;
    if (!result?.root) return;

    const template = findTemplate(result.root);
    if (!template) return;

    triggerRender(template, openuiCode);
  }, [openuiCode, triggerRender]);

  const onGenerationStart = useCallback(() => {
    setRenderedHtml(null);
    setEmailSubject(null);
    lastParsedRef.current = null;
    renderingRef.current = false;
  }, []);

  // Detect streaming/running transitions
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (wasStreamingRef.current && !isStreaming) {
        onStreamingEnd();
      }
      if (!wasRunningRef.current && isRunning && !openuiCode) {
        onGenerationStart();
      }
      wasStreamingRef.current = isStreaming;
      wasRunningRef.current = isRunning;
    });
    return () => cancelAnimationFrame(id);
  }, [isStreaming, isRunning, openuiCode, onStreamingEnd, onGenerationStart]);

  return { renderedHtml, htmlLoading, emailSubject, handleParseResult };
}
