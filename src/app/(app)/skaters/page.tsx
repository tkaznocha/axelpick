import type { Metadata } from "next";
import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import SkaterList from "./SkaterList";

export const metadata: Metadata = { title: "Skaters" };

export default async function SkatersPage() {
  const supabase = createServerSupabaseClient();

  const [user, { data: skaters }] = await Promise.all([
    getAuthUser(),
    supabase
      .from("skaters")
      .select("id, name, country, discipline, world_ranking, current_price, season_best_score, personal_best_score, season_best_sp, season_best_fs, is_active")
      .eq("is_active", true)
      .order("world_ranking", { ascending: true, nullsFirst: false }),
  ]);

  if (!user) redirect("/login");

  return (
      <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold">Skaters</h1>
          <p className="mt-1 text-text-secondary">Browse all skaters in the game.</p>
        </div>
        <SkaterList skaters={skaters ?? []} />
      </main>
  );
}
