import React, { useState, useEffect } from "react";
import { MapPin, MoreHorizontal, Sparkles, Trash2, Send, Loader2 } from "lucide-react";
import { PALETTE, catIcon } from "../lib/constants";
import { api } from "../lib/api";
import { mapResponse } from "../lib/helpers";
import TopBar from "../components/TopBar";
import ResponseCard from "../components/ResponseCard";

export default function PostDetail({ post, me, onBack, onRate, onTip, onReply, onUpdatePost, onOpenEdit, onDeletePost }) {
  const Icon = catIcon(post.category);
  const [reply, setReply] = useState("");
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [localPost, setLocalPost] = useState(post);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyPost = me?.id === post.author_id;

  useEffect(() => {
    setLoadingResponses(true);
    api
      .get(`/responses/${post.id}`)
      .then(async (data) => {
        const mapped = (data || []).map(mapResponse);

        const withRatings = await Promise.all(
          mapped.map(async (r) => {
            let myScore = 0;
            let ownerScore = 0;

            try {
              const mine = await api.get(`/ratings/${r.id}/mine`);
              myScore = mine?.score ?? 0;
            } catch {}

            try {
              const ownerRating = await api.get(`/ratings/${r.id}/by-post-author`);
              ownerScore = ownerRating?.score ?? 0;
            } catch {}

            return { ...r, rating: myScore || ownerScore };
          })
        );

        const updated = { ...post, responses: withRatings };
        setLocalPost(updated);
        onUpdatePost(updated);
      })
      .catch(() => {})
      .finally(() => setLoadingResponses(false));
  }, [post.id]);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    await onReply(reply.trim());
    setReply("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Dispatch" />

      <div className="flex-1 overflow-y-auto px-6 pb-40">
        <div className="p-5 rounded-3xl mb-5" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.8} style={{ color: PALETTE.accent }} />
              <span className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                {localPost.destination}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider" style={{ background: PALETTE.paperAlt, color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              <Icon size={11} strokeWidth={1.7} />
              {localPost.category}
            </div>
          </div>

          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.025em", color: PALETTE.ink, marginBottom: 12 }}>
            {localPost.title}
          </h2>
          <p className="text-[14.5px] leading-relaxed" style={{ color: PALETTE.ink }}>{localPost.body}</p>

          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] overflow-hidden"
                style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep, fontFamily: "'Fraunces', serif", fontWeight: 600 }}
              >
                {localPost.author?.avatarUrl
                  ? <img src={localPost.author.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : localPost.author?.initials}
              </div>
              <div className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
                <span style={{ color: PALETTE.ink, fontWeight: 500 }}>{localPost.author?.name}</span>
                {" · "}from {localPost.author?.from}
                {" · "}{localPost.posted}
              </div>
            </div>
            {isMyPost && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition"
                  style={{ background: PALETTE.paperAlt, border: `1px solid ${PALETTE.border}` }}
                >
                  <MoreHorizontal size={15} strokeWidth={1.8} style={{ color: PALETTE.ink }} />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div
                      className="absolute right-0 top-10 z-50 rounded-2xl overflow-hidden min-w-[140px]"
                      style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                    >
                      <button
                        onClick={() => { setShowMenu(false); onOpenEdit(); }}
                        className="w-full px-4 py-3 text-left text-[13px] flex items-center gap-2 active:opacity-70"
                        style={{ color: PALETTE.ink, borderBottom: `1px solid ${PALETTE.border}` }}
                      >
                        <Sparkles size={13} strokeWidth={1.7} />
                        Edit post
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                        className="w-full px-4 py-3 text-left text-[13px] flex items-center gap-2 active:opacity-70"
                        style={{ color: PALETTE.accent }}
                      >
                        <Trash2 size={13} strokeWidth={1.7} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8" style={{ background: "rgba(26,19,12,0.5)" }}>
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em", color: PALETTE.ink, marginBottom: 8 }}>
                Delete this post?
              </h3>
              <p className="text-[13px] mb-6" style={{ color: PALETTE.inkSoft }}>
                All responses will be lost too. This can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3.5 rounded-full text-[14px] font-medium"
                  style={{ background: PALETTE.paperAlt, color: PALETTE.ink, border: `1px solid ${PALETTE.border}` }}
                >
                  Cancel
                </button>
                <button
                  onClick={onDeletePost}
                  className="flex-1 py-3.5 rounded-full text-[14px] font-medium"
                  style={{ background: PALETTE.accent, color: "#fff" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase" }}>
              From locals
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, color: PALETTE.ink, lineHeight: 1.1 }}>
              <span style={{ fontStyle: "italic" }}>{localPost.responses.length}</span>{" "}
              {localPost.responses.length === 1 ? "answer" : "answers"}
            </div>
          </div>
          {loadingResponses && (
            <Loader2 size={16} strokeWidth={1.5} style={{ color: PALETTE.inkSoft, animation: "spin 900ms linear infinite" }} />
          )}
        </div>

        {!loadingResponses && localPost.responses.length === 0 && (
          <div className="rounded-3xl p-6 text-center" style={{ background: PALETTE.paper, border: `1px dashed ${PALETTE.border}` }}>
            <div className="text-[14px] mb-1" style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", color: PALETTE.ink }}>
              No one's answered yet.
            </div>
            <div className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
              {me?.role === "local" ? "You could be the first." : "Hang tight — locals are checking in."}
            </div>
          </div>
        )}

        {localPost.responses.map((r, i) => (
          <ResponseCard
            key={r.id}
            response={r}
            me={me}
            postAuthor={localPost.author}
            isMyPost={isMyPost}
            onRate={(stars) => onRate(r.id, stars)}
            onTip={() => onTip(r)}
            delay={i * 80}
          />
        ))}
      </div>

      {me?.role === "local" && !isMyPost && (
        <div
          className="absolute bottom-20 left-0 right-0 px-4 py-3"
          style={{ background: `linear-gradient(to top, ${PALETTE.bg} 60%, transparent)` }}
        >
          <div
            className="flex items-end gap-2 px-3 py-2 rounded-3xl"
            style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Answer like you'd answer a friend…"
              rows={1}
              className="flex-1 bg-transparent text-[13.5px] outline-none resize-none py-2"
              style={{ color: PALETTE.ink, maxHeight: 90 }}
            />
            <button
              onClick={handleReply}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
              style={{ background: PALETTE.accent, color: "#fff" }}
            >
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
