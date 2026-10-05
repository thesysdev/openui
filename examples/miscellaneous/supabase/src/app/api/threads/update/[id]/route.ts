import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

/**
 * PATCH /api/threads/update/:id
 *
 * Updates thread metadata (currently just the title).
 * Body: Thread — { id, title, createdAt }
 * Response: Thread — the updated row
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { title?: string };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: updated, error } = await supabase
    .from("threads")
    .update({ title: body.title })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[threads/update/:id]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: updated.id,
    title: updated.title,
    createdAt: updated.created_at,
  });
}
