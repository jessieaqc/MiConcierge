import React from "react";
import { MessageCircle, Star } from "lucide-react";
import { PALETTE } from "../lib/constants";
import TopBar from "../components/TopBar";
import EmptyNote from "../components/EmptyNote";

export default function Notifications({ user, myPosts, myAnswers, onBack, onOpen }) {
  const notifs = [];

  if (user.role === "tourist") {
    for (const p of myPosts) {
      for (const r of p.responses || []) {
        notifs.push({
          id: `r-${r.id}`,
          type: "answer",
          postId: p.id, 
          title: p.title,
          from: r.author?.name || "A local",
          body: r.body,
          posted: r.posted,
        });
      }
    }
  } else {
    for (const a of myAnswers) {
      if (a.rating > 0) {
        notifs.push({
          id: `rating-${a.id}`,
          type: "rating",
          postId: a.post?.id,
          title: a.post?.title || "Your answer",
          from: a.post?.author?.name || "A traveler",
          rating: a.rating,
          body: a.body,
          posted: a.posted,
        });
      }
    }
  }

  notifs.reverse();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Notifications" />
      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {notifs.length === 0 ? (
          <div className="mt-8">
            <EmptyNote text={
              user.role === "tourist"
                ? "No notifications yet. Post a question and locals will answer."
                : "No notifications yet. You'll see ratings here once travelers rate your answers."
            } />
          </div>
        ) : (
          <>
            <div className="text-[9.5px] uppercase tracking-[0.22em] mb-4 mt-2" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              {notifs.length} {notifs.length === 1 ? "notification" : "notifications"}
            </div>
            {notifs.map((n, i) => (
              <div
                key={n.id}
                onClick={() => n.postId && onOpen(n.postId)}
                className="p-4 rounded-2xl mb-3 cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, animation: `fadeUp 400ms ${i * 60}ms ease-out both` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: n.type === "answer" ? PALETTE.greenSoft : PALETTE.accentSoft }}
                  >
                    {n.type === "answer"
                      ? <MessageCircle size={15} strokeWidth={1.8} style={{ color: PALETTE.green }} />
                      : <Star size={15} strokeWidth={1.8} fill={PALETTE.gold} style={{ color: PALETTE.gold }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[12.5px] font-medium truncate" style={{ color: PALETTE.ink }}>{n.from}</span>
                      <span className="text-[10px] shrink-0" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>{n.posted}</span>
                    </div>
                    <div className="text-[11.5px] mb-1" style={{ color: PALETTE.inkSoft }}>
                      {n.type === "answer"
                        ? <>answered your question about <span style={{ color: PALETTE.ink, fontStyle: "italic" }}>"{n.title}"</span></>
                        : <>rated your answer on <span style={{ color: PALETTE.ink, fontStyle: "italic" }}>"{n.title}"</span></>
                      }
                    </div>
                    {n.type === "rating" ? (
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} strokeWidth={1.5}
                            fill={n.rating >= s ? PALETTE.gold : "transparent"}
                            style={{ color: n.rating >= s ? PALETTE.gold : PALETTE.inkFaint }}
                          />
                        ))}
                        <span className="text-[10.5px] ml-1 font-medium" style={{ color: PALETTE.gold, fontFamily: "'JetBrains Mono', monospace" }}>
                          {n.rating}.0
                        </span>
                      </div>
                    ) : (
                      <div className="text-[12px] mt-1 line-clamp-2" style={{ color: PALETTE.ink, fontStyle: "italic" }}>
                        "{n.body}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
