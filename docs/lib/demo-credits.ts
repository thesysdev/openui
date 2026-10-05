export const DEMO_CREDITS_EXHAUSTED_CODE = "demo_credits_exhausted";

export const DEMO_CREDITS_EXHAUSTED_MESSAGE =
  "We're recharging the hosted demo credits. Until then, please download the repo and run it locally to see the live demo.";

export const DEMO_CREDITS_LOCAL_COMMANDS = [
  "pnpm dlx @openuidev/cli@latest create --name openui-demo --template openui-self-hosted --no-interactive",
  "cd openui-demo",
  "# Configure OPENAI_API_KEY in .env.local",
  "pnpm dev",
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
