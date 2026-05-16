import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { PALETTE } from "./lib/constants";
import { loadStoredToken, setToken, api } from "./lib/api";
import { mapUser, mapPost, mapResponse } from "./lib/helpers";

import Welcome from "./screens/Welcome";
import Auth from "./screens/Auth";
import Feed from "./screens/Feed";
import PostDetail from "./screens/PostDetail";
import NewPost from "./screens/NewPost";
import EditPost from "./screens/EditPost";
import Profile from "./screens/Profile";

import TabBar from "./components/TabBar";
import TipFlow from "./components/TipFlow";
import Grain from "./components/Grain";
import FontStyles from "./components/FontStyles";

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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAuth = (mappedUser) => {
    setUser(mappedUser);
    setScreen("feed");
    setHistory([]);
  };

  const handleNewPost = async (postData) => {
    try {
      const created = await api.post("/posts/", {
        title: postData.title,
        content: postData.body,
        city: postData.destination,
        category: postData.category,
      });
      setPosts((p) => [mapPost(created), ...p]);
      setScreen("feed");
      setHistory([]);
      showToast("Posted. Locals will see it shortly.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

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
      showToast(e.message, "error");
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((ps) => ps.filter((p) => p.id !== postId));
      setScreen("feed");
      setHistory([]);
      showToast("Post deleted.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

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
      showToast(e.message, "error");
    }
  };

  const handleRate = async (postId, responseId, stars) => {
    try {
      try {
        await api.post("/ratings/", { response_id: responseId, score: stars });
      } catch (e) {
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
      showToast(e.message, "error");
    }
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
                onError={(msg) => showToast(msg, "error")}
              />
            )}
            {screen === "new" && <NewPost onBack={goBack} onSubmit={handleNewPost} onError={(msg) => showToast(msg, "error")} />}
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
                background: toast.type === "error" ? PALETTE.accentDeep : PALETTE.ink,
                color: PALETTE.paper,
                fontFamily: "'DM Sans', sans-serif",
                animation: "toastIn 240ms cubic-bezier(.2,.9,.3,1.2)",
                whiteSpace: "nowrap",
                maxWidth: "85%",
              }}
            >
              {toast.type === "error"
                ? <AlertCircle size={14} />
                : <Check size={14} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{toast.msg}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
