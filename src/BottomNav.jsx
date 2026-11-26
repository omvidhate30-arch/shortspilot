import React from 'react';
import {
  Home,
  BarChart2 as ChartIcon,
  Plus,
  FolderKanban,
  Settings
} from 'lucide-react';

export default function BottomNav({
  activeTab,
  setActiveTab,
  onTriggerUpload
}) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06040d] via-[#0b0718]/95 to-[#120b24]/90 backdrop-blur-xl border-t border-purple-500/30 px-3 flex items-center justify-around z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">

      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'text-pink-400 scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'drop-shadow-[0_0_8px_#ec4899]' : ''}`} />
        <span className="text-[10.5px] font-extrabold">Home</span>
      </button>

      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'analytics'
            ? 'text-cyan-400 scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <ChartIcon className="w-5 h-5" />
        <span className="text-[10.5px] font-bold">Analytics</span>
      </button>

      <div className="relative -top-5 flex flex-col items-center">
        <button
          onClick={onTriggerUpload}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[2.5px] shadow-[0_0_30px_rgba(217,70,239,0.75)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          title="Upload Video for Automation"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-500/80 via-[#2a124f] to-[#120826] flex flex-col items-center justify-center">
            <Plus className="w-7 h-7 text-white stroke-[2.5]" />
            <span className="text-[9px] font-extrabold text-white tracking-tight -mt-1">
              Upload
            </span>
          </div>
        </button>
      </div>

      <button
        onClick={() => setActiveTab('projects')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'projects'
            ? 'text-purple-400 scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <FolderKanban className="w-5 h-5" />
        <span className="text-[10.5px] font-bold">Projects</span>
      </button>

      <button
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
          activeTab === 'settings'
            ? 'text-amber-400 scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10.5px] font-bold">Settings</span>
      </button>

    </nav>
  );
}
