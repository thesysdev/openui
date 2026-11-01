import { OpenUIClient } from "@openuidev/server";
import spec from "../generated/spec.json";
import { dataTools, osv } from "./data";
import { dashboardExamples, dashboardRules } from "./shadcn-genui/prompt";

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
export const userId = () => process.env.DEMO_USER_ID || "shadcn-dashboards-demo";

// One definition for every dashboard: the components it's built from, the model that builds
// it, and where its data comes from: our npm and GitHub data tools, and the OSV MCP server's
// tools. Its interpreter runs those tools for the browser.
export const dashboards = openui.defineDashboard({
  // The specification `npm run generate` writes from src/library.ts, so the server never loads
  // the React components the browser renders with.
  library: spec,
  model: process.env.OPENUI_DASHBOARD_MODEL || "anthropic/claude-sonnet-4.6",
  tools: dataTools,
  mcp: osv,
  promptOptions: {
    preamble:
      "You build dashboards about open-source JavaScript projects: npm packages, their GitHub repositories, and their known security advisories. All data is live from public APIs, loaded by Query() each time the dashboard opens.",
    examples: dashboardExamples,
    additionalRules: dashboardRules,
  },
});
