import React from "react";
import { PALETTE } from "../lib/constants";

export default function EmptyNote({ text }) {
  return (
    <div className="rounded-2xl p-5 text-center text-[13px]" style={{ background: PALETTE.paper, border: `1px dashed ${PALETTE.border}`, color: PALETTE.inkSoft, fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
      {text}
    </div>
  );
}
