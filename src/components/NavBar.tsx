"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/leagues", label: "Leagues" },
];

export default function NavBar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky top-0 z-50">
      {/* Aurora top strip */}
      <div className="h-[2px] aurora-gradient" />

      <div className="bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold aurora-text">
              Axel Pick
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03]"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-text-secondary">{displayName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-black/5"
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[2px] w-5 bg-text-primary transition-transform ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 bg-text-primary transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-5 bg-text-primary transition-transform ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-black/5 bg-white px-4 pb-4 pt-2">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03]"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
              <span className="text-sm text-text-secondary">{displayName}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-black/5"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
