import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Returns a Supabase client suitable for use in Server Components,
 * Server Actions, and Route Handlers.
 * The session is read from (and written to) the Next.js cookie store.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called inside a Server Component — cookies cannot be mutated here.
            // The middleware handles session refresh so this is safe to ignore.
          }
        },
      },
    },
  );
}
