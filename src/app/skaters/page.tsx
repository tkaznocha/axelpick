import type { Metadata } from "next";
import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SkaterList from "./SkaterList";

export const metadata: Metadata = { title: "Skaters" };

export default async function SkatersPage() {
  const supabase = createServerSupabaseClient();

  const [user, { data: skaters }] = await Promise.all([
    getAuthUser(),
    supabase
      .from("skaters")
      .select("id, name, country, discipline, world_ranking, current_price, season_best_score, personal_best_score, is_active")
      .eq("is_active", true)
      .order("world_ranking", { ascending: true, nullsFirst: false }),
  ]);

  if (!user) redirect("/login");

  const { data: avatarRow } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const displayName = getDisplayName(user);

  return (
    <AppShell displayName={displayName} avatarUrl={avatarRow?.avatar_url ?? null}>
      <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Skaters</h1>
          <p className="mt-1 text-text-secondary">Browse all skaters in the game.</p>
        </div>
        <SkaterList skaters={skaters ?? []} />
      </main>
    </AppShell>
  );
}
