import type { Metadata } from "next";
import { Suspense } from "react";
import Countdown from "./Countdown";
import ScrollReveal from "./ScrollReveal";
import "@/styles/landing.css";

export const metadata: Metadata = {
  title: "Axel Pick — Fantasy Figure Skating",
  description:
    "The first real fantasy game for figure skating. Pick your team before each ISU event, earn points from real placements and clean programs, and compete on the leaderboard. Free forever, no ads.",
  openGraph: {
    title: "Axel Pick — Fantasy Figure Skating",
    description:
      "The first real fantasy game for figure skating. Pick your team, earn points from real ISU results, and compete with friends.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Axel Pick",
  url: "https://axelpick.app",
  description:
    "Fantasy figure skating — pick your skaters, earn points from real ISU competition results, and compete on the leaderboard.",
  applicationCategory: "GameApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Organization", name: "Axel Pick", url: "https://axelpick.app" },
};

export default function LandingPage() {
  return (
    <div className="landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="aurora-bar" />
      <div className="noise" />

      <div className="page" style={{ position: "relative", zIndex: 10 }}>
        <div className="aurora-glow" />

        {/* Nav */}
        <nav className="landing-nav">
          <a className="nav-brand" href="#">
            <img src="/logo.png" alt="" width={32} height={32} className="nav-brand-logo" />
            <span className="w-axel">Axel</span>
            <span className="w-pick">Pick</span>
          </a>
          <a href="/login" className="nav-tag">Log in</a>
        </nav>

        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-section">
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

            <a href="/login" className="signup-btn">Play Now</a>
            <p className="social-proof">
              <span className="social-proof-dot" />
              150+ players signed up in the first 24 hours
            </p>
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
          <div className="preview-screenshot">
            <img
              src="/landingscreen.png"
              alt="Axel Pick skater pick screen showing ISU World Championships 2026"
              width={860}
              height={0}
            />
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
                Points flow in from real results — the better your skaters
                place, the more you earn. Every position counts.
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

        {/* Social Media */}
        <section className="landing-section social-section anim-in">
          <p className="social-heading">
            Follow Axel Pick on social media
          </p>
          <div className="social-icons">
            <a
              href="https://x.com/axelpickapp?s=21"
              target="_blank"
              rel="noopener"
              className="social-icon-link"
              aria-label="Follow on X"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/axelpick.app?igsh=M2QzMXRoeGZ6ZGRl&utm_source=qr"
              target="_blank"
              rel="noopener"
              className="social-icon-link"
              aria-label="Follow on Instagram"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
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
            <Suspense>
              <Countdown />
            </Suspense>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="landing-section bottom-cta anim-in">
          <h2>The season finale is your starting line</h2>
          <p>
            Try Axel Pick at Worlds in Prague — get a feel for the game before
            the full season launches in October.
          </p>
          <a href="/login" className="signup-btn">Play Now</a>
        </section>

        {/* Footer */}
        <footer className="site-footer">
          <span className="copy">&copy; 2026 Axel Pick</span>
          <div className="foot-links">
            <a href="https://x.com/axelpickapp?s=21" target="_blank" rel="noopener">X</a>
            <a href="https://www.instagram.com/axelpick.app?igsh=M2QzMXRoeGZ6ZGRl&utm_source=qr" target="_blank" rel="noopener">Instagram</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="mailto:support@axelpick.app">Contact</a>
          </div>
        </footer>
      </div>

      <ScrollReveal />
    </div>
  );
}
