import { localDemoAccess, mintFrontendToken } from "../../../lib/cloud-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = localDemoAccess(request);
  if (denied) return denied;
  try {
    return Response.json(await mintFrontendToken(request.signal), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to connect to Cloud storage." },
      { status: 503 },
    );
  }
}
