export default function ResultsPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold">Results</h1>
      <p className="mt-2 text-text-secondary">Results for event: {params.id}</p>
    </main>
  );
}
