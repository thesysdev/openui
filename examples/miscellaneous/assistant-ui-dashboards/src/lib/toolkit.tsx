"use generative";

import { defineToolkit } from "@assistant-ui/react";
import { z } from "zod";
import { DashboardCard } from "../components/dashboard";
import { composeBrief } from "./brief";
import { dataTools } from "./data";
import { dashboards, userId } from "./openui";

// The chat model's tools. `execute` runs on this server (the "use generative" compiler keeps it,
// and OpenUI Cloud, out of the browser bundle); `render` is the card the chat shows for the call.
// Each dashboard tool returns as soon as the dashboard has an id, while OpenUI Cloud generates it
// in the background. Its result, written by OpenUI Cloud, is a sentence for the model plus the
// dashboard's reference, which the card passes to the renderer as is.

/** A tool result small enough to read: long lists keep their first rows and say how many were cut. */
function preview(value: unknown, maxItems = 50, maxChars = 9000): string {
  const trim = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.length > maxItems
        ? [...v.slice(0, maxItems).map(trim), `… ${v.length - maxItems} more rows not shown`]
        : v.map(trim)
      : v && typeof v === "object"
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trim(x)]))
        : v;
  const text = JSON.stringify(trim(value));
  return text.length > maxChars
    ? `${text.slice(0, maxChars)}… (cut at ${maxChars} characters; ask for fewer rows or columns)`
    : text;
}

export default defineToolkit({
  // The chat agent runs the dashboards' own data tools, so it examines the data before it
  // briefs the builder.
  check_data: {
    description:
      "Run one of the dashboard's data tools yourself to see what the data holds before you write a brief: which tables, columns and values exist, the dates covered, whether the latest period is complete, and whether a calculation runs. The tools and their arguments are the ones listed in your instructions. Returns the tool's result as JSON; long lists are cut to their first 50 rows with a count of the rest. An error comes back as text starting with \"Error:\", so you can fix the call and try again. This tool only reads data; it does not create or change a dashboard.",
    parameters: z.object({
      tool: z.string().min(1).describe('The data tool to run, such as "get_npm_downloads".'),
      args: z
        .record(z.string(), z.unknown())
        .describe("That tool's arguments, as its description gives them."),
    }),
    execute: async ({ tool, args }, { abortSignal }) => {
      try {
        // Through the dashboards' own interpreter, so every source a dashboard can query is
        // reachable here too: the data tools and the MCP server's tools alike.
        return preview(
          await dashboards.interpreter.execute(
            { name: tool, arguments: args ?? {} },
            { userId: userId() },
            { signal: abortSignal },
          ),
        );
      } catch (error) {
        return `Error: ${error instanceof Error ? error.message : String(error)}. The data tools are: ${Object.keys(dataTools).join(", ")}, and the MCP tools listed in your instructions.`;
      }
    },
    render: (props) => {
      const input = props.args as { tool?: string; args?: Record<string, unknown> };
      return (
        <details className="my-1 max-w-md rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          <summary className="cursor-pointer">
            Checked the data{input?.tool ? ` · ${input.tool}` : ""}
          </summary>
          <pre className="mt-1 whitespace-pre-wrap">
            {JSON.stringify(input?.args ?? {}, null, 1)}
          </pre>
        </details>
      );
    },
  },
  create_dashboard: {
    description:
      "Hand a brief to the dashboard builder, which designs and writes a live dashboard from it. The builder knows the component library and chooses the charts, layout and wording. It reads only this brief and the data tools' descriptions and cannot look at the data, so the brief carries everything you learned: who the dashboard is for and why, what it should convey in priority order with the data behind each point, and which filters apply with their defaults. The dashboard loads its numbers live each time it is opened, so describe data by tool or table, fields and calculation; a value the user gave, such as a target, is passed as given. Returns right away while the dashboard is generated.",
    parameters: z.object({
      title: z
        .string()
        .min(1)
        .describe(
          'A short name for the subject, two to five words, such as "Delivery performance" or "November sales". Not a question, and not the request reworded.',
        ),
      request: z.string().min(1).describe("What the user asked, in their own words."),
      reader: z
        .string()
        .min(1)
        .describe(
          "Who will read the dashboard and in what setting, as far as the request shows: their role, the occasion (a board meeting, a weekly review, a morning check) and how much effort they will give it.",
        ),
      intent: z
        .string()
        .min(1)
        .describe(
          "What they are trying to understand or do, including the reason behind the wording and what they already know, so the dashboard does not spend space proving it again.",
        ),
      constraints: z
        .array(z.string())
        .optional()
        .describe(
          "Explicit constraints from the request, each as the user gave it: a period, a target value, named items to include, a way of using it such as no clicking. Leave out when there are none.",
        ),
      points: z
        .array(
          z.object({
            convey: z
              .string()
              .min(1)
              .describe(
                "One thing the reader should come away knowing, written as what they should be able to see or conclude. Do not name a chart type, a section or a position.",
              ),
            evidence: z
              .string()
              .min(1)
              .describe(
                "The data that shows it: the tool or table, the fields and the calculation you tested, and the comparison or relationship that gives it meaning (against the previous period, a target or peers; a count next to its rate).",
              ),
            caveat: z
              .string()
              .optional()
              .describe(
                "What the reader needs to know to avoid misreading this point, if anything.",
              ),
          }),
        )
        .min(1)
        .describe(
          "What the dashboard should convey, in priority order: the point that answers the request most directly first, then what explains or qualifies it, then detail to explore. The opening points each let the reader conclude something different; later points can be detail that revisits them.",
        ),
      data_notes: z
        .string()
        .optional()
        .describe(
          "Facts about the data that apply to every point: shared definitions (how revenue or an order is counted), the dates covered and whether the latest period is complete, units and currency, and raw labels that need tidying (ALL CAPS names, codes, snake_case).",
        ),
      filters: z
        .array(
          z.object({
            name: z
              .string()
              .min(1)
              .describe('What the filter controls, such as "Period" or "Customer state".'),
            values: z
              .string()
              .min(1)
              .describe(
                "The exact bounds or valid values as found in the data, with the column they come from: the first and last date available, or the full list of values. When there are too many to list, give the query that returns them.",
              ),
            default: z
              .string()
              .min(1)
              .describe(
                "What is applied when the dashboard opens: the period or value the request is about.",
              ),
            role: z
              .enum(["needed", "optional"])
              .describe(
                '"needed" when the request depends on it (a question about this month needs the period); "optional" when it only helps the reader explore.',
              ),
          }),
        )
        .describe(
          "The filters the data supports that are relevant to this request, with what is applied by default. Pass an empty list when the reader should not need controls.",
        ),
    }),
    execute: (brief, { abortSignal }) => {
      // A brief whose fields arrived run together (the points inside another field) is sent back
      // rather than passed on half-empty: the error reaches the model, which calls again.
      const missing = [
        ...(["request", "reader", "intent"] as const).filter((field) => !brief[field]?.trim()),
        ...(Array.isArray(brief.points) && brief.points.some((point) => point?.convey)
          ? []
          : ["points"]),
        ...(Array.isArray(brief.filters) ? [] : ["filters"]),
      ];
      const spilled = (["request", "reader", "intent"] as const).filter((field) =>
        /<\/?(parameter|intent|reader|request)\b|"convey"\s*:/.test(brief[field] ?? ""),
      );
      if (missing.length || spilled.length) {
        throw new Error(
          `The brief was not sent: ${missing.length ? `missing ${missing.join(", ")}` : `${spilled.join(", ")} contains other fields' text`}. Call create_dashboard again with each field as its own argument: points as a list of {convey, evidence, caveat}, filters as a list (empty when there are none).`,
        );
      }
      return dashboards.create(
        { title: brief.title, prompt: composeBrief(brief) },
        { userId: userId() },
        { signal: abortSignal },
      );
    },
    // In the message, not folded into the tool-call group.
    display: "standalone",
    render: (props) => <DashboardCard {...props} />,
  },
  edit_dashboard: {
    description:
      "Change a dashboard in place. The builder reads the dashboard as it is now plus this request, and decides how to make the change. Returns right away; the user sees the new version when it is ready.",
    parameters: z.object({
      id: z.string().min(1).describe("The dashboard's artifact_id, art_…, from its tool result."),
      prompt: z
        .string()
        .min(1)
        .describe(
          "What should change and what the reader needs from it, with any data definitions the change depends on. Leave the choice of chart and layout to the builder unless the user asked for a specific one.",
        ),
    }),
    execute: ({ id, prompt }, { abortSignal }) =>
      dashboards.edit({ id, prompt }, { userId: userId() }, { signal: abortSignal }),
    // In the message, not folded into the tool-call group.
    display: "standalone",
    render: (props) => <DashboardCard {...props} />,
  },
});
