import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Home,
  User,
  Star,
  MapPin,
  MessageCircle,
  X,
  Check,
  Send,
  ChevronRight,
  Trash2,
  Coffee,
  Utensils,
  Camera,
  Music,
  ShoppingBag,
  Compass,
  Sparkles,
  Search,
  Globe,
  Heart,
  Shield,
} from "lucide-react";

/* ============================================================
   Mi Concierge — Tourist ⇄ Local concierge mobile app
   Warm editorial aesthetic: terracotta, cream, Fraunces italic
============================================================ */

const PALETTE = {
  bg: "#F2EAD9",
  paper: "#FBF6EA",
  paperAlt: "#EFE4CE",
  ink: "#1A130C",
  inkSoft: "#73604A",
  inkFaint: "#A4927A",
  border: "#DBCEB3",
  accent: "#B83A13",
  accentDeep: "#7C2509",
  accentSoft: "#F3D5BC",
  green: "#3D5C3A",
  greenSoft: "#D6DFCC",
  gold: "#C8932B",
};

const CATEGORIES = [
  { id: "food", label: "Food", Icon: Utensils },
  { id: "nightlife", label: "Nightlife", Icon: Music },
  { id: "sights", label: "Sights", Icon: Camera },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag },
  { id: "transport", label: "Transport", Icon: Compass },
  { id: "hidden", label: "Hidden", Icon: Sparkles },
];

const catIcon = (id) =>
  (CATEGORIES.find((c) => c.id === id) || CATEGORIES[5]).Icon;

/* --------- Seed Data --------- */
const seedPosts = [
  {
    id: "p1",
    author: { name: "Lena Hoffmann", initials: "LH", role: "tourist", from: "Berlin" },
    destination: "Lisbon, PT",
    category: "food",
    title: "Where do Lisboetas actually eat seafood?",
    body: "Tired of tourist menus near Cais do Sodré. I want the place where the fishermen go for lunch — petiscos, vinho verde, no English menu, plastic chairs encouraged.",
    posted: "2h",
    responses: [
      {
        id: "r1",
        author: { name: "Tiago Marques", initials: "TM", role: "local", from: "Lisbon" },
        body: "Skip Ramiro on the weekend — it's a queue. Take the ferry from Cais do Sodré to Cacilhas and walk five minutes to Ponto Final. Order arroz de marisco for two, share. Cash only. Tell them Tiago sent you and ask about the catch of the day.",
        posted: "1h",
        rating: 5,
        tipped: true,
        tipAmount: 8,
      },
      {
        id: "r2",
        author: { name: "Beatriz S.", initials: "BS", role: "local", from: "Almada" },
        body: "Cervejaria O Pinóquio in Praça dos Restauradores — looks touristy but the locals fill it by 1pm. Get the percebes if they have them.",
        posted: "45m",
        rating: 0,
        tipped: false,
        tipAmount: 0,
      },
    ],
  },
  {
    id: "p2",
    author: { name: "Marco Renaldi", initials: "MR", role: "tourist", from: "Milan" },
    destination: "Kyoto, JP",
    category: "hidden",
    title: "A temple that isn't on Google's first page",
    body: "I have three days. I've done Fushimi Inari at sunrise. Looking for somewhere quieter — moss gardens, a place where I can sit and not see a selfie stick.",
    posted: "6h",
    responses: [
      {
        id: "r3",
        author: { name: "Yuki Tanaka", initials: "YT", role: "local", from: "Kyoto" },
        body: "Saihō-ji (the Moss Temple) — but you must apply by postcard 2 weeks ahead. Easier alternative: Enkō-ji in northern Higashiyama. Tiny, hand-raked garden, maybe four other visitors on a Tuesday. Go at 4pm for the light.",
        posted: "4h",
        rating: 5,
        tipped: false,
        tipAmount: 0,
      },
    ],
  },
  {
    id: "p3",
    author: { name: "Amara Okafor", initials: "AO", role: "tourist", from: "London" },
    destination: "Mexico City, MX",
    category: "nightlife",
    title: "Mezcal bar that isn't full of expats",
    body: "Polanco and Roma Norte feel like a different city. Want somewhere with a record player, no English menu, and ideally a bartender who'll tell me what to drink.",
    posted: "1d",
    responses: [],
  },
  {
    id: "p4",
    author: { name: "Sofia Reyes", initials: "SR", role: "tourist", from: "Barcelona" },
    destination: "Marrakech, MA",
    category: "shopping",
    title: "Rugs without the markup",
    body: "The medina is overwhelming. I'd rather pay a fair price than 'haggle' down from triple. Where do interior designers actually buy from?",
    posted: "2d",
    responses: [
      {
        id: "r4",
        author: { name: "Hicham El Idrissi", initials: "HE", role: "local", from: "Marrakech" },
        body: "Skip the souk entirely. Go to Sidi Ghanem (the industrial zone) — Chabi Chic and Maison ARTC have showrooms with marked prices. For vintage Beni Ourain, ask for Mustapha at the rug coop in Tameslouht, 30 min south. He'll show you the pile from the back.",
        posted: "1d",
        rating: 4,
        tipped: true,
        tipAmount: 15,
      },
    ],
  },
];

const seedMe = {
  id: "u_me",
  name: "Your Name",
  initials: "YN",
  role: "tourist",
  from: "—",
  bio: "Just landed.",
  joined: "May 2026",
};

/* ============================================================ */

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [posts, setPosts] = useState(seedPosts);
  const [activePostId, setActivePostId] = useState(null);
  const [tipCtx, setTipCtx] = useState(null);
  const [toast, setToast] = useState(null);

  const goTo = (s) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
  };
  const goBack = () => {
    setHistory((h) => {
      const next = [...h];
      const last = next.pop();
      setScreen(last || "feed");
      return next;
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAuth = (data) => {
    setUser({ ...seedMe, ...data });
    setScreen("feed");
    setHistory([]);
  };

  const handleNewPost = (post) => {
    const newPost = {
      id: "p" + Date.now(),
      author: { name: user.name, initials: user.initials, role: "tourist", from: user.from },
      ...post,
      posted: "just now",
      responses: [],
    };
    setPosts((p) => [newPost, ...p]);
    setScreen("feed");
    setHistory([]);
    showToast("Posted. Locals will see it shortly.");
  };

  const handleNewResponse = (postId, body) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id === postId
          ? {
              ...p,
              responses: [
                ...p.responses,
                {
                  id: "r" + Date.now(),
                  author: { name: user.name, initials: user.initials, role: "local", from: user.from },
                  body,
                  posted: "just now",
                  rating: 0,
                  tipped: false,
                  tipAmount: 0,
                },
              ],
            }
          : p
      )
    );
    showToast("Reply sent.");
  };

  const handleRate = (postId, responseId, stars) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              responses: p.responses.map((r) =>
                r.id === responseId ? { ...r, rating: stars } : r
              ),
            }
      )
    );
  };

  const handleTipComplete = (postId, responseId, amount) => {
    setPosts((ps) =>
      ps.map((p) =>
        p.id !== postId
          ? p
          : {
              ...p,
              responses: p.responses.map((r) =>
                r.id === responseId
                  ? { ...r, tipped: true, tipAmount: (r.tipAmount || 0) + amount }
                  : r
              ),
            }
      )
    );
    setTipCtx(null);
    showToast(`Tipped $${amount}. ${responseId ? "They'll feel it." : ""}`);
  };

  const activePost = posts.find((p) => p.id === activePostId);

  return (
    <>
      <FontStyles />
      <div
        className="min-h-screen w-full flex items-center justify-center p-0 sm:p-6"
        style={{
          background:
            "radial-gradient(ellipse at top, #E8DCC0 0%, #C9B997 60%, #A89472 100%)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div
          className="relative w-full sm:max-w-[420px] sm:rounded-[44px] sm:shadow-2xl overflow-hidden flex flex-col"
          style={{
            background: PALETTE.bg,
            color: PALETTE.ink,
            height: "100vh",
            maxHeight: "100vh",
            minHeight: "100vh",
          }}
        >
          {/* Optional desktop notch */}
          <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 items-end justify-center pb-1">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>

          {/* Grain overlay */}
          <Grain />

          <div className="relative flex-1 overflow-hidden flex flex-col">
            {screen === "welcome" && <Welcome onStart={() => setScreen("auth")} />}
            {screen === "auth" && <Auth onAuth={handleAuth} />}
            {screen === "feed" && (
              <Feed
                user={user}
                posts={posts}
                onOpen={(id) => {
                  setActivePostId(id);
                  goTo("post");
                }}
                onCreate={() => goTo("new")}
                onProfile={() => goTo("profile")}
              />
            )}
            {screen === "post" && activePost && (
              <PostDetail
                post={activePost}
                me={user}
                onBack={goBack}
                onRate={(rid, stars) => handleRate(activePost.id, rid, stars)}
                onTip={(resp) => setTipCtx({ post: activePost, response: resp })}
                onReply={(body) => handleNewResponse(activePost.id, body)}
              />
            )}
            {screen === "new" && <NewPost onBack={goBack} onSubmit={handleNewPost} />}
            {screen === "profile" && (
              <Profile user={user} posts={posts} onBack={goBack} onSignOut={() => { setUser(null); setScreen("welcome"); setHistory([]); }} />
            )}
          </div>

          {/* Tab bar */}
          {user && ["feed", "post", "profile"].includes(screen) && (
            <TabBar
              screen={screen}
              onHome={() => {
                setScreen("feed");
                setHistory([]);
              }}
              onCreate={() => goTo("new")}
              onProfile={() => {
                if (screen !== "profile") goTo("profile");
              }}
            />
          )}

          {/* Tip overlay */}
          {tipCtx && (
            <TipFlow
              ctx={tipCtx}
              onClose={() => setTipCtx(null)}
              onComplete={(amt) =>
                handleTipComplete(tipCtx.post.id, tipCtx.response.id, amt)
              }
            />
          )}

          {/* Toast */}
          {toast && (
            <div
              className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium z-50 flex items-center gap-2"
              style={{
                background: PALETTE.ink,
                color: PALETTE.paper,
                fontFamily: "'DM Sans', sans-serif",
                animation: "toastIn 240ms cubic-bezier(.2,.9,.3,1.2)",
              }}
            >
              <Check size={14} />
              {toast}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   WELCOME
============================================================ */
function Welcome({ onStart }) {
  return (
    <div className="flex-1 flex flex-col px-7 pt-16 pb-10 relative overflow-hidden">
      {/* decorative postage corner */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-1 opacity-80">
        <div
          className="px-2 py-0.5 text-[9px] tracking-[0.2em] uppercase font-medium"
          style={{
            border: `1px solid ${PALETTE.ink}`,
            color: PALETTE.ink,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          v.01 · 2026
        </div>
        <div
          className="text-[9px] tracking-[0.2em] uppercase"
          style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          est. nowhere
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-auto" style={{ animation: "fadeUp 600ms ease-out" }}>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 42,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            color: PALETTE.ink,
            lineHeight: 1,
          }}
        >
          mi
        </span>
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 500,
            fontSize: 42,
            letterSpacing: "-0.02em",
            color: PALETTE.accent,
            lineHeight: 1,
          }}
        >
          concierge
        </span>
      </div>

      <div className="mb-auto" style={{ animation: "fadeUp 700ms 100ms ease-out both" }}>
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 300,
            fontSize: 54,
            lineHeight: 0.95,
            letterSpacing: "-0.035em",
            color: PALETTE.ink,
          }}
        >
          Local guides,
          <br />
          <span style={{ fontStyle: "italic", color: PALETTE.accentDeep }}>
            unforgettable
          </span>{" "}
          experiences.
        </h1>
        <p
          className="mt-6 text-[15px] leading-relaxed max-w-[300px]"
          style={{ color: PALETTE.inkSoft }}
        >
          Ask a question about a city. Someone who lives there will answer — the way they'd answer a friend.
        </p>
      </div>

      <div className="flex flex-col gap-3" style={{ animation: "fadeUp 800ms 200ms ease-out both" }}>
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
          <span
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
          >
            No bots · Real people
          </span>
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-full text-[15px] font-medium transition-all active:scale-[0.98]"
          style={{
            background: PALETTE.ink,
            color: PALETTE.paper,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          Begin
        </button>
        <button
          className="text-[13px] py-2"
          style={{ color: PALETTE.inkSoft, fontFamily: "'DM Sans', sans-serif" }}
        >
          I've been here before · Sign in
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   AUTH
============================================================ */
function Auth({ onAuth }) {
  const [mode, setMode] = useState("register"); // register | login
  const [role, setRole] = useState("tourist");
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [email, setEmail] = useState("");

  const initials = (name || "You").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "Y";

  const submit = () => {
    onAuth({
      name: name || "Traveler",
      from: from || "Somewhere",
      role,
      initials,
    });
  };

  return (
    <div className="flex-1 flex flex-col px-7 pt-14 pb-8 overflow-y-auto">
      <div className="mb-8">
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.25em",
            color: PALETTE.inkSoft,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {mode === "register" ? "First time?" : "Welcome back"}
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 400,
            fontSize: 36,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: PALETTE.ink,
          }}
        >
          Tell us {" "}
          <span style={{ fontStyle: "italic", color: PALETTE.accent }}>who you are</span>.
        </h2>
      </div>

      {mode === "register" && (
        <>
          <Label>I'm here as a</Label>
          <div className="flex gap-2 mb-6">
            <RoleCard
              active={role === "tourist"}
              onClick={() => setRole("tourist")}
              title="Traveler"
              sub="I have questions"
              Icon={Compass}
            />
            <RoleCard
              active={role === "local"}
              onClick={() => setRole("local")}
              title="Local"
              sub="I have answers"
              Icon={MapPin}
            />
          </div>

          <Label>Name</Label>
          <Input value={name} onChange={setName} placeholder="What should we call you?" />
          <Label>{role === "local" ? "Where you live" : "Where you're from"}</Label>
          <Input value={from} onChange={setFrom} placeholder={role === "local" ? "e.g. Lisbon" : "e.g. Berlin"} />
        </>
      )}

      <Label>Email</Label>
      <Input value={email} onChange={setEmail} placeholder="hello@somewhere.com" />

      <Label>Password</Label>
      <Input type="password" placeholder="••••••••" />

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button
          onClick={submit}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition-all"
          style={{ background: PALETTE.ink, color: PALETTE.paper }}
        >
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
        <button
          onClick={() => setMode(mode === "register" ? "login" : "register")}
          className="text-[13px] py-1"
          style={{ color: PALETTE.inkSoft }}
        >
          {mode === "register" ? "Already a member? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, title, sub, Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        background: active ? PALETTE.ink : PALETTE.paper,
        color: active ? PALETTE.paper : PALETTE.ink,
        border: `1px solid ${active ? PALETTE.ink : PALETTE.border}`,
      }}
    >
      <Icon size={18} strokeWidth={1.5} className="mb-2" />
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 19,
          fontWeight: 500,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
      <div className="text-[11px] mt-0.5" style={{ opacity: 0.7 }}>
        {sub}
      </div>
    </button>
  );
}

function Label({ children }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9.5,
        letterSpacing: "0.22em",
        color: PALETTE.inkSoft,
        textTransform: "uppercase",
        marginBottom: 7,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent py-2.5 mb-5 text-[15px] outline-none transition-colors"
      style={{
        borderBottom: `1px solid ${PALETTE.border}`,
        color: PALETTE.ink,
        fontFamily: "'DM Sans', sans-serif",
      }}
      onFocus={(e) => (e.target.style.borderColor = PALETTE.ink)}
      onBlur={(e) => (e.target.style.borderColor = PALETTE.border)}
    />
  );
}

/* ============================================================
   FEED
============================================================ */
function Feed({ user, posts, onOpen, onCreate, onProfile }) {
  const [activeCat, setActiveCat] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = posts.filter((p) => {
    if (activeCat !== "all" && p.category !== activeCat) return false;
    if (query && !(`${p.title} ${p.destination} ${p.body}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                letterSpacing: "0.25em",
                color: PALETTE.inkSoft,
                textTransform: "uppercase",
              }}
            >
              The Wire · Live
            </div>
            <h1
              style={{
                fontFamily: "'Fraunces', serif",
                fontWeight: 400,
                fontSize: 30,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: PALETTE.ink,
                marginTop: 4,
              }}
            >
              Good morning,{" "}
              <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                {user?.name?.split(" ")[0] || "friend"}.
              </span>
            </h1>
          </div>
          <button
            onClick={onProfile}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-medium transition-transform active:scale-95"
            style={{
              background: PALETTE.ink,
              color: PALETTE.paper,
              fontFamily: "'Fraunces', serif",
            }}
          >
            {user?.initials || "U"}
          </button>
        </div>

        {/* Search */}
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

        {/* Category strip */}
        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 no-scrollbar">
          <CatChip label="All" active={activeCat === "all"} onClick={() => setActiveCat("all")} />
          {CATEGORIES.map((c) => (
            <CatChip
              key={c.id}
              label={c.label}
              Icon={c.Icon}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {filtered.length === 0 && (
          <div
            className="text-center py-16 text-[14px]"
            style={{ color: PALETTE.inkSoft, fontStyle: "italic", fontFamily: "'Fraunces', serif" }}
          >
            Nothing here yet. Be the first to ask.
          </div>
        )}
        {filtered.map((p, i) => (
          <PostCard key={p.id} post={p} onClick={() => onOpen(p.id)} delay={i * 60} />
        ))}
        <div
          className="text-center mt-8 mb-4 text-[10px] tracking-[0.25em] uppercase"
          style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}
        >
          — end of dispatch —
        </div>
      </div>
    </div>
  );
}

function CatChip({ label, active, onClick, Icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all"
      style={{
        background: active ? PALETTE.ink : "transparent",
        color: active ? PALETTE.paper : PALETTE.ink,
        border: `1px solid ${active ? PALETTE.ink : PALETTE.border}`,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {Icon && <Icon size={12.5} strokeWidth={1.7} />}
      {label}
    </button>
  );
}

function PostCard({ post, onClick, delay = 0 }) {
  const Icon = catIcon(post.category);
  const hasAnswer = post.responses.length > 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left mb-4 p-5 rounded-3xl transition-all active:scale-[0.99] hover:shadow-sm"
      style={{
        background: PALETTE.paper,
        border: `1px solid ${PALETTE.border}`,
        animation: `fadeUp 500ms ${delay}ms ease-out both`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10.5px]"
            style={{
              background: PALETTE.accentSoft,
              color: PALETTE.accentDeep,
              fontFamily: "'Fraunces', serif",
              fontWeight: 600,
            }}
          >
            {post.author.initials}
          </div>
          <div>
            <div className="text-[12.5px] font-medium leading-tight" style={{ color: PALETTE.ink }}>
              {post.author.name}
            </div>
            <div className="text-[10.5px]" style={{ color: PALETTE.inkSoft }}>
              from {post.author.from} · {post.posted}
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
          style={{
            background: PALETTE.paperAlt,
            color: PALETTE.inkSoft,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <Icon size={11} strokeWidth={1.7} />
          <span className="uppercase tracking-wider">{post.category}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-1.5">
        <MapPin size={11} strokeWidth={1.8} style={{ color: PALETTE.accent }} />
        <span
          className="text-[10.5px] uppercase tracking-[0.2em]"
          style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {post.destination}
        </span>
      </div>

      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 20,
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: "-0.018em",
          color: PALETTE.ink,
          marginBottom: 8,
        }}
      >
        {post.title}
      </h3>
      <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: PALETTE.inkSoft }}>
        {post.body}
      </p>

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

/* ============================================================
   POST DETAIL
============================================================ */
function PostDetail({ post, me, onBack, onRate, onTip, onReply }) {
  const Icon = catIcon(post.category);
  const [reply, setReply] = useState("");
  const isMyPost = me?.name === post.author.name;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Dispatch" />

      <div className="flex-1 overflow-y-auto px-6 pb-40">
        {/* Header block */}
        <div
          className="p-5 rounded-3xl mb-5"
          style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.8} style={{ color: PALETTE.accent }} />
              <span
                className="text-[10.5px] uppercase tracking-[0.22em]"
                style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {post.destination}
              </span>
            </div>
            <div
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: PALETTE.paperAlt,
                color: PALETTE.inkSoft,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Icon size={11} strokeWidth={1.7} />
              {post.category}
            </div>
          </div>

          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: PALETTE.ink,
              marginBottom: 12,
            }}
          >
            {post.title}
          </h2>
          <p className="text-[14.5px] leading-relaxed" style={{ color: PALETTE.ink }}>
            {post.body}
          </p>

          <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px]"
              style={{
                background: PALETTE.accentSoft,
                color: PALETTE.accentDeep,
                fontFamily: "'Fraunces', serif",
                fontWeight: 600,
              }}
            >
              {post.author.initials}
            </div>
            <div className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
              <span style={{ color: PALETTE.ink, fontWeight: 500 }}>{post.author.name}</span>
              {" · "}from {post.author.from}
              {" · "}{post.posted}
            </div>
          </div>
        </div>

        {/* Responses header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                letterSpacing: "0.25em",
                color: PALETTE.inkSoft,
                textTransform: "uppercase",
              }}
            >
              From locals
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22,
                fontWeight: 400,
                color: PALETTE.ink,
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontStyle: "italic" }}>{post.responses.length}</span> {post.responses.length === 1 ? "answer" : "answers"}
            </div>
          </div>
        </div>

        {post.responses.length === 0 && (
          <div
            className="rounded-3xl p-6 text-center"
            style={{ background: PALETTE.paper, border: `1px dashed ${PALETTE.border}` }}
          >
            <div
              className="text-[14px] mb-1"
              style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", color: PALETTE.ink }}
            >
              No one's answered yet.
            </div>
            <div className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
              {me?.role === "local" ? "You could be the first." : "Hang tight — locals are checking in."}
            </div>
          </div>
        )}

        {post.responses.map((r, i) => (
          <ResponseCard
            key={r.id}
            response={r}
            isMyPost={isMyPost}
            onRate={(stars) => onRate(r.id, stars)}
            onTip={() => onTip(r)}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Reply composer for locals */}
      {me?.role === "local" && !isMyPost && (
        <div
          className="absolute bottom-20 left-0 right-0 px-4 py-3"
          style={{
            background: `linear-gradient(to top, ${PALETTE.bg} 60%, transparent)`,
          }}
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
              onClick={() => {
                if (reply.trim()) {
                  onReply(reply.trim());
                  setReply("");
                }
              }}
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

function ResponseCard({ response, isMyPost, onRate, onTip, delay }) {
  return (
    <div
      className="p-5 rounded-3xl mb-4 relative"
      style={{
        background: PALETTE.paper,
        border: `1px solid ${PALETTE.border}`,
        animation: `fadeUp 500ms ${delay}ms ease-out both`,
      }}
    >
      {/* Quote mark */}
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
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px]"
          style={{
            background: PALETTE.greenSoft,
            color: PALETTE.green,
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
          }}
        >
          {response.author.initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium" style={{ color: PALETTE.ink }}>
              {response.author.name}
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
            in {response.author.from} · {response.posted}
          </div>
        </div>
      </div>

      <p className="text-[14px] leading-relaxed mb-4" style={{ color: PALETTE.ink }}>
        {response.body}
      </p>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
        <StarRating value={response.rating} onChange={isMyPost ? onRate : undefined} />
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
              style={{
                background: PALETTE.ink,
                color: PALETTE.paper,
              }}
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

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className={`p-0.5 transition-transform ${interactive ? "active:scale-90" : ""}`}
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
      {value > 0 && (
        <span
          className="text-[10.5px] ml-1"
          style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}.0
        </span>
      )}
    </div>
  );
}

/* ============================================================
   NEW POST
============================================================ */
function NewPost({ onBack, onSubmit }) {
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("food");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const valid = destination && title && body;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Ask a local" />
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-5">
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              letterSpacing: "0.25em",
              color: PALETTE.inkSoft,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            New dispatch
          </div>
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 400,
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: PALETTE.ink,
            }}
          >
            What do you{" "}
            <span style={{ fontStyle: "italic", color: PALETTE.accent }}>need to know?</span>
          </h2>
        </div>

        <Label>Where</Label>
        <Input value={destination} onChange={setDestination} placeholder="e.g. Lisbon, PT" />

        <Label>About</Label>
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => {
            const active = category === c.id;
            const Ic = c.Icon;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-medium transition-all active:scale-95"
                style={{
                  background: active ? PALETTE.ink : PALETTE.paper,
                  color: active ? PALETTE.paper : PALETTE.ink,
                  border: `1px solid ${active ? PALETTE.ink : PALETTE.border}`,
                }}
              >
                <Ic size={12.5} strokeWidth={1.7} />
                {c.label}
              </button>
            );
          })}
        </div>

        <Label>Headline</Label>
        <Input value={title} onChange={setTitle} placeholder="The question, in a sentence" />

        <Label>The detail</Label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Tell us what you've already tried, what kind of answer you're looking for, how much time you have…"
          className="w-full bg-transparent py-2.5 mb-2 text-[14px] outline-none resize-none"
          style={{
            borderBottom: `1px solid ${PALETTE.border}`,
            color: PALETTE.ink,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />

        <div
          className="mt-6 p-4 rounded-2xl flex items-start gap-3 text-[12px]"
          style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, color: PALETTE.inkSoft }}
        >
          <Shield size={14} strokeWidth={1.7} style={{ color: PALETTE.green, marginTop: 1 }} />
          <span>
            Real locals — verified by phone — will see this. No bots, no scraped reviews, no sponsored answers.
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={() => valid && onSubmit({ destination, category, title, body })}
          disabled={!valid}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition-all"
          style={{
            background: valid ? PALETTE.ink : PALETTE.border,
            color: valid ? PALETTE.paper : PALETTE.inkSoft,
          }}
        >
          Send to locals
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE
============================================================ */
function Profile({ user, posts, onBack, onSignOut }) {
  if (!user) return null;
  const myPosts = posts.filter((p) => p.author.name === user.name);
  const myAnswers = posts.flatMap((p) => p.responses.filter((r) => r.author.name === user.name).map((r) => ({ ...r, post: p })));
  const tipsEarned = myAnswers.reduce((s, a) => s + (a.tipAmount || 0), 0);
  const avgRating = myAnswers.filter((a) => a.rating > 0).reduce((s, a, _, arr) => s + a.rating / arr.length, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Passport" />
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* Hero */}
        <div className="relative mb-6 mt-2">
          <div
            className="absolute -top-2 -right-2 px-2 py-1 rounded-sm rotate-6"
            style={{
              background: PALETTE.accent,
              color: PALETTE.paper,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
            }}
          >
            {user.role.toUpperCase()}
          </div>
          <div
            className="rounded-3xl p-6"
            style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[22px]"
                style={{
                  background: PALETTE.ink,
                  color: PALETTE.paper,
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 500,
                }}
              >
                {user.initials}
              </div>
              <div className="flex-1">
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 24,
                    fontWeight: 400,
                    lineHeight: 1.05,
                    letterSpacing: "-0.02em",
                    color: PALETTE.ink,
                  }}
                >
                  {user.name}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: PALETTE.inkSoft }}>
                  <Globe size={10} strokeWidth={1.8} className="inline mr-1 -mt-0.5" />
                  {user.from} · joined {user.joined}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: `1px dashed ${PALETTE.border}` }}>
              <Stat label={user.role === "local" ? "Answers" : "Questions"} value={user.role === "local" ? myAnswers.length : myPosts.length} />
              <Stat label="Avg. rating" value={avgRating ? avgRating.toFixed(1) : "—"} />
              <Stat label={user.role === "local" ? "Earned" : "Tipped"} value={`$${tipsEarned}`} />
            </div>
          </div>
        </div>

        {/* Recent */}
        <SectionHeader title={user.role === "local" ? "Your answers" : "Your questions"} />
        {user.role === "local" ? (
          myAnswers.length === 0 ? (
            <EmptyNote text="No answers yet. Open the feed and help someone out." />
          ) : (
            myAnswers.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl mb-3"
                style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
              >
                <div
                  className="text-[10.5px] uppercase tracking-[0.2em] mb-1"
                  style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <MapPin size={10} className="inline mr-1 -mt-0.5" strokeWidth={1.8} />
                  {a.post.destination}
                </div>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 16,
                    color: PALETTE.ink,
                    fontWeight: 400,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                  }}
                >
                  {a.post.title}
                </div>
                <p
                  className="text-[12.5px] mt-1 line-clamp-2"
                  style={{ color: PALETTE.inkSoft, fontStyle: "italic" }}
                >
                  "{a.body}"
                </p>
                <div className="flex items-center justify-between mt-2.5">
                  <StarRating value={a.rating} />
                  {a.tipped && (
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: PALETTE.accentDeep, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
                    >
                      <Heart size={9} fill={PALETTE.accentDeep} strokeWidth={2} />
                      ${a.tipAmount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        ) : myPosts.length === 0 ? (
          <EmptyNote text="No questions yet. Ask one — a local is waiting." />
        ) : (
          myPosts.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl mb-3"
              style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
            >
              <div
                className="text-[10.5px] uppercase tracking-[0.2em] mb-1"
                style={{ color: PALETTE.accent, fontFamily: "'JetBrains Mono', monospace" }}
              >
                {p.destination}
              </div>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 16,
                  color: PALETTE.ink,
                  letterSpacing: "-0.015em",
                }}
              >
                {p.title}
              </div>
              <div className="text-[11.5px] mt-1.5" style={{ color: PALETTE.inkSoft }}>
                {p.responses.length} {p.responses.length === 1 ? "answer" : "answers"} · {p.posted}
              </div>
            </div>
          ))
        )}

        <SectionHeader title="Settings" />
        <SettingRow label="Edit profile" />
        <SettingRow label="Payment methods" />
        <SettingRow label="Notifications" />
        <SettingRow label="Help & community guidelines" />
        <button
          onClick={onSignOut}
          className="w-full py-3 mt-4 text-[13px] rounded-full"
          style={{ color: PALETTE.accent, border: `1px solid ${PALETTE.border}`, background: PALETTE.paper }}
        >
          Sign out
        </button>

        <div
          className="text-center mt-8 text-[10px] tracking-[0.25em] uppercase"
          style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}
        >
          mi concierge · made for wanderers
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: PALETTE.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="text-[9.5px] uppercase tracking-[0.18em] mt-1"
        style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div
        className="text-[9.5px] uppercase tracking-[0.25em] whitespace-nowrap"
        style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {title}
      </div>
      <div className="h-px flex-1" style={{ background: PALETTE.border }} />
    </div>
  );
}

function SettingRow({ label }) {
  return (
    <button
      className="w-full flex items-center justify-between py-3.5 px-1 text-left"
      style={{ borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <span className="text-[14px]" style={{ color: PALETTE.ink }}>
        {label}
      </span>
      <ChevronRight size={15} strokeWidth={1.7} style={{ color: PALETTE.inkSoft }} />
    </button>
  );
}

function EmptyNote({ text }) {
  return (
    <div
      className="rounded-2xl p-5 text-center text-[13px]"
      style={{
        background: PALETTE.paper,
        border: `1px dashed ${PALETTE.border}`,
        color: PALETTE.inkSoft,
        fontFamily: "'Fraunces', serif",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

/* ============================================================
   TIP FLOW (PayPal)
============================================================ */
function TipFlow({ ctx, onClose, onComplete }) {
  const [step, setStep] = useState("amount"); // amount | approve | capturing | done
  const [amount, setAmount] = useState(5);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (step === "capturing") {
      const t = setTimeout(() => setStep("done"), 1400);
      return () => clearTimeout(t);
    }
  }, [step]);

  const finalAmount = custom ? Number(custom) || 0 : amount;

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center"
      style={{ background: "rgba(26,19,12,0.55)", animation: "fadeIn 240ms ease-out" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[36px] px-6 pt-5 pb-8 relative"
        style={{
          background: PALETTE.bg,
          animation: "slideUp 320ms cubic-bezier(.2,.9,.3,1)",
          maxHeight: "85%",
          overflow: "auto",
        }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: PALETTE.border }} />

        {step === "amount" && (
          <>
            <div className="text-center mb-1">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: "0.25em",
                  color: PALETTE.inkSoft,
                  textTransform: "uppercase",
                }}
              >
                Tip
              </div>
              <h3
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 26,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: PALETTE.ink,
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                Buy{" "}
                <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                  {ctx.response.author.name.split(" ")[0]}
                </span>{" "}
                a coffee — or dinner.
              </h3>
              <p className="text-[12.5px] mt-2" style={{ color: PALETTE.inkSoft }}>
                100% goes to them. Mi Concierge takes nothing on tips.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-6 mb-3">
              {[3, 5, 10, 20].map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAmount(a);
                    setCustom("");
                  }}
                  className="py-4 rounded-2xl text-center transition-all active:scale-95"
                  style={{
                    background: !custom && amount === a ? PALETTE.ink : PALETTE.paper,
                    color: !custom && amount === a ? PALETTE.paper : PALETTE.ink,
                    border: `1px solid ${!custom && amount === a ? PALETTE.ink : PALETTE.border}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 22,
                      fontWeight: 400,
                      lineHeight: 1,
                    }}
                  >
                    ${a}
                  </div>
                </button>
              ))}
            </div>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-5"
              style={{
                background: PALETTE.paper,
                border: `1px solid ${custom ? PALETTE.ink : PALETTE.border}`,
              }}
            >
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: PALETTE.inkSoft }}>$</span>
              <input
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Other amount"
                className="flex-1 bg-transparent outline-none text-[15px]"
                style={{ color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <button
              onClick={() => finalAmount > 0 && setStep("approve")}
              disabled={!finalAmount}
              className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition flex items-center justify-center gap-2"
              style={{
                background: finalAmount ? "#0070BA" : PALETTE.border,
                color: "#fff",
              }}
            >
              Continue to PayPal · ${finalAmount || 0}
            </button>
            <div
              className="text-center text-[10px] tracking-[0.2em] uppercase mt-3"
              style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}
            >
              Secured by PayPal · Sandbox
            </div>
          </>
        )}

        {step === "approve" && (
          <div className="text-center py-4">
            <div
              className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#0070BA" }}
            >
              <span
                style={{
                  color: "#fff",
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: 24,
                  fontStyle: "italic",
                }}
              >
                P
              </span>
            </div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22,
                fontWeight: 400,
                color: PALETTE.ink,
                letterSpacing: "-0.02em",
              }}
            >
              Approve in PayPal
            </h3>
            <p className="text-[13px] mt-2 mb-5" style={{ color: PALETTE.inkSoft }}>
              You'll be redirected to PayPal to authorize the payment.
              <br />Then we'll capture it on this side.
            </p>
            <div
              className="rounded-2xl p-4 text-left mb-5"
              style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
            >
              <Row label="To" value={ctx.response.author.name} />
              <Row label="For" value={ctx.post.title} />
              <Row label="Amount" value={`$${finalAmount}.00`} />
              <Row label="Order ID" value={`PP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`} mono last />
            </div>
            <button
              onClick={() => setStep("capturing")}
              className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition"
              style={{ background: "#0070BA", color: "#fff" }}
            >
              Approve & capture
            </button>
            <button onClick={onClose} className="text-[12px] py-3 mt-1" style={{ color: PALETTE.inkSoft }}>
              Cancel
            </button>
          </div>
        )}

        {step === "capturing" && (
          <div className="text-center py-12">
            <div
              className="mx-auto w-12 h-12 rounded-full mb-5"
              style={{
                border: `3px solid ${PALETTE.border}`,
                borderTopColor: PALETTE.accent,
                animation: "spin 800ms linear infinite",
              }}
            />
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 20,
                fontStyle: "italic",
                color: PALETTE.ink,
              }}
            >
              Capturing payment…
            </div>
            <div
              className="text-[10px] tracking-[0.25em] uppercase mt-2"
              style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
            >
              POST /payments/tip/capture
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: PALETTE.green, color: PALETTE.paper }}
            >
              <Check size={28} strokeWidth={2.4} />
            </div>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 26,
                fontWeight: 400,
                color: PALETTE.ink,
                letterSpacing: "-0.02em",
              }}
            >
              ${finalAmount} sent to{" "}
              <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                {ctx.response.author.name.split(" ")[0]}
              </span>
            </h3>
            <p className="text-[13px] mt-2 mb-6" style={{ color: PALETTE.inkSoft }}>
              That's a coffee, a beer, or a small thank-you that means more than five stars.
            </p>
            <button
              onClick={() => onComplete(finalAmount)}
              className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition"
              style={{ background: PALETTE.ink, color: PALETTE.paper }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, last }) {
  return (
    <div
      className="flex justify-between items-center py-2"
      style={{ borderBottom: last ? "none" : `1px dashed ${PALETTE.border}` }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.2em]"
        style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </span>
      <span
        className="text-[13px]"
        style={{
          color: PALETTE.ink,
          fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   SHARED CHROME
============================================================ */
function TopBar({ onBack, title }) {
  return (
    <div className="flex items-center justify-between px-6 pt-14 pb-3">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
        style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}
      >
        <ArrowLeft size={16} strokeWidth={1.8} style={{ color: PALETTE.ink }} />
      </button>
      <div
        className="text-[10.5px] uppercase tracking-[0.3em]"
        style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {title}
      </div>
      <div className="w-10 h-10" />
    </div>
  );
}

function TabBar({ screen, onHome, onCreate, onProfile }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-3 z-30"
      style={{
        background: `linear-gradient(to top, ${PALETTE.bg} 70%, transparent)`,
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-2 rounded-full"
        style={{
          background: PALETTE.ink,
          color: PALETTE.paper,
        }}
      >
        <button
          onClick={onHome}
          className="w-10 h-10 flex items-center justify-center rounded-full transition"
          style={{ opacity: screen === "feed" ? 1 : 0.5 }}
        >
          <Home size={18} strokeWidth={1.8} />
        </button>
        <button
          onClick={onCreate}
          className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition"
          style={{ background: PALETTE.accent, color: PALETTE.paper }}
        >
          <Plus size={20} strokeWidth={2} />
        </button>
        <button
          onClick={onProfile}
          className="w-10 h-10 flex items-center justify-center rounded-full transition"
          style={{ opacity: screen === "profile" ? 1 : 0.5 }}
        >
          <User size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   GRAIN OVERLAY
============================================================ */
function Grain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 mix-blend-multiply opacity-[0.08]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}

/* ============================================================
   FONTS + GLOBAL CSS
============================================================ */
function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap');

      * { -webkit-tap-highlight-color: transparent; }
      body { margin: 0; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translate(-50%, 8px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `}</style>
  );
}