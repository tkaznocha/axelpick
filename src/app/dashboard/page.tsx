import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile from public.users table
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, total_season_points")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Skater";

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date, event_type, status, picks_limit, budget")
    .in("status", ["upcoming", "locked"])
    .order("start_date", { ascending: true })
    .limit(3);

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Hey, {displayName}
          </h1>
          <p className="mt-1 text-text-secondary">
            Welcome to your fantasy skating dashboard.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-black/5"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Season Points */}
      <div className="mb-8 rounded-2xl aurora-gradient p-px">
        <div className="rounded-2xl bg-card p-6">
          <p className="text-sm text-text-secondary">Season Points</p>
          <p className="font-display text-4xl font-bold mt-1">
            {profile?.total_season_points ?? 0}
          </p>
        </div>
      </div>

      {/* Upcoming Events */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">
          Upcoming Events
        </h2>

        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold">
                      {event.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {event.location} &middot;{" "}
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" \u2013 "}
                      {new Date(event.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {event.picks_limit} picks &middot; ${(event.budget / 1_000_000).toFixed(0)}M
                    </span>
                    <p className="text-xs text-text-secondary mt-1 capitalize">
                      {event.status}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card p-8 text-center border border-black/5">
            <p className="text-text-secondary">
              No upcoming events yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
