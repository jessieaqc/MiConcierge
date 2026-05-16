import React, { useState } from "react";
import { Star } from "lucide-react";
import { PALETTE } from "../lib/constants";

export default function StarRating({ value, average, onChange }) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = hover ? hover >= n : value >= n;
          return (
            <button
              key={n}
              disabled={!interactive}
              onClick={() => onChange?.(n)}
              onMouseEnter={() => interactive && setHover(n)}
              onMouseLeave={() => interactive && setHover(0)}
              className={`p-0.5 transition-transform ${interactive ? "active:scale-90 cursor-pointer" : ""}`}
              style={{ cursor: interactive ? "pointer" : "default" }}
            >
              <Star
                size={14}
                strokeWidth={1.5}
                fill={filled ? PALETTE.gold : "transparent"}
                style={{ color: filled ? PALETTE.gold : PALETTE.inkFaint }}
              />
            </button>
          );
        })}
      </div>

      {average > 0 ? (
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ color: PALETTE.gold, background: PALETTE.accentSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {average.toFixed(1)}
        </span>
      ) : value > 0 ? (
        <span
          className="text-[10.5px] ml-1"
          style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}.0
        </span>
      ) : null}
    </div>
  );
}
