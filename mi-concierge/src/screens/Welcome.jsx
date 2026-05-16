import React from "react";
import { PALETTE } from "../lib/constants";

export default function Welcome({ onStart, onSignIn }) {
  return (
    <div className="flex-1 flex flex-col px-7 pt-16 pb-10 relative overflow-hidden">
      <div className="absolute top-6 right-6 flex flex-col items-end gap-1 opacity-80">
        <div
          className="px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase font-medium"
          style={{
            border: `1px solid ${PALETTE.ink}`,
            color: PALETTE.ink,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          v.01 · 2026
        </div>
        <div
          className="text-[9px] tracking-[0.2em] uppercase"
          style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          est. nowhere
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-auto" style={{ animation: "fadeUp 600ms ease-out" }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: 42, fontStyle: "italic", letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1 }}>
          mi
        </span>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 42, letterSpacing: "-0.02em", color: PALETTE.accent, lineHeight: 1 }}>
          concierge
        </span>
      </div>

      <div className="mb-auto" style={{ animation: "fadeUp 700ms 100ms ease-out both" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: 54, lineHeight: 0.95, letterSpacing: "-0.035em", color: PALETTE.ink }}>
          Local guides,
          <br />
          <span style={{ fontStyle: "italic", color: PALETTE.accentDeep }}>unforgettable</span>{" "}
          experiences.
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed max-w-[300px]" style={{ color: PALETTE.inkSoft }}>
          Ask a question about a city. Someone who lives there will answer — the way they'd answer a friend.
        </p>
      </div>

      <div className="flex flex-col gap-3" style={{ animation: "fadeUp 800ms 200ms ease-out both" }}>
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
            No bots · Real people
          </span>
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
        </div>
        <button
          onClick={onStart}
          className="w-full py-4 rounded-full text-[15px] font-medium transition-all active:scale-[0.98]"
          style={{ background: PALETTE.ink, color: PALETTE.paper, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em" }}
        >
          Begin
        </button>
        <button
          className="text-[13px] py-2"
          style={{ color: PALETTE.inkSoft, fontFamily: "'DM Sans', sans-serif" }}
          onClick={onSignIn}> I've been here before · Sign in </button>
      </div>
    </div>
  );
}
