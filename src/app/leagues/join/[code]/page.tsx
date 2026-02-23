import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import JoinLeagueButton from "./JoinLeagueButton";
import AppShell from "@/components/AppShell";

export default async function JoinLeaguePage({
  params,
}: {
  params: { code: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = createServerSupabaseClient();
  const displayName = getDisplayName(user);

  // Case-insensitive lookup + avatar in parallel
  const normalizedCode = params.code.toUpperCase().trim();

  const [{ data: league }, { data: avatarRow }] = await Promise.all([
    supabase
      .from("leagues")
      .select("id, name, invite_code, created_by")
      .eq("invite_code", normalizedCode)
      .single(),
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!league) {
    return (
      <AppShell displayName={displayName} avatarUrl={avatarRow?.avatar_url ?? null}>
      <main className="min-h-screen p-6 md:p-8 max-w-lg mx-auto">
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="font-display text-xl font-semibold mb-2">
            League not found
          </p>
          <p className="text-text-secondary">
            This invite link is invalid or has expired.
          </p>
        </div>
      </main>
      </AppShell>
    );
  }

  // Check if already a member → redirect to league page
  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (membership) {
    redirect(`/leagues/${league.id}`);
  }

  // Get member count
  const { count } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  return (
    <AppShell displayName={displayName}>
    <main className="min-h-screen p-6 md:p-8 max-w-lg mx-auto">
      <div className="rounded-2xl bg-card p-8 border border-black/5 text-center">
        <p className="text-sm text-text-secondary mb-2">
          You&apos;ve been invited to join
        </p>
        <h1 className="font-display text-3xl font-bold mb-3">{league.name}</h1>
        <p className="text-text-secondary mb-8">
          {count ?? 0} {count === 1 ? "member" : "members"}
        </p>
        <JoinLeagueButton inviteCode={league.invite_code} />
      </div>
    </main>
    </AppShell>
  );
}
