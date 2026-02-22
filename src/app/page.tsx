"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { joinWaitlist } from "./waitlist-action";
import "@/styles/landing.css";

export default function LandingPage() {
  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".anim-in");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      <div className="aurora-bar" />
      <div className="noise" />

      <div className="page" style={{ position: "relative", zIndex: 10 }}>
        <div className="aurora-glow" />

        {/* Nav */}
        <nav className="landing-nav">
          <a className="nav-brand" href="#">
            <span className="w-axel">Axel</span>
            <span className="w-pick">Pick</span>
            <span className="dot" />
          </a>
          <span className="nav-tag">Fantasy Figure Skating</span>
        </nav>

        {/* Hero */}
        <section className="landing-hero">
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px" }}>
            <h1>
              Your skaters.
              <br />
              Your&nbsp;<em>strategy</em>.
            </h1>
            <p className="lead">
              Figure skating finally has a fantasy league worth playing. Pick
              your team before each ISU event, earn points from real placements
              and clean programs, and see who really knows the sport best.
              We&apos;re launching with a preview round at Worlds in Prague —
              try it out before the full season kicks off this fall.
            </p>

            <SignupBlock id="hero" />
          </div>
        </section>

        {/* App Preview */}
        <section className="landing-section preview-section anim-in">
          <span className="section-label">Sneak Peek</span>
          <h2>See the game in action</h2>
          <p className="desc">
            Pick your skaters, track placements live, and watch your score
            climb. Here&apos;s what it looks like.
          </p>
          <div className="preview-grid">
            <div className="preview-frame">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <span className="placeholder-label">Skater Pick Screen</span>
              <span className="placeholder-sub">Screenshot coming soon</span>
            </div>
            <div className="preview-frame">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span className="placeholder-label">Live Scoring</span>
              <span className="placeholder-sub">Screenshot coming soon</span>
            </div>
            <div className="preview-frame tall">
              <div className="placeholder-icon">
                <svg viewBox="0 0 24 24">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="placeholder-label">
                Leaderboard &amp; Results
              </span>
              <span className="placeholder-sub">Video coming soon</span>
            </div>
          </div>
        </section>

        {/* Why Axel Pick */}
        <section className="landing-section why-section anim-in">
          <span className="section-label">Why This Exists</span>
          <h2>Built by fans, for fans</h2>
          <p className="desc">
            Fantasy leagues exist for football, basketball, F1, cricket — but
            figure skating? Nothing. The few attempts out there are buried in
            ads, clunky forms, or abandoned side projects. Axel Pick is
            different.
          </p>
          <div className="why-grid">
            <div className="why-item">
              <div
                className="why-icon"
                style={{ background: "rgba(220,60,60,0.08)", color: "#C53030" }}
              >
                &#10005;
              </div>
              <div className="why-content">
                <span className="why-old">Existing options</span>
                <p>
                  Ad-walled blogs, spreadsheet-based leagues, abandoned apps.
                  No real game design. No mobile experience. No fun.
                </p>
              </div>
            </div>
            <div className="why-item">
              <div
                className="why-icon"
                style={{
                  background: "rgba(0,165,114,0.08)",
                  color: "var(--emerald)",
                }}
              >
                &#10003;
              </div>
              <div className="why-content">
                <span className="why-new">Axel Pick</span>
                <p>
                  A real fantasy game with budget mechanics, dynamic pricing,
                  placement scoring, and private leagues — designed for the
                  skating community from day one.
                </p>
              </div>
            </div>
          </div>
          <div className="why-values">
            <div className="why-val">
              <strong>Free forever.</strong> No paywalls, no premium tiers.
            </div>
            <div className="why-val">
              <strong>No ads.</strong> Clean experience, always.
            </div>
            <div className="why-val">
              <strong>Community-first.</strong> Built with input from skating
              fans.
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="landing-section how-section anim-in">
          <span className="section-label">How It Works</span>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <h3>Scout the entry list</h3>
              <p>
                Before each event, browse the real entry list and pick your
                skaters. Ilia or Kaori? A rising junior dark horse? Your
                budget, your call.
              </p>
            </div>
            <div className="how-step">
              <div className="how-step-num">2</div>
              <h3>Watch and earn</h3>
              <p>
                Points flow in from real results — placements, clean programs,
                personal bests. Every quad landed and every fall matters.
              </p>
            </div>
            <div className="how-step">
              <div className="how-step-num">3</div>
              <h3>Prove you know the sport</h3>
              <p>
                Climb the global leaderboard or create a private league with
                your skating friends. The preview round is at Worlds — the
                full season starts in October with the Grand Prix Series.
              </p>
            </div>
          </div>
        </section>

        {/* First Event */}
        <section className="landing-section event-section anim-in">
          <div className="event-card">
            <div className="event-top">
              <div>
                <div className="event-badge">
                  <span className="dot" />
                  Preview Round
                </div>
                <div className="event-title">
                  ISU World Championships 2026
                </div>
                <div className="event-meta">
                  Prague, Czech Republic &middot; March 24–29
                </div>
              </div>
            </div>
            <div className="event-stats-row">
              <div className="ev-stat">
                <div className="ev-stat-val">8</div>
                <div className="ev-stat-label">Picks</div>
              </div>
              <div className="ev-stat">
                <div className="ev-stat-val">2&times;</div>
                <div className="ev-stat-label">Points</div>
              </div>
              <div className="ev-stat">
                <div className="ev-stat-val">$70M</div>
                <div className="ev-stat-label">Budget</div>
              </div>
            </div>
            <Countdown />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="landing-section bottom-cta anim-in">
          <h2>The season finale is your starting line</h2>
          <p>
            Try Axel Pick at Worlds in Prague — get a feel for the game before
            the full season launches in October.
          </p>
          <SignupBlock id="btm" />
        </section>

        {/* Footer */}
        <footer className="site-footer">
          <span className="copy">&copy; 2026 Axel Pick</span>
          <div className="foot-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a
              href="https://x.com/axelpick"
              target="_blank"
              rel="noopener noreferrer"
            >
              X / Twitter
            </a>
            <a href="mailto:hello@axelpick.app">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ===== Signup block ===== */

function SignupBlock({ id }: { id: string }) {
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

/* ===== Countdown ===== */

function Countdown() {
  const [time, setTime] = useState({ d: "--", h: "--", m: "--", s: "--" });

  useEffect(() => {
    function tick() {
      const t =
        new Date("2026-03-22T00:00:00Z").getTime() - new Date().getTime();
      if (t <= 0) {
        setTime({ d: "00", h: "00", m: "00", s: "00" });
        return;
      }
      setTime({
        d: String(Math.floor(t / 864e5)).padStart(2, "0"),
        h: String(Math.floor((t % 864e5) / 36e5)).padStart(2, "0"),
        m: String(Math.floor((t % 36e5) / 6e4)).padStart(2, "0"),
        s: String(Math.floor((t % 6e4) / 1e3)).padStart(2, "0"),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cd-row">
      <span className="cd-label">Preview round opens in</span>
      <div className="cd-digits">
        <div className="cd-unit">
          <div className="cd-num">{time.d}</div>
          <div className="cd-unit-label">Days</div>
        </div>
        <span className="cd-sep">:</span>
        <div className="cd-unit">
          <div className="cd-num">{time.h}</div>
          <div className="cd-unit-label">Hrs</div>
        </div>
        <span className="cd-sep">:</span>
        <div className="cd-unit">
          <div className="cd-num">{time.m}</div>
          <div className="cd-unit-label">Min</div>
        </div>
        <span className="cd-sep">:</span>
        <div className="cd-unit">
          <div className="cd-num">{time.s}</div>
          <div className="cd-unit-label">Sec</div>
        </div>
      </div>
    </div>
  );
}
