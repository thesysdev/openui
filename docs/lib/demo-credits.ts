export const DEMO_CREDITS_EXHAUSTED_CODE = "demo_credits_exhausted";

export const DEMO_CREDITS_EXHAUSTED_MESSAGE =
  "We're recharging the hosted demo credits. Until then, please download the repo and run it locally to see the live demo.";

// The interactive CLI walks through the API key and setup, so one command is enough.
export const DEMO_CREDITS_LOCAL_COMMANDS = [
  "pnpm dlx @openuidev/cli@latest create --name openui-demo",
] as const;

export type DemoCreditsErrorPayload = {
  code: typeof DEMO_CREDITS_EXHAUSTED_CODE;
  message: string;
  instructions: readonly string[];
};

export function createDemoCreditsErrorPayload(): DemoCreditsErrorPayload {
  return {
    code: DEMO_CREDITS_EXHAUSTED_CODE,
    message: DEMO_CREDITS_EXHAUSTED_MESSAGE,
    instructions: DEMO_CREDITS_LOCAL_COMMANDS,
  };
}

export function isDemoCreditsErrorPayload(value: unknown): value is DemoCreditsErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (value as { code?: unknown }).code === DEMO_CREDITS_EXHAUSTED_CODE
  );
}

function hasPaymentRequiredCode(value: unknown, depth = 0): boolean {
  if (depth > 4 || typeof value !== "object" || value === null) return false;

  for (const [key, child] of Object.entries(value)) {
    if (["code", "status", "statusCode"].includes(key) && (child === 402 || child === "402")) {
      return true;
    }

    if (hasPaymentRequiredCode(child, depth + 1)) {
      return true;
    }
  }

  return false;
}

export function isDemoCreditsExhaustedError(error: unknown, status?: number): boolean {
  if (status === 402) return true;
  return hasPaymentRequiredCode(error);
}

export function createDemoCreditsExhaustedResponse(): Response {
  return Response.json({ error: createDemoCreditsErrorPayload() }, { status: 402 });
}

/* ── Hosted demos switch ──
   Set NEXT_PUBLIC_DEMOS_DISABLED=1 and redeploy to take the hosted demos
   offline: proxy.ts answers their API routes with a 402, which opens
   DemoCreditsDialog with the offline copy, and the proxied demos' pages show a
   notice instead. Unset it and redeploy to bring them back. */

export const DEMOS_PAUSED_MESSAGE =
  "Hosted demos are temporarily offline. Thanks for your patience while we bring them back.";

export const DEMOS_PAUSED_LOCAL_MESSAGE =
  "You can still try OpenUI on your machine: scaffold a starter app and run it locally.";

/** Inlined at build time, so it reads the same on the server and in the browser. */
export function areDemosDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMOS_DISABLED === "1";
}

/* API routes that spend model credits for the in-app demos. The Cloud
   frontend-token route stays open: its tokens reach only the Conversations
   API, and the Cloud chat needs one to send, which is what opens the dialog. */
export const IN_APP_DEMO_API_PATHS = [
  "/api/chat",
  "/api/demo/github/stream",
  "/api/playground/stream",
  "/api/openui-cloud/chat",
] as const;

/* Demos deployed as their own Vercel projects and proxied under /demo/<slug>.
   Keep the slugs in step with proxiedDemos in next.config.mjs. */
export const PROXIED_DEMOS = {
  "f1-dashboard": {
    title: "F1 Dashboard",
    repo: "thesysdev/openui-f1-dashboard",
    screenshot: "/homepage/showcase/f1-season.jpg",
  },
  "trip-planner": {
    title: "Trip Planner",
    repo: "thesysdev/openui-trip-planner",
    screenshot: "/homepage/showcase/travel-answer.jpg",
  },
  "intelligent-ui": {
    title: "Open Intelligent UI",
    repo: "thesysdev/open-intelligent-ui",
    screenshot: "/nav/open-intelligent-ui-light.png",
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
