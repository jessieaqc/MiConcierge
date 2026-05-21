import React, { useState, useEffect } from "react";
import { Globe, MapPin, Star, Heart } from "lucide-react";
import { PALETTE } from "../lib/constants";
import { api } from "../lib/api";
import { mapPost, mapResponse } from "../lib/helpers";
import TopBar from "../components/TopBar";
import Stat from "../components/Stat";
import SectionHeader from "../components/SectionHeader";
import SettingRow from "../components/SettingRow";
import EmptyNote from "../components/EmptyNote";
import SkeletonCard from "../components/SkeletonCard";
import EditProfile from "./EditProfile";
import Notifications from "./Notifications";
import HelpAndGuidelines from "./HelpAndGuidelines";

export default function Profile({ user, posts, onBack, onOpen, onUpdateUser, onSignOut, initialSubscreen = null }) {
  const [avgRating, setAvgRating] = useState("—");
  const [myGivenRatings, setMyGivenRatings] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myAnswers, setMyAnswers] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [subscreen, setSubscreen] = useState(initialSubscreen);

  useEffect(() => {
    setSubscreen(initialSubscreen);
  }, [initialSubscreen]);

  const tipsEarned = myAnswers.reduce((s, a) => s + (a.tipAmount || 0), 0);

  useEffect(() => {
    api
      .get("/posts/")
      .then(async (data) => {
        const allPosts = (data || []).map(mapPost);

        if (user.role === "local") {
          const postsWithResponses = await Promise.all(
            allPosts.map(async (p) => {
              try {
                const responses = await api.get(`/responses/${p.id}`);
                return { ...p, responses: (responses || []).map(mapResponse) };
              } catch {
                return p;
              }
            })
          );

          const answers = postsWithResponses.flatMap((p) =>
            p.responses
              .filter((r) => r.author_id === user.id)
              .map((r) => ({ ...r, post: p }))
          );

          const answersWithRatings = await Promise.all(
            answers.map(async (a) => {
              try {
                const data = await api.get(`/ratings/${a.id}/average`);
                return { ...a, rating: data?.average ?? 0 };
              } catch {
                return a;
              }
            })
          );
          setMyAnswers(answersWithRatings);

          const rated = answersWithRatings.filter((a) => a.rating > 0);
          if (rated.length > 0) {
            const total = rated.reduce((s, a) => s + a.rating, 0);
            setAvgRating((total / rated.length).toFixed(1));
          }
        } else {
          const ownPosts = allPosts.filter((p) => p.author_id === user.id);
          const withResponses = await Promise.all(
            ownPosts.map(async (p) => {
              try {
                const responses = await api.get(`/responses/${p.id}`);
                return { ...p, responses: (responses || []).map(mapResponse) };
              } catch {
                return p;
              }
            })
          );
          setMyPosts(withResponses);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  useEffect(() => {
    if (user.role !== "tourist") return;

    api
      .get("/ratings/given/me")
      .then((data) => setMyGivenRatings(data || []))
      .catch(() => {});
  }, []);

  const satisfactionAvg = myGivenRatings.length
    ? (myGivenRatings.reduce((s, r) => s + r.score, 0) / myGivenRatings.length).toFixed(1)
    : "—";

  if (!user) return null;

  if (subscreen === "edit") {
    return (
      <EditProfile
        user={user}
        onBack={() => setSubscreen(null)}
        onSave={(updated) => { onUpdateUser(updated); setSubscreen(null); }}
      />
    );
  }

  if (subscreen === "notifications") {
    return (
      <Notifications
        user={user}
        myPosts={myPosts}
        myAnswers={myAnswers}
        onBack={() => setSubscreen(null)}
        onOpen={onOpen}
      />
    );
  }

  if (subscreen === "help") {
    return <HelpAndGuidelines onBack={() => setSubscreen(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Passport" />
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="relative mb-6 mt-2">
          <div
            className="absolute -top-2 -right-2 px-2 py-1 rounded-sm rotate-6"
            style={{ background: PALETTE.accent, color: PALETTE.paper, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em" }}
          >
            {user.role.toUpperCase()}
          </div>
          <div className="rounded-3xl p-6" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] overflow-hidden"
                style={{ background: PALETTE.ink, color: PALETTE.paper, fontFamily: "'Fraunces', serif", fontWeight: 500 }}
              >
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  : user.initials}
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.02em", color: PALETTE.ink }}>
                  {user.name}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: PALETTE.inkSoft }}>
                  <Globe size={10} strokeWidth={1.8} className="inline mr-1 -mt-0.5" />
                  {user.from} · joined {user.joined}
                </div>
              </div>
            </div>

            <div className="pt-4" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
              {user.role === "local" ? (
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Answers" value={myAnswers.length} />
                  <Stat label="Avg. rating" value={avgRating} />
                  <Stat label="Earned" value={`$${tipsEarned}`} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Questions" value={myPosts.length} />
                  <Stat label="Rated" value={myGivenRatings.length} />
                  <Stat
                    label="Satisfaction"
                    value={satisfactionAvg === "—" ? "—" : `★ ${satisfactionAvg}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <SectionHeader title={user.role === "local" ? "Your answers" : "Your questions"} />

        {user.role === "local" ? (
          myAnswers.length === 0 ? (
            <EmptyNote text="No answers yet. Open the feed and help someone out." />
          ) : (
            myAnswers.map((a) => (
              <div key={a.id} onClick={() => onOpen(a.post.id)} className="p-4 rounded-2xl mb-3 cursor-pointer active:scale-[0.98] transition-transform" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
                <div className="text-[10.5px] uppercase tracking-[0.2em] mb-1" style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                  <MapPin size={10} className="inline mr-1 -mt-0.5" strokeWidth={1.8} />
                  {a.post.destination}
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: PALETTE.ink, fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                  {a.post.title}
                </div>
                <p className="text-[12.5px] mt-1 line-clamp-2" style={{ color: PALETTE.inkSoft, fontStyle: "italic" }}>
                  "{a.body}"
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  {a.rating > 0 ? (
                    <div
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span style={{ color: PALETTE.inkFaint }}>
                        {a.post.author?.name?.split(" ")[0]} rated
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            strokeWidth={1.5}
                            fill={a.rating >= n ? PALETTE.gold : "transparent"}
                            style={{ color: a.rating >= n ? PALETTE.gold : PALETTE.inkFaint }}
                          />
                        ))}
                      </div>
                      <span style={{ color: PALETTE.gold, fontWeight: 500 }}>
                        {a.rating}.0
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
                  {a.tipped && (
                    <span className="text-[10px] flex items-center gap-1" style={{ color: PALETTE.accentDeep, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                      <Heart size={9} fill={PALETTE.accentDeep} strokeWidth={2} />${a.tipAmount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        ) : loadingPosts ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : myPosts.length === 0 ? (
          <EmptyNote text="No questions yet. Ask one — a local is waiting." />
        ) : (
          myPosts.map((p) => (
            <div key={p.id} onClick={() => onOpen(p.id)} className="p-4 rounded-2xl mb-3 cursor-pointer active:scale-[0.98] transition-transform" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
              <div className="text-[10.5px] uppercase tracking-[0.2em] mb-1" style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                {p.destination}
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: PALETTE.ink, letterSpacing: "-0.015em" }}>
                {p.title}
              </div>
              <div className="text-[11.5px] mt-1.5" style={{ color: PALETTE.inkSoft }}>
                {p.responses.length} {p.responses.length === 1 ? "answer" : "answers"} · {p.posted}
              </div>
            </div>
          ))
        )}

        <SectionHeader title="Settings" />
        <SettingRow label="Edit profile" onClick={() => setSubscreen("edit")} />
        <SettingRow label="Notifications" onClick={() => setSubscreen("notifications")} />
        <SettingRow label="Help & community guidelines" onClick={() => setSubscreen("help")} />
        <button
          onClick={onSignOut}
          className="w-full py-3 mt-4 text-[13px] rounded-full"
          style={{ color: PALETTE.accent, border: `1px solid ${PALETTE.border}`, background: PALETTE.paper }}
        >
          Sign out
        </button>
        <div className="text-center mt-8 text-[10px] tracking-[0.25em] uppercase" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
          mi concierge · made for wanderers
        </div>
      </div>
    </div>
  );
}
