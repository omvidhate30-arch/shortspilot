import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, Bell, Play, TrendingUp, Eye, Trophy, Calendar,
  Sparkles, Hash, Image as ImageIcon, Clock, CheckCircle2,
  Home, BarChart2, Plus, FolderKanban, Settings, Flame, MoreVertical, Sun, Moon, Upload, Trash2, Download, Zap, Radio
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAutoPostActive, setIsAutoPostActive] = useState(true);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Load saved clips on start
  useEffect(() => {
    const saved = localStorage.getItem('sp_video_queue');
    if (saved) {
      try { setVideoQueue(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveQueueToStorage = (updated) => {
    setVideoQueue(updated);
    try {
      localStorage.setItem('sp_video_queue', JSON.stringify(updated.map(c => ({ ...c, blob: null, croppedUrl: null }))));
    } catch {}
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, idx) => {
      const clipId = Date.now() + idx;
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const newClip = {
        id: clipId,
        title: `${rawName} — Viral Short #Shorts`,
        hashtags: '#Shorts #Viral #TrendingIndia',
        status: 'published',
        views: '0',
        score: '9.8/10',
        duration: '0:15',
        time: 'Just now',
        thumbnail: URL.createObjectURL(file)
      };

      setVideoQueue((prev) => {
        const updated = [newClip, ...prev];
        saveQueueToStorage(updated);
        return updated;
      });
    });
    e.target.value = '';
  };

  const handleDeleteClip = (id) => {
    const updated = videoQueue.filter(c => c.id !== id);
    saveQueueToStorage(updated);
  };

  return (
    <div className="min-h-screen w-full bg-[#030208] text-white font-sans flex flex-col items-center justify-start pb-28 relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* MOBILE APP CONTAINER WRAPPER */}
      <div className="w-full max-w-md min-h-screen flex flex-col px-4 pt-4 pb-20 relative z-10">

        {/* --- TOP HEADER --- */}
        <header className="flex items-center justify-between mb-6">
          <button className="p-2 text-slate-300 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-purple-500/30">
                <div className="w-full h-full bg-[#080512] rounded-[11px] flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400 ml-0.5" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-pink-200 to-purple-300 bg-clip-text text-transparent">
                ShortsPilot AI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-wider">YouTube Shorts Automation</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs flex items-center gap-1 shadow-lg shadow-amber-500/20">
              <Trophy className="w-3 h-3 fill-black" /> Pro
            </button>
            <button className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] shadow-md shadow-cyan-500/30">
              <div className="w-full h-full bg-[#0c0818] rounded-full flex items-center justify-center text-xs font-bold text-cyan-300">
                🤖
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'home' && (
          <>
            {/* --- HERO AUTOMATION BANNER --- */}
            <div className="relative rounded-3xl p-6 mb-6 bg-gradient-to-r from-purple-950/70 via-[#120822] to-[#0a1226] border border-purple-500/40 shadow-2xl shadow-purple-950/50 overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileUpload} className="hidden" />

              <div className="relative z-10 max-w-[65%]">
                <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 leading-snug">
                  Automate Your YouTube <span className="text-pink-400">Shorts</span>
                </h1>
                <p className="text-[11px] text-slate-300 mb-4 leading-relaxed font-medium">
                  Upload • Auto Edit • Auto Post • Grow Faster
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-600 to-pink-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-purple-600/40 hover:scale-[1.02] transition-transform"
                >
                  <Upload className="w-4 h-4" /> Start Automation
                </button>
              </div>

              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded-2xl border border-pink-500/30 backdrop-blur-md flex items-center justify-center shadow-2xl">
                <span className="absolute top-2 right-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI</span>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-pink-500 flex items-center justify-center shadow-lg shadow-red-600/50 rotate-6">
                  <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* --- STATS GRID (4 CARDS) --- */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Play className="w-4 h-4 fill-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Posts</span>
                </div>
                <div className="text-2xl font-extrabold text-white">{247 + videoQueue.length}</div>
                <div className="text-[10px] text-slate-400">Videos Posted</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+18%</span>
                </div>
                <div className="text-2xl font-extrabold text-white">12.4K</div>
                <div className="text-[10px] text-slate-400">Subscribers</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+46%</span>
                </div>
                <div className="text-2xl font-extrabold text-white">1.8M</div>
                <div className="text-[10px] text-slate-400">Total Views</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-amber-300">Score</span>
                </div>
                <div className="text-2xl font-extrabold text-amber-300">9.8/10</div>
                <div className="text-[10px] text-slate-400">Viral Score</div>
              </div>
            </div>

            {/* --- AUTO-POST 3X / DAY SECTION --- */}
            <div className="p-4 rounded-3xl bg-[#090714] border border-purple-500/30 shadow-xl mb-6 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Auto-Post 3x / Day</h3>
                    <p className="text-[10px] text-slate-400">Your Shorts will be automatically posted at:</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAutoPostActive(!isAutoPostActive)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${isAutoPostActive ? 'bg-emerald-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${isAutoPostActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="py-2 px-2.5 rounded-xl bg-[#0d091a] border border-cyan-500/30 flex items-center justify-center gap-1.5 shadow-sm">
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-white">9:00 AM</span>
                </div>
                <div className="py-2 px-2.5 rounded-xl bg-[#0d091a] border border-amber-500/30 flex items-center justify-center gap-1.5 shadow-sm">
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-bold text-white">2:00 PM</span>
                </div>
                <div className="py-2 px-2.5 rounded-xl bg-[#0d091a] border border-purple-500/30 flex items-center justify-center gap-1.5 shadow-sm">
                  <Moon className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span className="text-[11px] font-bold text-white">7:30 PM</span>
                </div>
              </div>
            </div>

            {/* --- 4 TOOL CARDS GRID --- */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-2xl bg-[#090714] border border-purple-900/40 hover:border-purple-500/50 transition-all cursor-pointer flex flex-col justify-between h-24 shadow-lg group">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    AI Edit <span className="text-slate-500">›</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">(Auto Cut & Caption)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090714] border border-cyan-900/40 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between h-24 shadow-lg group">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    Smart Hashtags <span className="text-slate-500">›</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">(Trending)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090714] border border-pink-900/40 hover:border-pink-500/50 transition-all cursor-pointer flex flex-col justify-between h-24 shadow-lg group">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    Thumbnail Generator <span className="text-slate-500">›</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#090714] border border-teal-900/40 hover:border-teal-500/50 transition-all cursor-pointer flex flex-col justify-between h-24 shadow-lg group">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    Content Schedule <span className="text-slate-500">›</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RECENT POSTS SECTION --- */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-extrabold text-white">Recent & Uploaded Posts</h3>
                </div>
                <span className="text-xs font-bold text-cyan-400">{videoQueue.length + 1} Total</span>
              </div>

              {/* Uploaded Video List */}
              {videoQueue.map((clip) => (
                <div key={clip.id} className="p-3 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                      <video src={clip.thumbnail} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-white truncate">{clip.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{clip.hashtags}</p>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-Scheduled
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDeleteClip(clip.id)} className="text-slate-500 hover:text-rose-400 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Default Demo Post */}
              <div className="p-3 rounded-2xl bg-[#090714] border border-purple-900/40 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&auto=format&fit=crop&q=80"
                      alt="Pune"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                    <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 rounded text-white font-mono">0:28</span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-white truncate">Hidden Places in Pune 🌱</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Posted: Today, 9:00 AM</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Published
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#0d091a] border border-amber-500/30 text-right">
                    <div className="text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-amber-400" /> Viral Score
                    </div>
                    <div className="text-xs font-extrabold text-white">9.8/10</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="py-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Analytics & View Velocity</h2>
            <div className="p-4 rounded-2xl bg-[#090714] border border-purple-900/40">
              <div className="text-xs text-slate-400">Total Views This Month</div>
              <div className="text-2xl font-extrabold text-cyan-400">1,842,900</div>
              <div className="text-[11px] text-emerald-400 mt-1">↑ 46% higher than last month</div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="py-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Automation Projects</h2>
            <div className="p-4 rounded-2xl bg-[#090714] border border-purple-900/40 text-xs text-slate-300">
              Active Pipeline: 3x Daily Auto-Posting Enabled on YouTube Channel.
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="py-6 space-y-4">
            <h2 className="text-lg font-bold text-white">App Settings</h2>
            <div className="p-4 rounded-2xl bg-[#090714] border border-purple-900/40 text-xs text-slate-300 space-y-2">
              <div>YouTube OAuth: Connected</div>
              <div>Plan: Yearly VIP Pro</div>
            </div>
          </div>
        )}

      </div>

      {/* --- FIXED BOTTOM NAVIGATION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#06040e]/95 backdrop-blur-md border-t border-purple-950 px-4 py-2 flex items-center justify-around max-w-md mx-auto shadow-2xl">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${activeTab === 'home' ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${activeTab === 'analytics' ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Analytics</span>
        </button>

        {/* Floating Upload Button */}
        <div className="relative -top-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-600 to-pink-500 p-0.5 shadow-xl shadow-purple-600/50 hover:scale-105 transition-transform flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-[#06040e] flex items-center justify-center">
              <Plus className="w-7 h-7 text-white" />
            </div>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${activeTab === 'projects' ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${activeTab === 'settings' ? 'text-pink-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>

    </div>
  );
}
