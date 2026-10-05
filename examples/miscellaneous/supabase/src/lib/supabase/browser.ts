import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase client suitable for use in Client Components.
 * Reads the session from browser cookies / localStorage automatically.
 */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
