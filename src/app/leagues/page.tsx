import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function LeaguesPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <AppShell>
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">My Leagues</h1>
          <p className="mt-1 text-text-secondary">
            Your private leagues and groups.
          </p>
        </div>
        <a
          href="/leagues/create"
          className="rounded-xl aurora-gradient px-5 py-2.5 font-display text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Create League
        </a>
      </div>

      {leagues.length > 0 ? (
        <div className="space-y-3">
          {leagues.map((league) => (
            <a
              key={league.id}
              href={`/leagues/${league.id}`}
              className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 transition-shadow hover:shadow-md"
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
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary mb-4">
            You&apos;re not in any leagues yet.
          </p>
          <a
            href="/leagues/create"
            className="inline-block rounded-xl aurora-gradient px-6 py-3 font-display font-semibold text-white transition-opacity hover:opacity-90"
          >
            Create Your First League
          </a>
        </div>
      )}
    </main>
    </AppShell>
  );
}
