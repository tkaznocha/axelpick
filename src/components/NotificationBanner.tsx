"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { markNotificationRead } from "@/app/dashboard/actions";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  event_id: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBanner({
  notifications: initial,
}: {
  notifications: Notification[];
}) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  if (notifications.length === 0) return null;

  function dismiss(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div className="mb-6 space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{n.title}</p>
              <p className="mt-1 text-sm text-amber-700">{n.body}</p>
              {n.event_id && (
                <Link
                  href={`/events/${n.event_id}`}
                  className="mt-2 inline-block text-sm font-medium text-amber-900 underline underline-offset-2 hover:no-underline"
                >
                  View Event &rarr;
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              disabled={isPending}
              className="flex-shrink-0 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
