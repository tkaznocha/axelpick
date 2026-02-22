import { getAuthUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const adminIds = (process.env.ADMIN_USER_ID ?? "").split(",").map((s) => s.trim());
  if (!adminIds.includes(user.id)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-text-secondary">
            You don&apos;t have admin permissions.
          </p>
        </div>
      </main>
    );
  }

  return <AdminPanel />;
}
