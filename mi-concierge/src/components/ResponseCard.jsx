import React, { useState, useEffect } from "react";
import { Star, Heart, Coffee } from "lucide-react";
import { PALETTE } from "../lib/constants";
import { api } from "../lib/api";
import StarRating from "./StarRating";

export default function ResponseCard({ response, me, postAuthor, isMyPost, onRate, onTip, delay }) {
  const [avgRating, setAvgRating] = useState(null);

  const isTourist = me?.role === "tourist";
  const isPostOwner = me?.id === postAuthor?.id;

  // Turista que NO es dueño del post → solo ve, no califica
  const canRate = isTourist && isPostOwner;

  const fetchAverage = () => {
    api
      .get(`/ratings/${response.id}/average`)
      .then((data) => setAvgRating(data.average))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAverage();
  }, [response.id]);

  const handleRate = async (stars) => {
    await onRate(stars);
    fetchAverage();
  };

  return (
    <div
      className="p-5 rounded-3xl mb-4 relative"
      style={{
        background: PALETTE.paper,
        border: `1px solid ${PALETTE.border}`,
        animation: `fadeUp 500ms ${delay}ms ease-out both`,
      }}
    >
      <div
        className="absolute top-3 right-5 select-none"
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 56,
          fontStyle: "italic",
          color: PALETTE.accentSoft,
          lineHeight: 1,
          fontWeight: 300,
        }}
      >
        "
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] overflow-hidden"
          style={{
            background: PALETTE.greenSoft,
            color: PALETTE.green,
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
          }}
        >
          {response.author?.avatarUrl
            ? <img src={response.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            : response.author?.initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: PALETTE.ink }}>
              {response.author?.name}
            </span>
            <span
              className="text-[8.5px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium"
              style={{
                background: PALETTE.green,
                color: PALETTE.paper,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Local
            </span>
          </div>
          <div className="text-[11px]" style={{ color: PALETTE.inkSoft }}>
            in {response.author?.from} · {response.posted}
          </div>
        </div>
      </div>

      <p className="text-[14px] leading-relaxed mb-4" style={{ color: PALETTE.ink }}>
        {response.body}
      </p>

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: `1px dashed ${PALETTE.border}` }}
      >
        <div className="flex flex-col gap-1.5">
          {canRate && (
            <StarRating
              value={response.rating}
              average={avgRating}
              onChange={handleRate}
            />
          )}

          {!isPostOwner && response.rating > 0 && (
            <div
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span style={{ color: PALETTE.inkFaint }}>
                {postAuthor?.name?.split(" ")[0]} rated
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={12}
                    strokeWidth={1.5}
                    fill={response.rating >= n ? PALETTE.gold : "transparent"}
                    style={{ color: response.rating >= n ? PALETTE.gold : PALETTE.inkFaint }}
                  />
                ))}
              </div>
              <span style={{ color: PALETTE.gold, fontWeight: 500 }}>
                {response.rating}.0
              </span>
            </div>
          )}

          {!isPostOwner && response.rating === 0 && (
            <>
              {avgRating > 0 ? (
                <div
                  className="flex items-center gap-1 text-[10.5px]"
                  style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: PALETTE.accentSoft, color: PALETTE.gold }}
                  >
                    ★ {avgRating.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div
                  className="text-[11px]"
                  style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic" }}
                >
                  Not rated yet
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {response.tipped && (
            <span
              className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
              style={{
                background: PALETTE.accentSoft,
                color: PALETTE.accentDeep,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
              }}
            >
              <Heart size={9} strokeWidth={2} fill={PALETTE.accentDeep} />
              ${response.tipAmount} tipped
            </span>
          )}
          {isMyPost && (
            <button
              onClick={onTip}
              className="text-[11.5px] px-3 py-1.5 rounded-full flex items-center gap-1 font-medium active:scale-95 transition"
              style={{ background: PALETTE.ink, color: PALETTE.paper }}
            >
              <Coffee size={11} strokeWidth={2} />
              {response.tipped ? "Tip again" : "Send a tip"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
