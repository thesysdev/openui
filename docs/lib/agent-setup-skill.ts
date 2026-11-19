import { POSTHOG_KEY } from "@/lib/analytics";
import { after } from "next/server";

const AGENT_SETUP_SKILL = `Set up my first Generative UI agent using the recommended OpenUI stack.

1. Scaffold: run \`npx @openuidev/cli@latest create\`. It runs without prompts, creates the project folder, and installs dependencies.
2. Tell me if there are any steps required of me to complete.
3. First message: start the app, open its local URL, send one message, and tell me what the server log actually returned.`;

export function GET(request: Request): Response {
  const { pathname } = new URL(request.url);

  after(() =>
    fetch("https://us.i.posthog.com/i/v0/e/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "skill_md_fetched",
        distinct_id: crypto.randomUUID(),
        properties: {
          path: pathname,
          user_agent: request.headers.get("user-agent"),
          $process_person_profile: false,
        },
      }),
    }).catch(() => {
      // Analytics must never fail the fetch being counted.
    }),
  );

  return new Response(AGENT_SETUP_SKILL, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
