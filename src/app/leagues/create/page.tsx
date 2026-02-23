import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import AppShell from "@/components/AppShell";
import CreateLeagueForm from "./CreateLeagueForm";

export default async function CreateLeaguePage() {
  const user = await getAuthUser();
  const displayName = user ? getDisplayName(user) : "Skater";

  let avatarUrl: string | null = null;
  if (user) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <AppShell displayName={displayName} avatarUrl={avatarUrl}>
      <CreateLeagueForm />
    </AppShell>
  );
}
