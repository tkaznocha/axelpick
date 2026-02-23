import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase-server";
import NavBar from "./NavBar";

export default async function AppShell({
  displayName = "Skater",
  children,
}: {
  displayName?: string;
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
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
    <>
      <div className="app-aurora-bar" />
      <div className="app-aurora-glow" />
      <div className="app-aurora-glow-mid" />
      <div className="app-aurora-glow-btm" />
      <div className="app-noise" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <NavBar displayName={displayName} avatarUrl={avatarUrl} />
        {children}
      </div>
    </>
  );
}
