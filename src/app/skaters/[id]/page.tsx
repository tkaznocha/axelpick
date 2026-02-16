export default function SkaterPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold">Skater Profile</h1>
      <p className="mt-2 text-text-secondary">Skater ID: {params.id}</p>
    </main>
  );
}
