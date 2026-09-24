import { clearScreens, loadScreens } from "@/lib/screens";
import { resetWrites } from "@/lib/store";

export const runtime = "nodejs";

export function GET() {
  return Response.json(loadScreens());
}

export function DELETE() {
  clearScreens();
  resetWrites();
  return Response.json([]);
}
