import { openui, userId } from "@/lib/openui";
import { NextResponse } from "next/server";

/**
 * Mints the short-lived fct_ token the browser uses for the storage plane.
 * The token binds its scope: storage calls are locked to its user_id/app_id.
 * For multi-user apps, derive user_id from your server-side auth session
 * here — never from the request body.
 */
export async function POST() {
  try {
    const { token, expires_at } = await openui.createFrontendToken({ userId });
    return NextResponse.json({ token, expires_at });
  } catch (error) {
    // A missing THESYS_API_KEY has no status: let it surface as is.
    const status = (error as { status?: number }).status;
    if (status === undefined) throw error;
    console.error("[frontend-token] mint failed:", status, (error as Error).message);
    return NextResponse.json({ error: { message: (error as Error).message } }, { status });
  }
}
