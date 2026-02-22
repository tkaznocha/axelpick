"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

export default function CopyInviteLink({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const link = `${window.location.origin}/leagues/join/${inviteCode}`;
    await navigator.clipboard.writeText(link);
    track("invite_link_copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full rounded-xl border border-black/10 bg-card px-4 py-3 text-left transition-colors hover:bg-black/[0.02]"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-text-secondary mb-1">Invite Link</p>
          <p className="font-mono text-sm truncate">
            /leagues/join/{inviteCode}
          </p>
        </div>
        <span
          className={`ml-3 flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            copied
              ? "bg-emerald-50 text-emerald-700"
              : "bg-black/5 text-text-secondary hover:bg-black/10"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </span>
      </div>
    </button>
  );
}
