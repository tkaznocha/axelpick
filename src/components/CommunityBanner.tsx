"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "community-banner-dismissed";

export default function CommunityBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative bg-white/85 backdrop-blur-sm border-b border-black/5">
      {/* Aurora accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{ background: "var(--aurora)" }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Message + icons */}
        <p className="flex-1 flex items-center flex-wrap gap-x-2.5 gap-y-1 text-sm text-text-secondary min-w-0">
          <span>
            Join the Axel Pick community on social media — help us grow and stay in the loop
          </span>
          <span className="flex items-center gap-2.5 shrink-0">
            {/* X / Twitter */}
            <a
              href="https://x.com/axelpickapp?s=21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @axelpick on X"
              title="@axelpick on X"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/axelpick.app?igsh=M2QzMXRoeGZ6ZGRl&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @axelpickapp on Instagram"
              title="@axelpickapp on Instagram"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </span>
        </p>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="flex-shrink-0 p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" />
          </svg>
        </button>
      </div>
    </div>
  );
}
