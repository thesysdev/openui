// Lighthouse CI for the docs site. Run from this directory after `pnpm build`:
//
//   LHCI_FORM_FACTOR=mobile npx @lhci/cli@0.15.1 autorun
//
// LHCI_FORM_FACTOR picks the profile (mobile, the default, or desktop). Each run
// starts `next start`, audits the pages below, and writes reports to
// lighthouse-reports/<form factor>/. .github/workflows/lighthouse.yml runs both,
// as parallel jobs.

const PORT = 4317;
const formFactor = process.env.LHCI_FORM_FACTOR === "desktop" ? "desktop" : "mobile";

// The ten most-visited paths on openui.com (site analytics, October 2026).
// Revisit when traffic shifts.
const PAGES = [
  "/",
  "/blog/how-chatgpt-intelligent-ui-works",
  "/docs",
  "/docs/openui-lang",
  "/chat",
  "/benchmarks",
  "/cloud/gateway",
  "/openui-vs-json",
  "/demos",
];

// Performance swings a lot between CI runners, so it only warns, and the floor
// sits just under today's scores (mobile 52-72, desktop 89-97) to flag real
// drops. The other categories are deterministic enough to fail the check.
const performanceFloor = formFactor === "desktop" ? 0.85 : 0.5;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec next start -p ${PORT}`,
      startServerReadyPattern: "Ready in",
      url: PAGES.map((path) => `http://localhost:${PORT}${path}`),
      numberOfRuns: 3,
      settings: {
        ...(formFactor === "desktop" ? { preset: "desktop" } : {}),
        // GitHub-hosted runners have no sandbox-capable user namespace.
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": [
          "warn",
          { minScore: performanceFloor, aggregationMethod: "median-run" },
        ],
        // Just under today's lowest page (the home page, 84). Raise it as the
        // accessibility issues Lighthouse reports get fixed.
        "categories:accessibility": ["error", { minScore: 0.8, aggregationMethod: "median-run" }],
        "categories:best-practices": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: `lighthouse-reports/${formFactor}`,
    },
  },
};
