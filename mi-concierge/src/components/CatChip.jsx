import React from "react";
import { PALETTE } from "../lib/constants";

export default function CatChip({ label, active, onClick, Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
      style={{
        background: active ? PALETTE.ink : "transparent",
        color: active ? PALETTE.paper : PALETTE.ink,
        border: `1px solid ${active ? PALETTE.ink : PALETTE.border}`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {Icon && <Icon size={12.5} strokeWidth={1.7} />}
      {label}
    </button>
  );
}
