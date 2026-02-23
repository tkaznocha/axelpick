import type { Metadata } from "next";
import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountSection from "./DeleteAccountSection";
import SignOutButton from "./SignOutButton";
import { logout } from "@/app/login/actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || getDisplayName(user);

  const email = user.email || "";

  // Check if user has a password-based identity (vs. OAuth-only)
  const hasPassword = user.app_metadata?.providers?.includes("email") ?? false;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
      <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="mt-1 text-text-secondary">
            Manage your profile and account.
          </p>
        </div>

        {/* Profile card */}
        <section className="rounded-2xl bg-card p-6 shadow-sm border border-black/5 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-black/5">
            <UserAvatar avatarUrl={profile?.avatar_url} displayName={displayName} size="lg" gradient />
            <div>
              <p className="font-display font-semibold text-lg">{displayName}</p>
              {memberSince && (
                <p className="text-sm text-text-secondary">
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>

          <ProfileForm displayName={displayName} email={email} avatarUrl={profile?.avatar_url ?? null} userId={user.id} />
        </section>

        {/* Change Password — only for email/password users */}
        {hasPassword && (
          <section className="rounded-2xl bg-card p-6 shadow-sm border border-black/5 mb-6">
            <h2 className="font-display font-semibold text-lg mb-1">
              Change password
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Update the password you use to sign in.
            </p>
            <ChangePasswordForm />
          </section>
        )}

        {/* Account actions */}
        <section className="rounded-2xl bg-card p-6 shadow-sm border border-black/5">
          <h2 className="font-display font-semibold text-lg mb-1">Account</h2>
          <p className="text-sm text-text-secondary mb-4">
            Sign out or permanently delete your account.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <form action={logout}>
              <SignOutButton />
            </form>
            <DeleteAccountSection />
          </div>
        </section>
      </main>
  );
}
