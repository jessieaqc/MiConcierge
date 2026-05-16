import React, { useState, useEffect } from "react";
import { Search, AlertCircle } from "lucide-react";
import { PALETTE, CATEGORIES } from "../lib/constants";
import { api } from "../lib/api";
import { mapPost } from "../lib/helpers";
import SkeletonCard from "../components/SkeletonCard";
import CatChip from "../components/CatChip";
import PostCard from "../components/PostCard";

export default function Feed({ user, posts, setPosts, onOpen, onCreate, onProfile }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCat !== "all") params.set("category", activeCat);
      if (query.trim()) params.set("city", query.trim());
      const data = await api.get(`/posts/?${params.toString()}`);
      setPosts((data || []).map(mapPost));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  useEffect(() => {
    const t = setTimeout(fetchPosts, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase" }}>
              The Wire · Live
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: 30, lineHeight: 1, letterSpacing: "-0.02em", color: PALETTE.ink, marginTop: 4 }}>
              Good morning,{" "}
              <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                {user?.name?.split(" ")[0] || "friend"}.
              </span>
            </h1>
          </div>
          <button
            onClick={onProfile}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-medium transition-transform active:scale-95 overflow-hidden"
            style={{ background: PALETTE.ink, color: PALETTE.paper, fontFamily: "'Fraunces', serif" }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : user?.initials || "U"}
          </button>
        </div>

        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-full mb-4"
          style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
        >
          <Search size={15} strokeWidth={1.6} style={{ color: PALETTE.inkSoft }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a city, a craving, a vibe…"
            className="bg-transparent text-[13.5px] outline-none flex-1 placeholder:text-[#A4927A]"
            style={{ color: PALETTE.ink }}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 no-scrollbar">
          <CatChip label="All" active={activeCat === "all"} onClick={() => setActiveCat("all")} />
          {CATEGORIES.map((c) => (
            <CatChip key={c.id} label={c.label} Icon={c.Icon} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {error && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl mb-4 text-[13px]"
            style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep }}>
            <span className="flex items-center gap-2"><AlertCircle size={14} />{error}</span>
            <button onClick={fetchPosts} className="underline text-[12px]">Retry</button>
          </div>
        )}

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-16 text-[14px]" style={{ color: PALETTE.inkSoft, fontStyle: "italic", fontFamily: "'Fraunces', serif" }}>
            {user?.role === "local" ? "Nothing here yet." : "Nothing here yet. Be the first to ask."}
          </div>
        )}

        {!loading && posts.map((p, i) => (
          <PostCard key={p.id} post={p} onClick={() => onOpen(p.id)} delay={i * 60} />
        ))}

        {!loading && posts.length > 0 && (
          <div className="text-center mt-8 mb-4 text-[10px] tracking-[0.25em] uppercase" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
            — end of dispatch —
          </div>
        )}
      </div>
    </div>
  );
}
