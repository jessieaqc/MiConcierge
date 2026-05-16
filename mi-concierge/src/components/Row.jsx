import React from "react";
import { PALETTE } from "../lib/constants";

export default function Row({ label, value, mono, last }) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: last ? "none" : `1px dashed ${PALETTE.border}` }}>
      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
      <span className="text-[13px]" style={{ color: PALETTE.ink, fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
