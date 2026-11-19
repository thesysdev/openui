"use generative";

import { defineToolkit } from "@assistant-ui/react";
import { z } from "zod";
import { DashboardCard } from "../components/dashboard";
import { dashboards, userId } from "./openui";

// The chat model's tools. `execute` runs on this server (the "use generative" compiler keeps it,
// and OpenUI Cloud, out of the browser bundle); `render` is the card the chat shows for the call.
// Each tool returns as soon as the dashboard has an id, while OpenUI Cloud generates it in the
// background. Its result, written by OpenUI Cloud, is a sentence for the model plus the
// dashboard's reference, which the card passes to the renderer as is.
export default defineToolkit({
  create_dashboard: {
    description:
      "Create a live dashboard. It loads its numbers live from npm, GitHub, and OSV.dev every time it is opened, so name the packages or repositories and describe which data to show and how, without numbers. Returns right away while the dashboard is generated.",
    parameters: z.object({
      title: z.string().min(1).describe('A short title, such as "October sales".'),
      prompt: z
        .string()
        .min(1)
        .describe(
          "What to build: the sections, metrics, charts, and tables, and which data each shows. The dashboard is built from this alone.",
        ),
    }),
    execute: ({ title, prompt }, { abortSignal }) =>
      dashboards.create({ title, prompt }, { userId: userId() }, { signal: abortSignal }),
    // In the message, not folded into the tool-call group.
    display: "standalone",
    render: (props) => <DashboardCard {...props} />,
  },
  edit_dashboard: {
    description:
      "Change a dashboard in place, such as adding a chart or a section. Returns right away; the user sees the new version when it is ready.",
    parameters: z.object({
      id: z.string().min(1).describe("The dashboard's artifact_id, art_…, from its tool result."),
      prompt: z.string().min(1).describe("The change to make."),
    }),
    execute: ({ id, prompt }, { abortSignal }) =>
      dashboards.edit({ id, prompt }, { userId: userId() }, { signal: abortSignal }),
    // In the message, not folded into the tool-call group.
    display: "standalone",
    render: (props) => <DashboardCard {...props} />,
  },
});
