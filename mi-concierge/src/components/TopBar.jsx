import React from "react";
import { ArrowLeft } from "lucide-react";
import { PALETTE } from "../lib/constants";

export default function TopBar({ onBack, title }) {
  return (
    <div className="flex items-center justify-between px-6 pt-14 pb-3">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
        style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
      >
        <ArrowLeft size={16} strokeWidth={1.8} style={{ color: PALETTE.ink }} />
      </button>
      <div className="text-[10.5px] uppercase tracking-[0.3em]" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </div>
      <div className="w-10 h-10" />
    </div>
  );
}
