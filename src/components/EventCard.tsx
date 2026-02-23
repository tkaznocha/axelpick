import Link from "next/link";

type EventData = {
  id: string;
  name: string;
  event_type: string;
  location: string | null;
  start_date: string;
  end_date: string;
  picks_limit: number;
  budget: number;
  points_multiplier: number;
  status: string;
};

type EventCardProps = {
  event: EventData;
  pickCount: number;
  totalPoints: number;
};

const tierConfig: Record<string, { label: string; className: string }> = {
  worlds: { label: "Worlds", className: "bg-emerald-50 text-emerald-700" },
  championship: { label: "Championship", className: "bg-sky-50 text-sky-700" },
  gp: { label: "Grand Prix", className: "bg-lavender-50 text-lavender-700" },
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function EventCard({ event, pickCount, totalPoints }: EventCardProps) {
  const tier = tierConfig[event.event_type] ?? tierConfig.gp;
  const budgetM = (event.budget / 1_000_000).toFixed(0);
  const isCompleted = event.status === "completed";
  const isLive = event.status === "in_progress";
  const picksFull = pickCount >= event.picks_limit;

  const card = (
    <div className="flex items-start justify-between gap-4">
      {/* Left side */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.className}`}>
            {tier.label} &middot; {event.points_multiplier}×
          </span>
          <StatusBadge status={event.status} />
        </div>
        <h3 className="font-display font-semibold truncate">{event.name}</h3>
        <p className="text-sm text-text-secondary mt-0.5 truncate">
          {event.location} &middot; {formatDateRange(event.start_date, event.end_date)}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {event.picks_limit} picks
          </span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            ${budgetM}M
          </span>
        </div>
      </div>

      {/* Right side — pick progress or points */}
      <div className="text-right shrink-0 pt-6">
        {isCompleted ? (
          <p className="text-sm font-semibold font-mono text-text-secondary">
            {totalPoints > 0 ? `${totalPoints} pts` : "\u2013\u2013 pts"}
          </p>
        ) : (
          <p className={`text-sm font-semibold font-mono ${
            picksFull ? "text-emerald-700" : pickCount > 0 ? "text-amber-600" : "text-text-secondary"
          }`}>
            {pickCount}/{event.picks_limit} picked
          </p>
        )}
      </div>
    </div>
  );

  if (isLive) {
    return (
      <Link href={`/events/${event.id}`} className="block rounded-2xl aurora-gradient p-px shadow-lg shadow-emerald/10 transition-all hover:shadow-xl hover:-translate-y-px">
        <div className="rounded-2xl bg-card p-5">
          {card}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/events/${event.id}`}
      className={`block rounded-xl bg-card p-5 shadow-sm border border-black/5 transition-all hover:shadow-md hover:-translate-y-px ${
        isCompleted ? "" : "card-accent-sky"
      }`}
    >
      {card}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "upcoming":
      return (
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
          Upcoming
        </span>
      );
    case "locked":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Locked
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald" />
          </span>
          Live
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-text-secondary">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Completed
        </span>
      );
    default:
      return null;
  }
}
