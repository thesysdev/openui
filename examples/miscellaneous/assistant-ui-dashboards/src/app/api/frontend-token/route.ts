import { OpenUIApiError } from "@openuidev/server";
import { openui, userId } from "../../../lib/openui";

export const runtime = "nodejs";

// Mints the short-lived frontend token the browser sends to OpenUI Cloud, for the thread list and
// for streaming dashboards. It's scoped to one user, so the browser reaches only that user's
// threads and dashboards and never sees THESYS_API_KEY.
export async function POST(request: Request) {
  try {
    const token = await openui.createFrontendToken(
      { userId: userId() },
      { signal: request.signal },
    );
    return Response.json(token, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof OpenUIApiError ? (error.status ?? 500) : 500;
    return Response.json({ error: "OpenUI Cloud could not create a frontend token." }, { status });
  }
}
