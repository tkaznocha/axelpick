import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase-server";
import NavBar from "./NavBar";

export default async function AppShell({
  displayName = "Skater",
  avatarUrl,
  email,
  children,
}: {
  displayName?: string;
  avatarUrl?: string | null;
  email?: string;
  children: React.ReactNode;
}) {
  // Only fetch avatar from DB if the caller didn't provide it
  let resolvedAvatarUrl = avatarUrl ?? null;
  if (resolvedAvatarUrl === null && avatarUrl === undefined) {
    const user = await getAuthUser();
    if (user) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      resolvedAvatarUrl = data?.avatar_url ?? null;
    }
  }

  return (
    <>
      <div className="app-aurora-bar" />
      <div className="app-aurora-glow" />
      <div className="app-aurora-glow-mid" />
      <div className="app-aurora-glow-btm" />
      <div className="app-noise" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar displayName={displayName} avatarUrl={resolvedAvatarUrl} email={email} />
        {children}
      </div>
    </>
  );
}
