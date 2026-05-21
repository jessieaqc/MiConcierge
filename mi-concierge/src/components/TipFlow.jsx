import React, { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { PALETTE } from "../lib/constants";
import { api } from "../lib/api";
import Row from "./Row";

export default function TipFlow({ ctx, me, onClose, onComplete }) {
  const [step, setStep] = useState("amount");
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
      receiver_id: ctx.response.author_id,
    });
    setPaypalOrderId(data.paypal_order_id);

    // Open PayPal approval page automatically
    const approveLink = data.links.find(l => l.rel === "approve");
    if (approveLink) {
      window.open(approveLink.href, "_blank");
    }

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
      await api.post(`/payments/tip/capture/${paypalOrderId}?response_id=${ctx.response.id}&receiver_id=${ctx.response.author_id}&amount=${finalAmount}&currency=USD`);
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
