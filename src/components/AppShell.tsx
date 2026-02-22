import { createServerSupabaseClient } from "@/lib/supabase-server";
import NavBar from "./NavBar";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Skater";

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    displayName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Skater";
  }

  return (
    <>
      <NavBar displayName={displayName} />
      {children}
    </>
  );
}
