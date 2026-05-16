import React, { useState } from "react";
import { Heart, Sparkles, Shield, Globe, ChevronRight } from "lucide-react";
import { PALETTE } from "../lib/constants";
import TopBar from "../components/TopBar";

export default function HelpAndGuidelines({ onBack }) {
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

        <div className="rounded-3xl p-6 mb-6" style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.border}` }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1, color: PALETTE.ink }}>
            A community built on{" "}
            <span style={{ fontStyle: "italic", color: PALETTE.accent }}>trust.</span>
          </div>
          <p className="text-[13px] mt-3 leading-relaxed" style={{ color: PALETTE.inkSoft }}>
            Mi Concierge connects real travelers with real locals. These guidelines keep it that way.
          </p>
        </div>

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

        <div className="text-center text-[11px]" style={{ color: PALETTE.inkFaint, fontFamily: "'JetBrains Mono', monospace" }}>
          need more help? · hello@miconcierge.app
        </div>
      </div>
    </div>
  );
}
