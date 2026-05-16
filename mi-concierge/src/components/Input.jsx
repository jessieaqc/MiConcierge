import React from "react";
import { PALETTE } from "../lib/constants";

export default function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent py-2.5 mb-5 text-[15px] outline-none transition-colors"
      style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
      onFocus={(e) => (e.target.style.borderColor = PALETTE.ink)}
      onBlur={(e) => (e.target.style.borderColor = PALETTE.border)}
    />
  );
}
