"use client";

import { useState } from "react";
import FeedbackModal from "@/components/FeedbackModal";

export default function FeedbackButton({ userEmail }: { userEmail?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90"
      >
        Send Feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} userEmail={userEmail} />
    </>
  );
}
