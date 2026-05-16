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
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Bell,
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
  { id: "tourism", label: "Tourism", Icon: Camera },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag },
  { id: "activities", label: "Activities", Icon: Compass },
];

const catIcon = (id) =>
  (CATEGORIES.find((c) => c.id === id) || CATEGORIES[5]).Icon;

/* ============================================================
   API CLIENT
   Base URL from env var; falls back to localhost for dev.
   JWT is stored in localStorage and a module-level variable
   so every request picks it up automatically.
============================================================ */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let _token = null;

function setToken(t) {
  _token = t;
  if (t) localStorage.setItem("jwt", t);
  else localStorage.removeItem("jwt");
}

function loadStoredToken() {
  const t = localStorage.getItem("jwt");
  if (t) _token = t;
  return t;
}

async function request(method, path, body) {
  const headers = {};
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  // Only set Content-Type when we actually send a body.
  // Sending Content-Type on a bodyless DELETE can trigger CORS pre-flight
  // rejections or 4xx errors on some backends.
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content or 205 Reset Content → no body to parse
  if (res.status === 204 || res.status === 205) return null;

  // Try to parse JSON; fall back to null so we don't throw on empty bodies
  // that some servers send with 200 on DELETE.
  const text = await res.text().catch(() => "");
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    throw new Error(
      (data && (data.detail || data.message)) || `Error ${res.status}`
    );
  }

  return data;
}

const api = {
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  put:    (path, body) => request("PUT",    path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  delete: (path)       => request("DELETE", path),
};

/* ============================================================
   HELPERS — map backend shapes to frontend shapes
============================================================ */

function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    city: u.city || "—",
    avatarUrl: u.avatar_url || null,
    // frontend uses "from" everywhere
    from: u.city || "—",
    initials: u.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join(""),
    joined: new Date(u.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
}

function mapPost(p) {
  if (!p) return null;
  return {
    id: p.id,
    // backend uses "content", frontend uses "body"
    body: p.content,
    title: p.title,
    // backend uses "city", frontend uses "destination"
    destination: p.city,
    category: p.category,
    author: mapUser(p.author),
    author_id: p.author_id,
    posted: formatRelative(p.created_at),
    responses: (p.responses || []).map(mapResponse),
  };
}

function mapResponse(r) {
  if (!r) return null;
  return {
    id: r.id,
    body: r.content,
    post_id: r.post_id,
    author_id: r.author_id,
    author: mapUser(r.author),
    posted: formatRelative(r.created_at),
    // rating & tip are fetched/merged separately
    rating: r.rating ?? 0,
    tipped: r.tipped ?? false,
    tipAmount: r.tipAmount ?? 0,
  };
}

function formatRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ============================================================
   APP
============================================================ */

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activePostId, setActivePostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [tipCtx, setTipCtx] = useState(null);
  const [toast, setToast] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [profileSubscreen, setProfileSubscreen] = useState(null);

  /* ── Restore session on mount ── */
  useEffect(() => {
    const saved = loadStoredToken();
    if (!saved) {
      setBootstrapping(false);
      return;
    }
    api
      .get("/users/me")
      .then((u) => {
        setUser(mapUser(u));
        setScreen("feed");
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

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

  /* ── Auth ── */
  const handleAuth = (mappedUser) => {
    setUser(mappedUser);
    setScreen("feed");
    setHistory([]);
  };

  /* ── Create post ── */
  const handleNewPost = async (postData) => {
    try {
      const created = await api.post("/posts/", {
        title: postData.title,
        content: postData.body,         // frontend "body" → backend "content"
        city: postData.destination,     // frontend "destination" → backend "city"
        category: postData.category,
      });
      setPosts((p) => [mapPost(created), ...p]);
      setScreen("feed");
      setHistory([]);
      showToast("Posted. Locals will see it shortly.");
    } catch (e) {
      showToast(e.message);
    }
  };

  /* ── Edit post ── */
  const handleEditPost = async (postId, postData) => {
    try {
      const updated = await api.patch(`/posts/${postId}`, {
        title: postData.title,
        content: postData.body,
        city: postData.destination,
        category: postData.category,
      });
      const mapped = mapPost(updated);
      setPosts((ps) => ps.map((p) => (p.id === postId ? mapped : p)));
      showToast("Post updated.");
      setScreen("post");
      setHistory((h) => h.filter((s) => s !== "edit-post"));
      return mapped;
    } catch (e) {
      showToast(e.message);
    }
  };

  /* ── Delete post ── */
  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((ps) => ps.filter((p) => p.id !== postId));
      setScreen("feed");
      setHistory([]);
      showToast("Post deleted.");
    } catch (e) {
      showToast(e.message);
    }
  };

  /* ── New response ── */
  const handleNewResponse = async (postId, body) => {
    try {
      const created = await api.post(`/responses/${postId}`, { content: body });
      const mapped = mapResponse(created);
      setPosts((ps) =>
        ps.map((p) =>
          p.id === postId
            ? { ...p, responses: [...p.responses, mapped] }
            : p
        )
      );
      showToast("Reply sent.");
    } catch (e) {
      showToast(e.message);
    }
  };

  /* ── Rate response ── */
  const handleRate = async (postId, responseId, stars) => {
    try {
      try {
        await api.post("/ratings/", { response_id: responseId, score: stars });
      } catch (e) {
        // Ya existe → actualizar
        if (e.message?.includes("Ya calificaste")) {
          await api.put(`/ratings/${responseId}`, { response_id: responseId, score: stars });
        } else {
          throw e;
        }
      }
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
    } catch (e) {
      showToast(e.message);
    }
  };

  /* ── Tip complete ── */
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
    showToast(`Tipped $${amount}. They'll feel it.`);
  };

  const activePost = posts.find((p) => p.id === activePostId);

  if (bootstrapping) {
    return (
      <>
        <FontStyles />
        <div
          className="min-h-screen w-full flex items-center justify-center"
          style={{ background: "radial-gradient(ellipse at top, #E8DCC0 0%, #C9B997 60%, #A89472 100%)" }}
        >
          <Loader2
            size={28}
            strokeWidth={1.5}
            style={{ color: PALETTE.inkSoft, animation: "spin 900ms linear infinite" }}
          />
        </div>
      </>
    );
  }

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
          <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 items-end justify-center pb-1">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>

          <Grain />

          <div className="relative flex-1 overflow-hidden flex flex-col">
            {screen === "welcome" && (
              <Welcome 
                onStart={() => { setAuthMode("register"); setScreen("auth"); }} 
                onSignIn={() => { setAuthMode("login"); setScreen("auth"); }} 
              />
            )}
            {screen === "auth" && <Auth onAuth={handleAuth} initialMode={authMode} />}
            {screen === "feed" && (
              <Feed
                user={user}
                posts={posts}
                setPosts={setPosts}
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
                onUpdatePost={(updated) =>
                  setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)))
                }
                onOpenEdit={() => { setEditingPost(activePost); goTo("edit-post"); }}
                onDeletePost={() => handleDeletePost(activePost.id)}
              />
            )}
            {screen === "edit-post" && editingPost && (
              <EditPost
                post={editingPost}
                onBack={goBack}
                onSave={(postData) => handleEditPost(editingPost.id, postData)}
              />
            )}
            {screen === "new" && <NewPost onBack={goBack} onSubmit={handleNewPost} />}
            {screen === "profile" && (
              <Profile
                user={user}
                posts={posts}
                onBack={goBack}
                initialSubscreen={profileSubscreen}
                onOpen={(id) => {
                  setActivePostId(id);
                  goTo("post");
                }}
                onUpdateUser={(updated) => setUser(updated)}
                onSignOut={() => {
                  setToken(null);
                  setUser(null);
                  setPosts([]);
                  setScreen("welcome");
                  setHistory([]);
                }}
              />
            )}
          </div>

          {user && ["feed", "post", "profile"].includes(screen) && (
            <TabBar
              screen={screen}
              activeTab={screen === "profile" ? (profileSubscreen === "notifications" ? "notifications" : "profile") : screen}
              user={user}
              onHome={() => { setScreen("feed"); setHistory([]); }}
              onCreate={() => goTo("new")}
              onNotifications={() => { setProfileSubscreen("notifications"); if (screen !== "profile") goTo("profile"); }}
              onProfile={() => { setProfileSubscreen(null); if (screen !== "profile") goTo("profile"); }}
            />
          )}

          {tipCtx && (
            <TipFlow
              ctx={tipCtx}
              me={user}
              onClose={() => setTipCtx(null)}
              onComplete={(amt) =>
                handleTipComplete(tipCtx.post.id, tipCtx.response.id, amt)
              }
            />
          )}

          {toast && (
            <div
              className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium z-50 flex items-center gap-2"
              style={{
                background: PALETTE.ink,
                color: PALETTE.paper,
                fontFamily: "'DM Sans', sans-serif",
                animation: "toastIn 240ms cubic-bezier(.2,.9,.3,1.2)",
                whiteSpace: "nowrap",
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
function Welcome({ onStart, onSignIn }) {
  return (
    <div className="flex-1 flex flex-col px-7 pt-16 pb-10 relative overflow-hidden">
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
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: 42, fontStyle: "italic", letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1 }}>
          mi
        </span>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: 42, letterSpacing: "-0.02em", color: PALETTE.accent, lineHeight: 1 }}>
          concierge
        </span>
      </div>

      <div className="mb-auto" style={{ animation: "fadeUp 700ms 100ms ease-out both" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 300, fontSize: 54, lineHeight: 0.95, letterSpacing: "-0.035em", color: PALETTE.ink }}>
          Local guides,
          <br />
          <span style={{ fontStyle: "italic", color: PALETTE.accentDeep }}>unforgettable</span>{" "}
          experiences.
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed max-w-[300px]" style={{ color: PALETTE.inkSoft }}>
          Ask a question about a city. Someone who lives there will answer — the way they'd answer a friend.
        </p>
      </div>

      <div className="flex flex-col gap-3" style={{ animation: "fadeUp 800ms 200ms ease-out both" }}>
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
            No bots · Real people
          </span>
          <div className="h-px flex-1" style={{ background: PALETTE.inkFaint }} />
        </div>
        <button
          onClick={onStart}
          className="w-full py-4 rounded-full text-[15px] font-medium transition-all active:scale-[0.98]"
          style={{ background: PALETTE.ink, color: PALETTE.paper, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.01em" }}
        >
          Begin
        </button>
        <button
          className="text-[13px] py-2"
          style={{ color: PALETTE.inkSoft, fontFamily: "'DM Sans', sans-serif" }}
          onClick={onSignIn}> I've been here before · Sign in </button>
      </div>
    </div>
  );
}

/* ============================================================
   AUTH
   - Register → POST /auth/register (returns UserOut, no token)
   - Login    → POST /auth/login    (returns Token)
   - After either: GET /users/me    (returns UserOut with full data)
============================================================ */
function Auth({ onAuth, initialMode = "register" }) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState("tourist");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        // Step 1: create account
        await api.post("/auth/register", {
          name,
          email,
          password,
          role,
          city: city || null,
        });
      }

      // Step 2: get token (both register and login)
      const tokenData = await api.post("/auth/login", { email, password });
      setToken(tokenData.access_token);

      // Step 3: fetch full user profile
      const me = await api.get("/users/me");
      onAuth(mapUser(me));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-7 pt-14 pb-8 overflow-y-auto">
      <div className="mb-8">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase", marginBottom: 6 }}>
          {mode === "register" ? "First time?" : "Welcome back"}
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: 36, lineHeight: 1, letterSpacing: "-0.025em", color: PALETTE.ink }}>
          Tell us{" "}
          <span style={{ fontStyle: "italic", color: PALETTE.accent }}>who you are</span>.
        </h2>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4 text-[13px]"
          style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep }}
        >
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      {mode === "register" && (
        <>
          <Label>I'm here as a</Label>
          <div className="flex gap-2 mb-6">
            <RoleCard active={role === "tourist"} onClick={() => setRole("tourist")} title="Traveler" sub="I have questions" Icon={Compass} />
            <RoleCard active={role === "local"} onClick={() => setRole("local")} title="Local" sub="I have answers" Icon={MapPin} />
          </div>
          <Label>Name</Label>
          <Input value={name} onChange={setName} placeholder="What should we call you?" />
          <Label>{role === "local" ? "Where you live" : "Where you're from"}</Label>
          <Input value={city} onChange={setCity} placeholder={role === "local" ? "e.g. Lisbon" : "e.g. Berlin"} />
        </>
      )}

      <Label>Email</Label>
      <Input value={email} onChange={setEmail} placeholder="hello@somewhere.com" />
      <Label>Password</Label>
      <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" />

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: PALETTE.ink, color: PALETTE.paper }}
        >
          {loading && <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 900ms linear infinite" }} />}
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
        <button
          onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }}
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
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>{title}</div>
      <div className="text-[11px] mt-0.5" style={{ opacity: 0.7 }}>{sub}</div>
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.22em", color: PALETTE.inkSoft, textTransform: "uppercase", marginBottom: 7, marginTop: 4 }}>
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
      style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
      onFocus={(e) => (e.target.style.borderColor = PALETTE.ink)}
      onBlur={(e) => (e.target.style.borderColor = PALETTE.border)}
    />
  );
}

/* ============================================================
   FEED
   GET /posts/?city=&category=
   Posts are fetched on mount and when filters change.
============================================================ */
function Feed({ user, posts, setPosts, onOpen, onCreate, onProfile }) {
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

  // Debounce search query
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

function SkeletonCard() {
  return (
    <div
      className="w-full mb-4 p-5 rounded-3xl"
      style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, height: 168, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite" }}
    />
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

/* ============================================================
   POST DETAIL
   Fetches responses fresh from GET /responses/{post_id}
   so ratings and tip state from the server are always current.
============================================================ */
function PostDetail({ post, me, onBack, onRate, onTip, onReply, onUpdatePost, onOpenEdit, onDeletePost }) {
  const Icon = catIcon(post.category);
  const [reply, setReply] = useState("");
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [localPost, setLocalPost] = useState(post);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyPost = me?.id === post.author_id;

  // Fetch responses fresh every time this post is opened
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

            // Rating del usuario actual (para el dueño del post)
            try {
              const mine = await api.get(`/ratings/${r.id}/mine`);
              myScore = mine?.score ?? 0;
            } catch {}

            // Rating del dueño del post (para turistas externos)
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

  // Keep localPost in sync if parent updates it (e.g. after a new reply)
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
        {/* Post header */}
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

        {/* Delete confirmation */}
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

        {/* Responses header */}
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

      {/* Reply composer — only for locals, not on own post */}
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

function ResponseCard({ response, me, postAuthor, isMyPost, onRate, onTip, delay }) {
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
          {/* Dueño del post → puede calificar */}
          {canRate && (
            <StarRating
              value={response.rating}
              average={avgRating}
              onChange={handleRate}
            />
          )}

          {/* Local o turista externo → ve el rating del dueño del post */}
          {(!isTourist || !isPostOwner) && response.rating > 0 && (
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

          {/* Turista externo sin rating aún */}
          {isTourist && !isPostOwner && response.rating === 0 && avgRating === null && (
            <div
              className="text-[11px]"
              style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic" }}
            >
              Not rated yet
            </div>
          )}

          {/* Promedio — solo para no-dueños */}
          {!isPostOwner && avgRating !== null && response.rating === 0 && (
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

function StarRating({ value, average, onChange }) {
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

      {average !== null && average !== undefined ? (
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

/* ============================================================
   NEW POST
   POST /posts/ with { title, content, city, category }
   "body" in UI → "content" in API
   "destination" in UI → "city" in API
============================================================ */
function NewPost({ onBack, onSubmit }) {
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("food");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = destination.trim() && title.trim() && body.trim();

  const handleSubmit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await onSubmit({ destination, category, title, body });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Ask a local" />
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-5">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase", marginBottom: 6 }}>
            New dispatch
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.025em", color: PALETTE.ink }}>
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
          style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
        />

        <div className="mt-6 p-4 rounded-2xl flex items-start gap-3 text-[12px]" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}`, color: PALETTE.inkSoft }}>
          <Shield size={14} strokeWidth={1.7} style={{ color: PALETTE.green, marginTop: 1 }} />
          <span>Real locals — verified by phone — will see this. No bots, no scraped reviews, no sponsored answers.</span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!valid || loading}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: valid ? PALETTE.ink : PALETTE.border, color: valid ? PALETTE.paper : PALETTE.inkSoft }}
        >
          {loading && <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 900ms linear infinite" }} />}
          Send to locals
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   EDIT POST
   PATCH /posts/{id}
============================================================ */
function EditPost({ post, onBack, onSave }) {
  const [destination, setDestination] = useState(post.destination);
  const [category, setCategory] = useState(post.category);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [loading, setLoading] = useState(false);

  const valid = destination.trim() && category && title.trim() && body.trim();

  const handleSave = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      await onSave({ destination, category, title, body });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Edit post" />
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="mb-5">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase", marginBottom: 6 }}>
            Editing dispatch
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 400, fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.025em", color: PALETTE.ink }}>
            Update your{" "}
            <span style={{ fontStyle: "italic", color: PALETTE.accent }}>question.</span>
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
          placeholder="Tell us what you've already tried, what kind of answer you're looking for…"
          className="w-full bg-transparent py-2.5 mb-2 text-[14px] outline-none resize-none"
          style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
        />
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          onClick={handleSave}
          disabled={!valid || loading}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          style={{ background: valid ? PALETTE.ink : PALETTE.border, color: valid ? PALETTE.paper : PALETTE.inkSoft }}
        >
          {loading && <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 900ms linear infinite" }} />}
          Save changes
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE
   GET /users/me — re-fetched on mount to stay fresh
============================================================ */
function Profile({ user, posts, onBack, onOpen, onUpdateUser, onSignOut, initialSubscreen = null }) {
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

  // Fetch all posts → extraer respuestas propias (local) o posts propios (tourist)
  useEffect(() => {
    api
      .get("/posts/")
      .then(async (data) => {
        const allPosts = (data || []).map(mapPost);

        if (user.role === "local") {
          // Para cada post, fetch sus respuestas y filtrar las del local
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

          // Respuestas propias del local
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

          // Calcular promedio de ratings recibidos
          const rated = answersWithRatings.filter((a) => a.rating > 0);
          if (rated.length > 0) {
            const total = rated.reduce((s, a) => s + a.rating, 0);
            setAvgRating((total / rated.length).toFixed(1));
          }
        } else {
          // Tourist: posts propios con sus respuestas
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

  // Ratings dados por el turista
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
        <SettingRow label="Payment methods" />
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

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1 }}>
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-[0.18em] mt-1" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="text-[9.5px] uppercase tracking-[0.25em] whitespace-nowrap" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </div>
      <div className="h-px flex-1" style={{ background: PALETTE.border }} />
    </div>
  );
}

function SettingRow({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between py-3.5 px-1 text-left" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
      <span className="text-[14px]" style={{ color: PALETTE.ink }}>{label}</span>
      <ChevronRight size={15} strokeWidth={1.7} style={{ color: PALETTE.inkSoft }} />
    </button>
  );
}

function EmptyNote({ text }) {
  return (
    <div className="rounded-2xl p-5 text-center text-[13px]" style={{ background: PALETTE.paper, border: `1px dashed ${PALETTE.border}`, color: PALETTE.inkSoft, fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
      {text}
    </div>
  );
}

/* ============================================================
   EDIT PROFILE
   PATCH /users/me — name, city
============================================================ */
function EditProfile({ user, onBack, onSave }) {
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city === "—" ? "" : user.city);
  const [avatar, setAvatar] = useState(user.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
    const updated = await api.patch("/users/me", {
      name: name.trim(),
      city: city.trim() || null,
      avatar_url: avatar || null,
    });
      onSave(mapUser(updated));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const initials = name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Edit profile" />
      <div className="flex-1 overflow-y-auto px-6 pb-10">

        {/* Avatar */}
        <div className="flex flex-col items-center mt-4 mb-8">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: PALETTE.ink, color: PALETTE.paper, fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 500 }}
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : initials}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md active:scale-90 transition"
              style={{ background: PALETTE.accent, color: "#fff" }}
            >
              <Camera size={14} strokeWidth={2} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="mt-3 text-[10.5px] uppercase tracking-[0.2em]" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
            Tap to change photo
          </div>
        </div>

        {/* Fields */}
        <div className="mb-5">
          <div className="text-[9.5px] uppercase tracking-[0.22em] mb-2" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
            Name
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent py-2.5 text-[15px] outline-none"
            style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
            placeholder="Your name"
          />
        </div>

        <div className="mb-8">
          <div className="text-[9.5px] uppercase tracking-[0.22em] mb-2" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
            {user.role === "local" ? "Your city" : "Country / city"}
          </div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent py-2.5 text-[15px] outline-none"
            style={{ borderBottom: `1px solid ${PALETTE.border}`, color: PALETTE.ink, fontFamily: "'DM Sans', sans-serif" }}
            placeholder={user.role === "local" ? "e.g. Guadalajara, MX" : "e.g. New York, US"}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4 text-[13px]" style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep }}>
            <AlertCircle size={14} strokeWidth={1.8} />
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || loading}
          className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition flex items-center justify-center gap-2"
          style={{ background: name.trim() ? PALETTE.ink : PALETTE.border, color: name.trim() ? PALETTE.paper : PALETTE.inkSoft }}
        >
          {loading && <Loader2 size={15} strokeWidth={2} style={{ animation: "spin 900ms linear infinite" }} />}
          Save changes
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   NOTIFICATIONS
   Tourist: respuestas recibidas en sus posts
   Local: ratings recibidos en sus respuestas
============================================================ */
function Notifications({ user, myPosts, myAnswers, onBack, onOpen }) {
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

function HelpAndGuidelines({ onBack }) {
  const sections = [
    {
      title: "Be kind & respectful",
      Icon: Heart,
      body: "Treat every traveler and local with the same warmth you'd want when you're far from home. No harassment, hate speech, or personal attacks.",
    },
    {
      title: "Give honest, useful advice",
      Icon: Sparkles,
      body: "Share what you genuinely know. Outdated, fake, or sponsored recommendations without disclosure hurt real people on real trips.",
    },
    {
      title: "Keep it safe",
      Icon: Shield,
      body: "Never share personal contact details publicly or pressure anyone to meet offline. Report anything that feels off.",
    },
    {
      title: "No spam or self-promotion",
      Icon: Globe,
      body: "Organic recommendations only. Promoting your own business without disclosure, or flooding the feed, gets you removed.",
    },
  ];

  const faqs = [
    {
      q: "Can I edit or delete my posts?",
      a: "Yes — open the post, tap the three-dot menu, and choose Edit or Delete. Deletions are permanent.",
    },
    {
      q: "How does tipping work?",
      a: "Tourists can tip locals directly via PayPal as a thank-you for great advice. Mi Concierge takes no cut.",
    },
    {
      q: "I found a bug. Where do I report it?",
      a: "Email us at hello@miconcierge.app — include your role (tourist/local) and what happened.",
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar onBack={onBack} title="Help & Guidelines" />
      <div className="flex-1 overflow-y-auto px-6 pb-12">

        {/* Hero */}
        <div className="rounded-3xl p-6 mb-6" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: PALETTE.ink }}>
            A community built on{" "}
            <span style={{ fontStyle: "italic", color: PALETTE.accent }}>trust.</span>
          </div>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: PALETTE.inkSoft }}>
            Mi Concierge connects real travelers with real locals. These guidelines keep it that way.
          </p>
        </div>

        {/* Community guidelines */}
        <div className="text-[9.5px] uppercase tracking-[0.25em] mb-3" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
          Community guidelines
        </div>
        <div className="rounded-3xl overflow-hidden mb-6" style={{ border: `1px solid ${PALETTE.border}` }}>
          {sections.map(({ title, Icon, body }, i) => (
            <div
              key={i}
              className="p-5"
              style={{
                background: PALETTE.paper,
                borderBottom: i < sections.length - 1 ? `1px solid ${PALETTE.border}` : "none",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} strokeWidth={1.7} style={{ color: PALETTE.accent }} />
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 400, color: PALETTE.ink, letterSpacing: "-0.01em" }}>
                  {title}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: PALETTE.inkSoft }}>
                {body}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="text-[9.5px] uppercase tracking-[0.25em] mb-3" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
          Frequently asked
        </div>
        <div className="rounded-3xl overflow-hidden mb-8" style={{ border: `1px solid ${PALETTE.border}` }}>
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              style={{ borderBottom: i < faqs.length - 1 ? `1px solid ${PALETTE.border}` : "none", background: PALETTE.paper }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-[13.5px] pr-3" style={{ color: PALETTE.ink, fontWeight: 500 }}>{q}</span>
                <ChevronRight
                  size={15}
                  strokeWidth={1.7}
                  style={{
                    color: PALETTE.inkSoft,
                    flexShrink: 0,
                    transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 200ms ease",
                  }}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-[13px] leading-relaxed" style={{ color: PALETTE.inkSoft }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="text-center text-[11px]" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
          need more help? · hello@miconcierge.app
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TIP FLOW — PayPal two-step
   Step 1: POST /payments/tip/create-order
           Body: { amount, currency, response_id, receiver_id }
           Returns: { paypal_order_id, ... }
   Step 2: POST /payments/tip/capture/{order_id}
           Returns: TipOut with final paypal_status
============================================================ */
function TipFlow({ ctx, me, onClose, onComplete }) {
  const [step, setStep] = useState("amount"); // amount | approve | capturing | done
  const [amount, setAmount] = useState(5);
  const [custom, setCustom] = useState("");
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [error, setError] = useState(null);

  const finalAmount = custom ? Number(custom) || 0 : amount;

  const handleCreateOrder = async () => {
    if (!finalAmount || finalAmount <= 0) return;
    setError(null);
    try {
      const data = await api.post("/payments/tip/create-order", {
        amount: finalAmount,
        currency: "USD",
        response_id: ctx.response.id,
        receiver_id: ctx.response.author_id,   // required by TipCreate schema
      });
      setPaypalOrderId(data.paypal_order_id);
      setStep("approve");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCapture = async () => {
    if (!paypalOrderId) return;
    setStep("capturing");
    setError(null);
    try {
      await api.post(`/payments/tip/capture/${paypalOrderId}`);
      setStep("done");
    } catch (e) {
      setError(e.message);
      setStep("approve");
    }
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center"
      style={{ background: "rgba(26,19,12,0.55)", animation: "fadeIn 240ms ease-out" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[36px] px-6 pt-5 pb-8 relative"
        style={{ background: PALETTE.bg, animation: "slideUp 320ms cubic-bezier(.2,.9,.3,1)", maxHeight: "85%", overflow: "auto" }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: PALETTE.border }} />

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4 text-[13px]" style={{ background: PALETTE.accentSoft, color: PALETTE.accentDeep }}>
            <AlertCircle size={14} />{error}
          </div>
        )}

        {step === "amount" && (
          <>
            <div className="text-center mb-1">
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "0.25em", color: PALETTE.inkSoft, textTransform: "uppercase" }}>Tip</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1.1, marginTop: 4 }}>
                Buy{" "}
                <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                  {ctx.response.author?.name?.split(" ")[0]}
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
                  onClick={() => { setAmount(a); setCustom(""); }}
                  className="py-4 rounded-2xl text-center transition-all active:scale-95"
                  style={{
                    background: !custom && amount === a ? PALETTE.ink : PALETTE.paper,
                    color: !custom && amount === a ? PALETTE.paper : PALETTE.ink,
                    border: `1px solid ${!custom && amount === a ? PALETTE.ink : PALETTE.border}`,
                  }}
                >
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, lineHeight: 1 }}>${a}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-5" style={{ background: PALETTE.paper, border: `1px solid ${custom ? PALETTE.ink : PALETTE.border}` }}>
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
              onClick={handleCreateOrder}
              disabled={!finalAmount || finalAmount <= 0}
              className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition flex items-center justify-center gap-2"
              style={{ background: finalAmount > 0 ? "#0070BA" : PALETTE.border, color: "#fff" }}
            >
              Continue to PayPal · ${finalAmount || 0}
            </button>
            <div className="text-center text-[10px] tracking-[0.2em] uppercase mt-3" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
              Secured by PayPal · Sandbox
            </div>
          </>
        )}

        {step === "approve" && (
          <div className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#0070BA" }}>
              <span style={{ color: "#fff", fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, fontStyle: "italic" }}>P</span>
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 400, color: PALETTE.ink, letterSpacing: "-0.02em" }}>
              Approve in PayPal
            </h3>
            <p className="text-[13px] mt-2 mb-5" style={{ color: PALETTE.inkSoft }}>
              In production you'd approve on PayPal's site.<br />For sandbox, tap below to capture directly.
            </p>
            <div className="rounded-2xl p-4 text-left mb-5" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
              <Row label="To" value={ctx.response.author?.name} />
              <Row label="For" value={ctx.post.title} />
              <Row label="Amount" value={`$${finalAmount}.00`} />
              <Row label="Order ID" value={paypalOrderId || "—"} mono last />
            </div>
            <button
              onClick={handleCapture}
              className="w-full py-4 rounded-full text-[15px] font-medium active:scale-[0.98] transition"
              style={{ background: "#0070BA", color: "#fff" }}
            >
              Approve & capture
            </button>
            <button onClick={onClose} className="text-[12px] py-3 mt-1" style={{ color: PALETTE.inkSoft }}>Cancel</button>
          </div>
        )}

        {step === "capturing" && (
          <div className="text-center py-12">
            <div
              className="mx-auto w-12 h-12 rounded-full mb-5"
              style={{ border: `3px solid ${PALETTE.border}`, borderTopColor: PALETTE.accent, animation: "spin 800ms linear infinite" }}
            />
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontStyle: "italic", color: PALETTE.ink }}>
              Capturing payment…
            </div>
            <div className="text-[10px] tracking-[0.25em] uppercase mt-2" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
              POST /payments/tip/capture/{paypalOrderId}
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: PALETTE.green, color: PALETTE.paper }}>
              <Check size={28} strokeWidth={2.4} />
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400, color: PALETTE.ink, letterSpacing: "-0.02em" }}>
              ${finalAmount} sent to{" "}
              <span style={{ fontStyle: "italic", color: PALETTE.accent }}>
                {ctx.response.author?.name?.split(" ")[0]}
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
    <div className="flex justify-between items-center py-2" style={{ borderBottom: last ? "none" : `1px dashed ${PALETTE.border}` }}>
      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
      <span className="text-[13px]" style={{ color: PALETTE.ink, fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif", fontWeight: 500 }}>
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
      <div className="text-[10.5px] uppercase tracking-[0.3em]" style={{ color: PALETTE.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
        {title}
      </div>
      <div className="w-10 h-10" />
    </div>
  );
}

function TabBar({ screen, activeTab, user, onHome, onCreate, onNotifications, onProfile }) {
  const isLocal = user?.role === "local";
  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pt-3 z-30" style={{ background: `linear-gradient(to top, ${PALETTE.bg} 70%, transparent)` }}>
      <div className="flex items-center justify-between px-6 py-2 rounded-full" style={{ background: PALETTE.ink, color: PALETTE.paper }}>
        <button onClick={onHome} className="w-10 h-10 flex items-center justify-center rounded-full transition" style={{ opacity: activeTab === "feed" ? 1 : 0.5 }}>
          <Home size={18} strokeWidth={1.8} />
        </button>
        {isLocal ? (
          <button onClick={onNotifications} className="w-10 h-10 flex items-center justify-center rounded-full transition" style={{ opacity: activeTab === "notifications" ? 1 : 0.5 }}>
            <Bell size={18} strokeWidth={1.8} />
          </button>
        ) : (
          <button onClick={onCreate} className="w-12 h-12 flex items-center justify-center rounded-full active:scale-90 transition" style={{ background: PALETTE.accent, color: PALETTE.paper }}>
            <Plus size={20} strokeWidth={2} />
          </button>
        )}
        <button onClick={onProfile} className="w-10 h-10 flex items-center justify-center rounded-full transition" style={{ opacity: activeTab === "profile" ? 1 : 0.5 }}>
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
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.3; }
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