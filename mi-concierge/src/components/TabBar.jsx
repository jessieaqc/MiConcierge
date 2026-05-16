import React from "react";
import { Home, Bell, Plus, User } from "lucide-react";
import { PALETTE } from "../lib/constants";

export default function TabBar({ screen, activeTab, user, onHome, onCreate, onNotifications, onProfile }) {
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
