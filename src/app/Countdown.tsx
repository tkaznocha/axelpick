"use client";

import { useEffect, useState } from "react";

export default function Countdown() {
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
      <span className="cd-label">Rosters lock in</span>
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
