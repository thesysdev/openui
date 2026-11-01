import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpConfig, McpToolClient } from "@openuidev/server";
import { z } from "zod";
import { cached, fetchJson, list, text } from "./fetch";

// A small MCP server for OSV.dev, the open vulnerability database (https://osv.dev, no key
// needed). It runs in this process over MCP's in-memory transport; in your app this could be
// any MCP server your agent already uses. Dashboards get its tools through
// `defineDashboard({ mcp })`, alongside the npm and GitHub data tools.

const SEVERITIES = ["Critical", "High", "Moderate", "Low", "Unknown"] as const;
type Severity = (typeof SEVERITIES)[number];

type OsvVuln = {
  id: string;
  summary?: string;
  aliases?: string[];
  published?: string;
  database_specific?: { severity?: string };
  affected?: {
    package?: { name?: string; ecosystem?: string };
    ranges?: { events?: { introduced?: string; fixed?: string }[] }[];
  }[];
};

function severityOf(vuln: OsvVuln): Severity {
  const raw = vuln.database_specific?.severity?.toLowerCase() ?? "";
  if (raw === "critical") return "Critical";
  if (raw === "high") return "High";
  if (raw === "moderate" || raw === "medium") return "Moderate";
  if (raw === "low") return "Low";
  return "Unknown";
}

/** Known advisories for an npm package, or for one version of it, newest first. */
function advisories(name: string, version: string, signal?: AbortSignal) {
  return cached(`osv:${name}@${version}`, 30 * 60_000, async () => {
    const { data } = await fetchJson<{ vulns?: OsvVuln[] }>("https://api.osv.dev/v1/query", {
      signal,
      source: "OSV.dev",
      body: { package: { name, ecosystem: "npm" }, ...(version && { version }) },
    });
    return (data?.vulns ?? [])
      .map((vuln) => {
        const fixed = (vuln.affected ?? [])
          .filter((affected) => affected.package?.name === name)
          .flatMap((affected) => affected.ranges ?? [])
          .flatMap((range) => range.events ?? [])
          .flatMap((event) => (event.fixed ? [event.fixed] : []));
        return {
          id: vuln.id,
          cve: vuln.aliases?.find((alias) => alias.startsWith("CVE-")) ?? "",
          summary: vuln.summary ?? "",
          severity: severityOf(vuln),
          published: vuln.published ?? "",
          fixed_in: [...new Set(fixed)].join(", ") || "No fix yet",
        };
      })
      .sort((a, b) => b.published.localeCompare(a.published));
  });
}

const countBySeverity = (vulns: { severity: Severity }[]) =>
  SEVERITIES.map((severity) => vulns.filter((vuln) => vuln.severity === severity).length);

const json = (value: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
  structuredContent: value,
});

// Dashboards pass whatever their filters hold, "" and null included: accept them.
const optionalText = z.union([z.string(), z.null()]).optional();

function osvServer() {
  const server = new McpServer({ name: "osv", version: "1.0.0" });
  server.registerTool(
    "osv.vulnerabilities",
    {
      description:
        "Known security advisories for an npm package from OSV.dev, or only those affecting one version: newest first, each with id, CVE, summary, severity (Critical, High, Moderate, Low, Unknown), published date, and the versions that fix it; plus counts per severity (severities and counts line up).",
      inputSchema: {
        package: z.string().describe('An npm package name, such as "lodash"'),
        version: optionalText.describe('Only advisories affecting this version, such as "4.17.20"'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args, { signal }) => {
      const name = text(args.package, "lodash");
      const version = text(args.version);
      const vulns = await advisories(name, version, signal);
      return json({
        package: name,
        version,
        total: vulns.length,
        severities: [...SEVERITIES],
        counts: countBySeverity(vulns),
        vulnerabilities: vulns,
      });
    },
  );
  server.registerTool(
    "osv.compare_packages",
    {
      description:
        "Known advisories for up to 8 npm packages from OSV.dev, side by side: for each package, the total and the counts of critical, high, moderate, and low ones.",
      inputSchema: {
        packages: z
          .string()
          .describe('npm package names, comma-separated, such as "lodash,axios,express"'),
      },
      annotations: { readOnlyHint: true },
    },
    async (args, { signal }) => {
      const names = list(args.packages, 8);
      const rows = await Promise.all(
        names.map(async (name) => {
          const vulns = await advisories(name, "", signal);
          const [critical, high, moderate, low] = countBySeverity(vulns);
          return { name, total: vulns.length, critical, high, moderate, low };
        }),
      );
      return json({ packages: rows });
    },
  );
  return server;
}

let connecting: Promise<Client> | undefined;

/** One client for the app, connected to the server on first use. */
function osvClient(): Promise<Client> {
  connecting ??= (async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await osvServer().connect(serverSide);
    const client = new Client({ name: "openui-shadcn-dashboards", version: "1.0.0" });
    await client.connect(clientSide);
    return client;
  })().catch((error: unknown) => {
    connecting = undefined;
    throw error;
  });
  return connecting;
}

const client: McpToolClient = {
  listTools: async (...args) => (await osvClient()).listTools(...args),
  callTool: async (...args) => (await osvClient()).callTool(...args),
};

/** What `defineDashboard({ mcp })` takes: the client, and example outputs for generation. */
export const osv: McpConfig = {
  client,
  outputs: {
    "osv.vulnerabilities": {
      package: "lodash",
      version: "",
      total: 2,
      severities: [...SEVERITIES],
      counts: [1, 1, 0, 0, 0],
      vulnerabilities: [
        {
          id: "GHSA-35jh-r3h4-6jhm",
          cve: "CVE-2021-23337",
          summary: "Command Injection in lodash",
          severity: "High",
          published: "2021-05-06T16:05:51Z",
          fixed_in: "4.17.21",
        },
      ],
    },
    "osv.compare_packages": {
      packages: [
        { name: "lodash", total: 9, critical: 2, high: 4, moderate: 3, low: 0 },
        { name: "axios", total: 12, critical: 1, high: 6, moderate: 5, low: 0 },
      ],
    },
  },
};

/** For the chat agent's prompt: the MCP tools dashboards can use, by their data tool names. */
export const osvToolSummaries = [
  "osv_vulnerabilities: known security advisories (OSV.dev) for an npm package or one version, with severity and fixed versions",
  "osv_compare_packages: advisory counts by severity for several npm packages side by side",
];
