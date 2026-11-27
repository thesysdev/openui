import { OpenUIApiError } from "@openuidev/server";
import { openui, userId } from "../../../lib/openui";

export const runtime = "nodejs";

// Mints the short-lived frontend token that useOpenuiCloudStorage() sends with its
// Conversations API calls. Gateway scopes the token to one user and app, so the browser
// reaches only those threads and never sees THESYS_API_KEY.
export async function POST(request: Request) {
  try {
    const { token, expires_at } = await openui.createFrontendToken(
      { userId },
      { signal: request.signal },
    );
    return Response.json(
      { token, expires_at },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    // A missing THESYS_API_KEY has no status: let it surface as is.
    if (!(error instanceof OpenUIApiError) || error.status === undefined) throw error;
    return Response.json(
      { error: "OpenUI Gateway could not create a frontend token." },
      { status: error.status },
    );
  }
}
