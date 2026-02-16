export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold">Event</h1>
      <p className="mt-2 text-text-secondary">Event ID: {params.id}</p>
    </main>
  );
}
