import { z } from "zod";
import { cached, fetchJson, int, list, notFound, oneOf, perMonth, text } from "./fetch";
import { dataTool } from "./tool";

// npm's public APIs, no key needed: api.npmjs.org for downloads, registry.npmjs.org for
// package metadata.

const INTERVALS = ["day", "week", "month"] as const;
const DAY_MS = 86_400_000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

type Range = { downloads: { day: string; downloads: number }[] };

/** One package's daily downloads from `from` to `to`. Scoped names are fine one at a time. */
function dailyDownloads(name: string, from: string, to: string, signal: AbortSignal) {
  return cached(`npm:dl:${name}:${from}:${to}`, 10 * 60_000, async () => {
    const { data } = await fetchJson<Range>(
      `https://api.npmjs.org/downloads/range/${from}:${to}/${encodeURIComponent(name).replace("%40", "@")}`,
      { signal, source: "npm" },
    );
    if (!data) notFound(`There's no npm package named ${name}`);
    return data.downloads;
  });
}

/** Sums days into periods: each day, weeks counted back from the last day, or months. */
function bucket(days: { day: string; downloads: number }[], interval: (typeof INTERVALS)[number]) {
  if (interval === "day") return days.map((d) => ({ period: d.day, downloads: d.downloads }));
  const buckets = new Map<string, number>();
  days.forEach((d, index) => {
    // Weeks end on the last day, so the latest week is a whole one; labelled by their first day.
    const week = Math.floor((days.length - 1 - index) / 7);
    const first = Math.max(0, days.length - 1 - (week * 7 + 6));
    const key = interval === "month" ? d.day.slice(0, 7) : days[first]!.day;
    buckets.set(key, (buckets.get(key) ?? 0) + d.downloads);
  });
  const periods = [...buckets].map(([period, downloads]) => ({ period, downloads }));
  // Leave out the oldest period when it's partial, so it doesn't read as a dip.
  const partial = interval === "week" ? days.length % 7 !== 0 : !days[0]?.day.endsWith("-01");
  return partial ? periods.slice(1) : periods;
}

const downloadsSample = {
  from: "2026-05-01",
  to: "2026-10-29",
  interval: "week",
  periods: ["2026-10-09", "2026-10-16", "2026-10-23"],
  packages: [
    {
      name: "react",
      total: 512_480_000,
      average: 170_826_666,
      downloads: [168_200_000, 171_900_000, 172_380_000],
      change_pct: 0.3,
    },
    {
      name: "vue",
      total: 48_960_000,
      average: 16_320_000,
      downloads: [16_100_000, 16_420_000, 16_440_000],
      change_pct: 0.1,
    },
  ],
};

const releaseSample = {
  name: "next",
  description: "The React Framework",
  latest: "16.2.6",
  license: "MIT",
  homepage: "https://nextjs.org",
  repository: "vercel/next.js",
  created: "2016-10-25T00:00:00.000Z",
  last_published: "2026-10-28T19:02:11.000Z",
  versions_count: 3412,
  maintainers: 4,
  dependencies: 6,
  releases: [
    { version: "16.2.6", date: "2026-10-28T19:02:11.000Z" },
    { version: "16.2.5", date: "2026-10-14T17:40:03.000Z" },
  ],
  releases_by_month: [
    { month: "2026-09", count: 4 },
    { month: "2026-10", count: 3 },
  ],
};

type Packument = {
  name: string;
  description?: string;
  license?: string | { type?: string };
  homepage?: string;
  repository?: string | { url?: string };
  maintainers?: unknown[];
  "dist-tags"?: { latest?: string };
  time?: Record<string, string>;
  versions?: Record<string, { dependencies?: Record<string, string> }>;
};

/** "git+https://github.com/vercel/next.js.git" → "vercel/next.js". */
function githubRepo(repository: Packument["repository"]): string | null {
  const url = typeof repository === "string" ? repository : repository?.url;
  const match = url?.match(/github\.com[/:]([^/]+\/[^/#]+?)(?:\.git)?(?:[/#].*)?$/);
  return match?.[1] ?? null;
}

const STABLE = /^\d+\.\d+\.\d+$/;

export const npmTools = {
  get_npm_downloads: dataTool(
    "Downloads of up to 5 npm packages over the last months, per day, week, or whole month: the period labels, and each package's downloads per period (aligned with periods), total, average per period, and change_pct (last period vs the one before).",
    z.object({
      packages: z
        .string()
        .describe('npm package names, comma-separated, such as "react,vue,svelte"'),
      months: z.number().int().min(1).max(12).default(6).describe("How many months back, 1 to 12"),
      interval: z.enum(INTERVALS).default("week").describe("day, week, or month"),
    }),
    downloadsSample,
    async (args, signal) => {
      const names = list(args.packages ?? args.package, 5);
      if (!names.length) names.push("react");
      const months = int(args.months, 6, 1, 12);
      const interval = oneOf(args.interval, INTERVALS, "week");
      // npm's data ends yesterday; months end at the last whole one, so this month's first days
      // don't read as a drop.
      const end = new Date(Date.now() - DAY_MS);
      if (interval === "month" && new Date(end.getTime() + DAY_MS).getUTCDate() !== 1) {
        end.setUTCDate(0);
      }
      const start = new Date(end);
      start.setUTCMonth(start.getUTCMonth() - months);
      const [from, to] = [isoDay(start), isoDay(end)];
      const series = await Promise.all(
        names.map(async (name) => bucket(await dailyDownloads(name, from, to, signal), interval)),
      );
      return {
        from,
        to,
        interval,
        periods: series[0]?.map((point) => point.period) ?? [],
        packages: names.map((name, index) => {
          const downloads = series[index]!.map((point) => point.downloads);
          const total = downloads.reduce((sum, value) => sum + value, 0);
          const [previous, last] = downloads.slice(-2);
          return {
            name,
            total,
            average: downloads.length ? Math.round(total / downloads.length) : 0,
            downloads,
            change_pct:
              previous && last !== undefined
                ? Math.round(((last - previous) / previous) * 1000) / 10
                : 0,
          };
        }),
      };
    },
  ),
  get_npm_package: dataTool(
    "An npm package's metadata: latest version, license, GitHub repository (owner/name), first and last publish dates, number of versions, maintainers and runtime dependencies, its 15 latest stable releases (newest first), and stable releases per month over the last 12 months (the best source for release cadence).",
    z.object({ name: z.string().describe('An npm package name, such as "next"') }),
    releaseSample,
    async (args, signal) => {
      const name = text(args.name ?? args.package, "react");
      return cached(`npm:pkg:${name}`, 10 * 60_000, async () => {
        const { data } = await fetchJson<Packument>(
          `https://registry.npmjs.org/${encodeURIComponent(name).replace("%40", "@")}`,
          { signal, source: "the npm registry" },
        );
        if (!data) notFound(`There's no npm package named ${name}`);
        const time = data.time ?? {};
        const latest = data["dist-tags"]?.latest ?? "";
        const stable = Object.entries(time)
          .filter(([version]) => STABLE.test(version))
          .sort(([, a], [, b]) => b.localeCompare(a));
        return {
          name: data.name,
          description: data.description ?? "",
          latest,
          license:
            typeof data.license === "string" ? data.license : (data.license?.type ?? "Unknown"),
          homepage: data.homepage ?? "",
          repository: githubRepo(data.repository) ?? "",
          created: time.created ?? "",
          last_published: time[latest] ?? time.modified ?? "",
          versions_count: Object.keys(data.versions ?? {}).length,
          maintainers: data.maintainers?.length ?? 0,
          dependencies: Object.keys(data.versions?.[latest]?.dependencies ?? {}).length,
          releases: stable.slice(0, 15).map(([version, date]) => ({ version, date })),
          releases_by_month: perMonth(
            stable.map(([, date]) => date),
            12,
          ),
        };
      });
    },
  ),
};
