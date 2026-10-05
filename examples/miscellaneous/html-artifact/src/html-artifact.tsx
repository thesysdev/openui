"use client";

import { defineComponent, useIsStreaming, type ComponentRenderProps } from "@openuidev/react-lang";
import {
  Button,
  DetailedViewPanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useDetailedView,
} from "@openuidev/react-ui";
import { useEffect, useId, useState } from "react";
import { z } from "zod/v4";

const HtmlArtifactSchema = z.object({
  title: z.string(),
  document: z.string(),
});

function HtmlArtifactRenderer({ props }: ComponentRenderProps<z.infer<typeof HtmlArtifactSchema>>) {
  const isStreaming = useIsStreaming();
  const [selectedView, setSelectedView] = useState<"raw" | "rendered">("raw");
  const viewId = useId();
  const { open } = useDetailedView(viewId);

  useEffect(() => {
    open();
  }, [open]);

  useEffect(() => {
    if (!isStreaming) {
      const frame = requestAnimationFrame(() => setSelectedView("rendered"));
      return () => cancelAnimationFrame(frame);
    }
  }, [isStreaming]);

  // Example only. Before production, normalize and validate the HTML,
  // enforce a CSP, restrict network access, and validate iframe messages.
  return (
    <>
      {isStreaming ? (
        <div className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-700">
          Generating artifact {props.title}…
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={open}
          className="w-full justify-between"
        >
          <span className="font-medium text-neutral-900">{props.title}</span>
          <span className="text-sm text-neutral-500">Open artifact</span>
        </Button>
      )}

      <DetailedViewPanel viewId={viewId} title={props.title}>
        <Tabs
          value={selectedView}
          onValueChange={(value) => setSelectedView(value as "raw" | "rendered")}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList aria-label="Artifact view">
            <TabsTrigger value="raw" text="Raw" />
            <TabsTrigger value="rendered" text="Rendered" />
          </TabsList>

          <TabsContent
            value="raw"
            className="min-h-0 flex-1 overflow-hidden p-0! [&>.openui-tabs-content-inner]:h-full [&>.openui-tabs-content-inner]:gap-0"
          >
            <pre className="h-full overflow-auto whitespace-pre-wrap bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-300">
              <code>{props.document}</code>
            </pre>
          </TabsContent>

          <TabsContent
            value="rendered"
            className="min-h-0 flex-1 overflow-hidden p-0! [&>.openui-tabs-content-inner]:h-full [&>.openui-tabs-content-inner]:gap-0"
          >
            {isStreaming ? (
              <div className="flex h-full items-center justify-center text-neutral-500">
                Generating artifact…
              </div>
            ) : (
              <iframe
                title={props.title}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={props.document}
                className="h-full w-full border-0 bg-white"
              />
            )}
          </TabsContent>
        </Tabs>
      </DetailedViewPanel>
    </>
  );
}

export const HtmlArtifact = defineComponent({
  name: "HtmlArtifact",
  description:
    "Renders a bespoke, self-contained HTML/CSS/JavaScript experience from a complete document or HTML fragment.",
  props: HtmlArtifactSchema,
  component: HtmlArtifactRenderer,
});
