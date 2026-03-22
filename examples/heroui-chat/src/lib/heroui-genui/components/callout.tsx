"use client";

import { Alert } from "@heroui/react";
import { defineComponent } from "@openuidev/react-lang";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod";

const CalloutSchema = z.object({
  status: z.enum(["default", "accent", "warning", "danger", "success"]),
  title: z.string(),
  description: z.string(),
});

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description: "Callout banner with status, title, and description",
  component: ({ props }) => {
    return (
      <Alert status={props.status}>
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{props.title}</Alert.Title>
          <Alert.Description>
            <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(props.description ?? "")}
              </ReactMarkdown>
            </div>
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  },
});
