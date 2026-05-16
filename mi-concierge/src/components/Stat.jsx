import React from "react";
import { PALETTE } from "../lib/constants";

export default function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1 }}>
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-[0.18em] mt-1" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
    </div>
  );
}
