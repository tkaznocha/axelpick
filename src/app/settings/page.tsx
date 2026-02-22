import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProfileForm from "./ProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountSection from "./DeleteAccountSection";
import { logout } from "@/app/login/actions";

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
    <AppShell displayName={displayName}>
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
            <div className="h-14 w-14 rounded-full aurora-gradient flex items-center justify-center text-xl font-semibold text-white shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-semibold text-lg">{displayName}</p>
              {memberSince && (
                <p className="text-sm text-text-secondary">
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>

          <ProfileForm displayName={displayName} email={email} />
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
              <button
                type="submit"
                className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-display font-semibold text-text-secondary transition-colors hover:bg-black/5"
              >
                Sign out
              </button>
            </form>
            <DeleteAccountSection />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
