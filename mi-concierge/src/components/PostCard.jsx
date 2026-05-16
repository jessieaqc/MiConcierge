import React from "react";
import { MapPin, MessageCircle, ChevronRight } from "lucide-react";
import { PALETTE, catIcon } from "../lib/constants";

export default function PostCard({ post, onClick, delay = 0 }) {
  const Icon = catIcon(post.category);
  const hasAnswer = post.responses.length > 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left mb-4 p-5 rounded-3xl transition-all active:scale-[0.99] hover:shadow-sm"
      style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, animation: `fadeUp 500ms ${delay}ms ease-out both` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] overflow-hidden"
            style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep, fontFamily: "'Fraunces', serif", fontWeight: 600 }}
          >
            {post.author?.avatarUrl
              ? <img src={post.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : post.author?.initials}
          </div>
          <div>
            <div className="text-[12.5px] font-medium leading-tight" style={{ color: PALETTE.ink }}>{post.author?.name}</div>
            <div className="text-[10.5px]" style={{ color: PALETTE.inkSoft }}>from {post.author?.from} · {post.posted}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
          style={{ background: PALETTE.paperAlt, color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          <Icon size={11} strokeWidth={1.7} />
          <span className="uppercase tracking-wider">{post.category}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-1.5">
        <MapPin size={11} strokeWidth={1.8} style={{ color: PALETTE.accent }} />
        <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}>
          {post.destination}
        </span>
      </div>

      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 400, lineHeight: 1.15, letterSpacing: "-0.018em", color: PALETTE.ink, marginBottom: 8 }}>
        {post.title}
      </h3>
      <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: PALETTE.inkSoft }}>{post.body}</p>

      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: hasAnswer ? PALETTE.green : PALETTE.inkSoft }}>
          <MessageCircle size={13} strokeWidth={1.7} />
          <span className="font-medium">
            {post.responses.length === 0 ? "Awaiting a local" : `${post.responses.length} ${post.responses.length === 1 ? "answer" : "answers"}`}
          </span>
        </div>
        <ChevronRight size={15} strokeWidth={1.7} style={{ color: PALETTE.ink }} />
      </div>
    </button>
  );
}
