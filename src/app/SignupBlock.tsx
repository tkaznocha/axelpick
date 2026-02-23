"use client";

import { useRef, useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { joinWaitlist } from "./waitlist-action";

export default function SignupBlock({ id }: { id: string }) {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setError("enter");
      setTimeout(() => setError(null), 2000);
      return;
    }

    startTransition(async () => {
      const res = await joinWaitlist(email);
      if (res.success) {
        track("waitlist_signup");
        setSuccess(true);
      } else {
        setError("fail");
        setTimeout(() => setError(null), 3000);
      }
    });
  }

  if (success) {
    return (
      <div className="signup-block">
        <div className="signup-success">
          <div className="ico">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 12, height: 12 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p>
            You&apos;re in. We&apos;ll notify you before picks open for Worlds
            in Prague.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-block">
      <div className="signup-label">
        <span className="pulse" />
        <span>Get early access</span>
      </div>
      <div className="signup-row">
        <input
          ref={inputRef}
          type="email"
          className="signup-input"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          style={
            error === "enter"
              ? {
                  borderColor: "rgba(220,50,50,0.5)",
                  boxShadow: "0 0 0 3px rgba(220,50,50,0.08)",
                }
              : undefined
          }
        />
        <button
          className="signup-btn"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Joining..." : "Join the waitlist"}
        </button>
      </div>
      <p className="signup-fine">
        {error === "fail"
          ? "Something went wrong. Please try again."
          : id === "btm"
            ? "Free forever. No ads. Built by skating fans."
            : "No ads. No fees. Just skating."}
      </p>
    </div>
  );
}
