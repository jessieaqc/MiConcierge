import React, { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { PALETTE, CATEGORIES } from "../lib/constants";
import TopBar from "../components/TopBar";
import Label from "../components/Label";
import Input from "../components/Input";

export default function NewPost({ onBack, onSubmit, onError }) {
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("food");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = destination.trim() && title.trim() && body.trim();

  const handleSubmit = async () => {
    if (loading) return;
    if (!destination.trim()) { onError("Please enter a destination city."); return; }
    if (destination.trim().length < 2) { onError("Destination must be at least 2 characters."); return; }
    if (!title.trim()) { onError("Please add a headline for your question."); return; }
    if (title.trim().length < 5) { onError("Headline must be at least 5 characters."); return; }
    if (!body.trim()) { onError("Please add some detail to your question."); return; }
    if (body.trim().length < 10) { onError("Add a bit more detail — at least 10 characters."); return; }
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
          disabled={loading}
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
