import { DEMO_CREDITS_EXHAUSTED_CODE } from "@/lib/demo-credits";

/* Hosted demos switch.
   Set NEXT_PUBLIC_DEMOS_DISABLED=1 and redeploy to take the hosted demos
   offline: the in-app demos open DemosOfflineDialog instead of sending,
   proxy.ts answers their API routes with a 402 for anyone calling them
   directly, and the proxied demos' pages show a notice instead. Unset it and
   redeploy to bring them back. */

export const DEMOS_PAUSED_MESSAGE =
  "Hosted demos are temporarily offline. Thanks for your patience while we bring them back.";

export const DEMOS_PAUSED_LOCAL_MESSAGE =
  "You can still try OpenUI on your machine: scaffold a starter app and run it locally.";

/** Scaffolds a starter app; the interactive CLI walks through the API key and setup. */
export const DEMOS_PAUSED_LOCAL_COMMAND =
  "pnpm dlx @openuidev/cli@latest create --name openui-demo";

/** Inlined at build time, so it reads the same on the server and in the browser. */
export const DEMOS_DISABLED = process.env.NEXT_PUBLIC_DEMOS_DISABLED === "1";

/* API routes that spend model credits for the in-app demos. The Cloud
   frontend-token route stays open: its tokens reach only the Conversations
   API, and /chat creates a conversation before its send is stopped. */
export const IN_APP_DEMO_API_PATHS = [
  "/api/chat",
  "/api/demo/github/stream",
  "/api/playground/stream",
  "/api/openui-cloud/chat",
] as const;

/* Demos deployed as their own Vercel projects and proxied under /demo/<slug>.
   Keep the slugs in step with proxiedDemos in next.config.mjs. The screenshots
   are captures of each hosted demo at 2x: desktop 1440x900, mobile 390x844. */
function offlineScreenshots(slug: string) {
  return {
    desktop: `/demo-unavailable/${slug}-desktop.jpg`,
    mobile: `/demo-unavailable/${slug}-mobile.jpg`,
  };
}

export const PROXIED_DEMOS = {
  "f1-dashboard": {
    title: "F1 Dashboard",
    repo: "thesysdev/openui-f1-dashboard",
    screenshots: offlineScreenshots("f1-dashboard"),
  },
  "trip-planner": {
    title: "Trip Planner",
    repo: "thesysdev/openui-trip-planner",
    screenshots: offlineScreenshots("trip-planner"),
  },
  "intelligent-ui": {
    title: "Open Intelligent UI",
    repo: "thesysdev/open-intelligent-ui",
    screenshots: offlineScreenshots("intelligent-ui"),
  },
} as const;

export type ProxiedDemoSlug = keyof typeof PROXIED_DEMOS;

export function isProxiedDemoSlug(value: string): value is ProxiedDemoSlug {
  return Object.hasOwn(PROXIED_DEMOS, value);
}

/** Scaffolds a proxied demo from its repo; the interactive CLI walks through the API key and setup. */
export function proxiedDemoLocalCommand(slug: ProxiedDemoSlug): string {
  const { repo } = PROXIED_DEMOS[slug];
  return `pnpm dlx @openuidev/cli@latest create --name ${repo.split("/")[1]} --example repo:${repo}`;
}

export function createDemosPausedResponse(): Response {
  return Response.json(
    {
      error: { code: DEMO_CREDITS_EXHAUSTED_CODE, message: DEMOS_PAUSED_MESSAGE, instructions: [] },
    },
    { status: 402 },
  );
}
