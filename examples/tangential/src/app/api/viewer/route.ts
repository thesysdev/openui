import { getStore } from "@/data/store";
import { NextResponse } from "next/server";

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.users[0] ?? null);
}
