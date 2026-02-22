import AppShell from "@/components/AppShell";

export default function SkaterPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Skater Profile</h1>
      <p className="mt-2 text-text-secondary">Skater ID: {params.id}</p>
    </main>
    </AppShell>
  );
}
