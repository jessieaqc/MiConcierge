import React from "react";
import { ChevronRight } from "lucide-react";
import { PALETTE } from "../lib/constants";

export default function SettingRow({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3.5 px-1 text-left" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
      <span className="text-[14px]" style={{ color: PALETTE.ink }}>{label}</span>
      <ChevronRight size={15} strokeWidth={1.7} style={{ color: PALETTE.inkSoft }} />
    </button>
  );
}
