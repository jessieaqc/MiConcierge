import React from "react";
import { PALETTE } from "../lib/constants";

export default function RoleCard({ active, onClick, title, sub, Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        background: active ? PALETTE.ink : PALETTE.paper,
        color: active ? PALETTE.paper : PALETTE.ink,
        border: `1px solid ${active ? PALETTE.ink : PALETTE.border}`,
      }}
    >
      <Icon size={18} strokeWidth={1.5} className="mb-2" />
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>{title}</div>
      <div className="text-[11px] mt-0.5" style={{ opacity: 0.7 }}>{sub}</div>
    </button>
  );
}
