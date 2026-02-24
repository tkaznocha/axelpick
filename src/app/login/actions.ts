"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAppOrigin } from "@/lib/url";

const SAFE_PATH = /^\/[a-zA-Z0-9\-_/]*$/;
function safeDest(raw: string | null): string {
  if (raw && SAFE_PATH.test(raw)) return raw;
  return "/dashboard";
}

function createClient() {
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
            // Ignore
          }
        },
      },
    }
  );
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const next = formData.get("next") as string | null;

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    const params = new URLSearchParams({ error: "Invalid email or password" });
    if (next) params.set("next", next);
    redirect("/login?" + params.toString());
  }

  redirect(safeDest(next));
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const next = formData.get("next") as string | null;

  function loginRedirect(params: Record<string, string>) {
    const sp = new URLSearchParams(params);
    if (next) sp.set("next", next);
    redirect("/login?" + sp.toString());
  }

  const displayName = (formData.get("displayName") as string)?.trim();
  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    loginRedirect({ error: "Display name must be 1-50 characters" });
  }

  // Case-insensitive uniqueness check (admin client needed — user isn't authenticated yet)
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .ilike("display_name", displayName)
    .limit(1)
    .maybeSingle();

  if (existing) {
    loginRedirect({ error: "That display name is already taken" });
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    loginRedirect({ error: "Password must be at least 8 characters" });
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName,
      },
    },
  });

  if (error) {
    loginRedirect({ error: "Could not create account. Please try again." });
  }

  loginRedirect({ message: "Check your email to confirm your account" });
}

export async function signInWithGoogle(next?: string) {
  const supabase = createClient();
  const origin = getAppOrigin();

  const callbackUrl = new URL("/auth/callback", origin);
  const dest = safeDest(next ?? null);
  if (dest !== "/dashboard") {
    callbackUrl.searchParams.set("next", dest);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent("Sign-in failed. Please try again."));
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
