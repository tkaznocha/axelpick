import { getAuthUser, getDisplayName } from "@/lib/supabase-server";
import AppShell from "@/components/AppShell";
import CreateLeagueForm from "./CreateLeagueForm";

export default async function CreateLeaguePage() {
  const user = await getAuthUser();
  const displayName = user ? getDisplayName(user) : "Skater";

  return (
    <AppShell displayName={displayName}>
      <CreateLeagueForm />
    </AppShell>
  );
}
