import React from 'react';
import { Sparkles, Crown, Bell, Bot, Menu } from 'lucide-react';

export default function Header({ onOpenSettings, onOpenPricing, onOpenNotifications, onOpenSupport }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-[#070913]/90 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button onClick={onOpenSettings} className="text-slate-300 hover:text-white p-1 cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-sky-400 p-[1px] flex items-center justify-center shadow-lg shadow-pink-500/30">
            <div className="w-full h-full bg-[#070913] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-pink-200 to-sky-300 bg-clip-text text-transparent leading-none">
              ShortsPilot AI
            </h1>
            <p className="text-[9px] text-slate-400">YouTube Shorts Automation</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button onClick={onOpenPricing} className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[11px] flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer">
          <Crown className="w-3 h-3 fill-black" /> Pro
        </button>
        <button onClick={onOpenNotifications} className="relative p-2 rounded-full bg-[#121829] border border-slate-800 text-slate-300 hover:text-white cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        </button>
        <button onClick={onOpenSupport} className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 p-0.5 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/30">
          <Bot className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
