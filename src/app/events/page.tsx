import { getAuthUser, getDisplayName } from "@/lib/supabase-server";
import AppShell from "@/components/AppShell";

export default async function EventsPage() {
  const user = await getAuthUser();
  const displayName = user ? getDisplayName(user) : "Skater";

  return (
    <AppShell displayName={displayName}>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Events</h1>
      <p className="mt-2 text-text-secondary">Season calendar.</p>
    </main>
    </AppShell>
  );
}
