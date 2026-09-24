import { ZodError } from "zod/v4";
import { openDatabase, queryDashboard } from "../../../lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON object with month and country." }, { status: 400 });
  }
  let db;
  try {
    db = openDatabase();
    return Response.json(queryDashboard(db, input));
  } catch (error) {
    const invalid = error instanceof ZodError || error instanceof RangeError;
    const message = invalid
      ? "Choose a supported month and country."
      : "Dataset unavailable. Run python scripts/prepare_data.py, then retry.";
    return Response.json({ error: message }, { status: invalid ? 400 : 503 });
  } finally {
    db?.close();
  }
}
