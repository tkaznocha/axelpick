export default function LeaguePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold">League</h1>
      <p className="mt-2 text-text-secondary">League ID: {params.id}</p>
    </main>
  );
}
