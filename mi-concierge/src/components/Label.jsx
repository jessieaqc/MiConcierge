import React from "react";
import { PALETTE } from "../lib/constants";

export default function Label({ children }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.22em", color: PALETTE.inkSoft, textTransform: "uppercase", marginBottom: 7, marginTop: 4 }}>
      {children}
    </div>
  );
}
