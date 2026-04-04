import { getStore } from "@/data/store";
import { notFound } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const user = store.users.find((item) => item.id === id);
  if (!user) return notFound("User");
  return NextResponse.json(user);
}
