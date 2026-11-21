import { promptOptions } from "@openuidev/dashboard-library";
import { OpenUIClient } from "@openuidev/server";
import spec from "../generated/spec.json";
import { dataTools, osv } from "./data";

// OpenUI Cloud, or your own deployment of it, such as a local stack at http://localhost:3102.
export const baseUrl = (process.env.THESYS_BASE_URL || "https://api.thesys.dev").replace(
  /\/+$/,
  "",
);

// Reads THESYS_API_KEY when it makes a request.
export const openui = new OpenUIClient({ baseUrl });

// There is no sign-in, so every browser shares one local user, as in apps from `openui create`.
// Use the signed-in user's id instead when you add authentication: users read and edit only
// their own dashboards.
export const userId = () => process.env.DEMO_USER_ID || "assistant-ui-dashboards-demo";

// One definition for every dashboard: the components it's built from, the model that builds
// it, and where its data comes from: our npm and GitHub data tools, and the OSV MCP server's
// tools. Its interpreter runs those tools for the browser.
export const dashboards = openui.defineDashboard({
  // The specification `npm run generate` writes from src/library.ts, so the server never loads
  // the React components the browser renders with.
  library: spec,
  model: process.env.OPENUI_DASHBOARD_MODEL || "anthropic/claude-sonnet-5.5",
  tools: dataTools,
  mcp: osv,
  // The kit's examples and rules, with our own preamble: what the data is, and how to read a brief.
  promptOptions: {
    preamble:
      "You build dashboards about open-source JavaScript projects: npm packages, their GitHub repositories, and their known security advisories. All data is live from public APIs, loaded by Query() each time the dashboard opens.\n\n" +
      // How to read the chat agent's brief: it settles what to convey; the builder owns how.
      "Each request is a brief from the main agent, which has talked to the user and examined the data. It has three parts. Context and intent: who the dashboard is for, what they asked and what they are after. What to convey, in priority order: each point the reader should come away with, the data behind it, and any caveat. Filters and defaults: the controls the data supports, their valid values, and what is applied when the dashboard opens. The points and their order are decided; the design is yours: how the points become a hierarchy on the page, which component carries each one, and the wording. A point is something the reader should come away with, not a section: one view can carry two points, and a point may need more than one view. The evidence names the data and the calculations that ran against it, so write your queries from them. Numbers quoted in the brief are what the main agent saw today: use them to judge what matters, and load every number the dashboard shows with Query(), since a number copied into a title, hint or description goes stale.",
    examples: promptOptions.examples,
    additionalRules: promptOptions.additionalRules,
  },
});
