import { localDemoAccess } from "../../../lib/gateway-session";
import { openDatabase } from "../../../lib/stays";

export const runtime = "nodejs";

// The simulated bookings shown on the My bookings page, newest first.
export async function GET(request: Request) {
  const denied = localDemoAccess(request);
  if (denied) return denied;
  let db;
  try {
    db = openDatabase();
    const bookings = db
      .prepare(
        `SELECT b.code, b.check_in, b.check_out, b.guests, b.guest_name, b.total,
          l.id AS listing_id, l.name, l.neighbourhood
        FROM bookings b JOIN listings l ON l.id = b.listing_id
        ORDER BY b.created_at DESC`,
      )
      .all();
    return Response.json({ bookings }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Prepare the listings with npm run prepare:listings." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }
}
