import React from "react";
import { PALETTE } from "../lib/constants";

export default function SkeletonCard() {
  return (
    <div
      className="w-full mb-4 p-5 rounded-3xl"
      style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, height: 168, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite" }}
    />
  );
}
