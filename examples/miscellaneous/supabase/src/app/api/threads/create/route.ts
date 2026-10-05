import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

/**
 * POST /api/threads/create
 *
 * Called by OpenUI when the user sends their first message.
 * Body: { messages: OpenAIMessage[] }  (already in OpenAI format via messageFormat.toApi())
 * Response: Thread — { id, title, createdAt }
 *
 * We derive the thread title from the first user message so the sidebar
 * shows a useful label immediately.  The initial messages are NOT stored
 * here; the /api/chat route writes them after the first assistant reply.
 */
export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as {
    messages: Array<{ role: string; content: unknown }>;
  };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use the first user message as a title preview (≤ 60 chars).
  const firstUserMsg = messages?.find((m) => m.role === "user");
  const rawContent = firstUserMsg?.content;
  const title =
    typeof rawContent === "string" && rawContent.trim().length > 0
      ? rawContent.trim().slice(0, 60)
      : "New Chat";

  const { data: thread, error } = await supabase
    .from("threads")
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) {
    console.error("[threads/create]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: thread.id,
    title: thread.title,
    createdAt: thread.created_at,
  });
}
