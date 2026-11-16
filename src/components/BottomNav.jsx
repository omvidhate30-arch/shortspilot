import React from 'react';
import { Home, BarChart2 as ChartIcon, FolderKanban, Settings, Plus } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenUpload, onOpenSettings }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#070913]/95 backdrop-blur-md border-t border-purple-500/20 px-4 py-3 flex items-center justify-around z-30 shadow-2xl">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
        <Home className="w-5 h-5" /><span className="text-[10px]">Home</span>
      </button>
      <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'analytics' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
        <ChartIcon className="w-5 h-5" /><span className="text-[10px]">Analytics</span>
      </button>
      <div className="relative -top-6">
        <button onClick={onOpenUpload} className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-sky-400 p-0.5 flex items-center justify-center shadow-xl shadow-pink-600/50 hover:scale-110 transition-transform cursor-pointer">
          <div className="w-full h-full rounded-full bg-[#070913] flex items-center justify-center"><Plus className="w-7 h-7 text-pink-400" /></div>
        </button>
      </div>
      <button onClick={() => setActiveTab('projects')} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'projects' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
        <FolderKanban className="w-5 h-5" /><span className="text-[10px]">Projects</span>
      </button>
      <button onClick={onOpenSettings} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
        <Settings className="w-5 h-5" /><span className="text-[10px]">Settings</span>
      </button>
    </div>
  );
}
