import React from "react";
import { PALETTE } from "../lib/constants";

export default function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="text-[9.5px] uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </div>
      <div className="h-px flex-1" style={{ background: PALETTE.border }} />
    </div>
  );
}
