import React, { useState, useRef } from "react";
import { Camera, AlertCircle, Loader2 } from "lucide-react";
import { PALETTE } from "../lib/constants";
import { api } from "../lib/api";
import { mapUser } from "../lib/helpers";
import TopBar from "../components/TopBar";

export default function EditProfile({ user, onBack, onSave }) {
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
