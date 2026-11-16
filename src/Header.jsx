import React from 'react';
import { Menu, Crown, Bell, Bot } from 'lucide-react';

export function ShortsPilotLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="spGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M16 10L52 32L16 54V10Z" stroke="url(#spGrad)" strokeWidth="5" strokeLinejoin="round" fill="rgba(236,72,153,0.15)" />
      <path d="M28 22L42 32L28 42V22Z" fill="url(#spGrad)" />
    </svg>
  );
}

export default function Header({
  tier,
  hasUnreadNotifications,
  gmailUser,
  onOpenDrawer,
  onGoHome,
  onOpenPricing,
  onOpenNotifications,
  onOpenSupport
}) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-[#070510]/90 backdrop-blur-md sticky top-0 z-30 border-b border-purple-500/10">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDrawer}
          className="p-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Open Menu & Settings"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(236,72,153,0.45)] flex items-center justify-center">
            <div className="w-full h-full bg-[#090614] rounded-[14px] flex items-center justify-center">
              <ShortsPilotLogo className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center text-[17px] font-extrabold tracking-tight leading-none">
              <span className="text-white">Shorts</span>
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Pilot AI</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">YouTube Shorts Automation</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPricing}
          className="px-3 py-1 rounded-full bg-[#1a1308] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{tier === 'pro' ? 'VIP' : 'Pro'}</span>
        </button>

        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-[#120d24] border border-purple-500/30 text-slate-200 hover:text-white hover:border-purple-400 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
          )}
        </button>

        <button
          onClick={onOpenSupport}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 p-[2px] shadow-[0_0_15px_rgba(56,189,248,0.45)] hover:scale-105 transition-transform cursor-pointer"
          title="AI Assistant & Support"
        >
          <div className="w-full h-full rounded-full bg-[#0a0818] flex items-center justify-center relative overflow-hidden">
            {gmailUser?.picture ? (
              <img src={gmailUser.picture} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Bot className="w-5 h-5 text-cyan-300" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
