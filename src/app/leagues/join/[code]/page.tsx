export default function JoinLeaguePage({
  params,
}: {
  params: { code: string };
}) {
  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-3xl font-bold">Join League</h1>
      <p className="mt-2 text-text-secondary">Invite code: {params.code}</p>
    </main>
  );
}
