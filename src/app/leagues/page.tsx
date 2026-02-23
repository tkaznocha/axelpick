import Link from "next/link";
import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function LeaguesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = createServerSupabaseClient();

  // Fetch user's leagues via league_members join
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, created_by, created_at)")
    .eq("user_id", user.id);

  const leagues = (memberships ?? []).map((m) => {
    const l = m.leagues as unknown as {
      id: string;
      name: string;
      created_by: string;
      created_at: string;
    };
    return {
      id: l.id,
      name: l.name,
      isCreator: l.created_by === user.id,
      createdAt: l.created_at,
    };
  });

  const displayName = getDisplayName(user);

  return (
    <AppShell displayName={displayName}>
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-lavender-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lavender">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">My Leagues</h1>
            <p className="mt-0.5 text-text-secondary">
              Your private leagues and groups.
            </p>
          </div>
        </div>
        <Link
          href="/leagues/create"
          className="rounded-xl aurora-gradient px-5 py-2.5 font-display text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create League
        </Link>
      </div>

      {leagues.length > 0 ? (
        <div className="space-y-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 card-accent-lavender transition-all hover:shadow-md hover:-translate-y-px"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold">{league.name}</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {league.isCreator ? "Created by you" : "Member"} &middot;{" "}
                    {new Date(league.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-text-secondary text-sm">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-10 text-center border border-black/5">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-lavender-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-lavender">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-text-secondary mb-4">
            You&apos;re not in any leagues yet.
          </p>
          <Link
            href="/leagues/create"
            className="inline-block rounded-xl aurora-gradient px-6 py-3 font-display font-semibold text-white transition-opacity hover:opacity-90"
          >
            Create Your First League
          </Link>
        </div>
      )}
    </main>
    </AppShell>
  );
}
