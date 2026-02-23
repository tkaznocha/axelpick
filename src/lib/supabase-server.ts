import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Read the current session from the cookie — no network round-trip.
 * The middleware already called getUser() to validate & refresh the token,
 * so by the time a Server Component runs the cookie is up-to-date.
 */
export const getAuthUser = cache(async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
});

/** Derive a display name from a Supabase user without a DB query. */
export function getDisplayName(user: User): string {
  return (
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Skater"
  );
}
