import React, { useState } from "react";
import { Compass, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { PALETTE } from "../lib/constants";
import { api, setToken } from "../lib/api";
import { mapUser } from "../lib/helpers";
import RoleCard from "../components/RoleCard";
import Label from "../components/Label";
import Input from "../components/Input";

export default function Auth({ onAuth, initialMode = "register" }) {
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

    if (mode === "register") {
      if (!name.trim()) { setError("Please enter your name."); return; }
      if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
      if (role === "local" && !city.trim()) { setError("Locals must enter their city."); return; }
    }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("That doesn't look like a valid email."); return; }
    if (!password) { setError("Please enter a password."); return; }
    if (mode === "register" && password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", {
          name,
          email,
          password,
          role,
          city: city || null,
        });
      }

      const tokenData = await api.post("/auth/login", { email, password });
      setToken(tokenData.access_token);

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
