"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase-admin";

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

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent("Invalid email or password"));
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const displayName = (formData.get("displayName") as string)?.trim();
  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    redirect("/login?error=" + encodeURIComponent("Display name must be 1-50 characters"));
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
    redirect("/login?error=" + encodeURIComponent("That display name is already taken"));
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
    redirect("/login?error=" + encodeURIComponent("Could not create account. Please try again."));
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const host = headers().get("x-forwarded-host") ?? headers().get("host");
  const proto = headers().get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
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
