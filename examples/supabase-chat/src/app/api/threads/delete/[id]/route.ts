import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * DELETE /api/threads/delete/:id
 *
 * Deletes a thread (and its messages, via ON DELETE CASCADE).
 * Returns 204 No Content on success.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("threads")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[threads/delete/:id]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
