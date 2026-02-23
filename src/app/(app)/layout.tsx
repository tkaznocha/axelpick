import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import AppShell from "@/components/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  let displayName = "Skater";
  let avatarUrl: string | null = null;

  if (user) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();
    displayName = data?.display_name || getDisplayName(user);
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <AppShell displayName={displayName} avatarUrl={avatarUrl}>
      {children}
    </AppShell>
  );
}
