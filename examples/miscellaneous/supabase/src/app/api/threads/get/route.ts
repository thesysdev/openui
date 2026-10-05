import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * GET /api/threads/get
 *
 * Returns the authenticated user's thread list, newest first.
 * Response shape: { threads: Thread[], nextCursor?: any }
 */
export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not yet authenticated — return an empty list so the sidebar renders cleanly.
    return Response.json({ threads: [] });
  }

  const { data: threads, error } = await supabase
    .from("threads")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[threads/get]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    threads: (threads ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      createdAt: t.created_at,
    })),
  });
}
