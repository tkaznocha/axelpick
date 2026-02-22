"use client";

export default function PicksLockTime({ lockAt }: { lockAt: string }) {
  const formatted = new Date(lockAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return <span className="font-semibold">{formatted}</span>;
}
