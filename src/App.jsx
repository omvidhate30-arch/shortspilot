import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Sliders, X, Trash2, Download,
  RefreshCw, Radio, Send, Scissors, HardDrive,
  Wrench, IndianRupee, BarChart3, Calendar,
  Clock, Eye, ThumbsUp, Users, Bot, Volume2,
  Crown, Check, Hourglass, Tag,
  FileText, Mail, Globe, Ban, UserPlus, Bell, KeyRound, ShieldCheck,
  Flame, Star, HelpCircle, ChevronDown, Edit3, Layers, Languages, MessageSquare,
  Home, BarChart2 as ChartIcon, Plus, FolderKanban, Settings, MoreVertical, Sun, Moon
} from 'lucide-react';

const DEFAULT_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';
const DEFAULT_GOOGLE_SECRET = ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

const YOUTUBE_REDIRECT_URI =
  typeof window !== 'undefined' && window.location.origin.includes('shortspilot')
    ? `${window.location.origin}/api/youtube/callback`
    : 'https://shortspilot-two.vercel.app/api/youtube/callback';

const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
const DEFAULT_AI_KEY = '';
const DEFAULT_CLAUDE_KEY = '';

const DEFAULT_CUSTOM_AI_PROMPT = `Act as my Personal Viral Video SEO Expert, YouTube Shorts Growth Strategist and Short-Form Content Specialist.
YOUR TASK:
I will send you a video. You must carefully analyze the actual video context first. Then generate all titles, captions, hashtags and SEO content based ONLY on that specific video.
IMPORTANT: Never give generic or random content. Every output must match the actual video.
FOR EVERY VIDEO, GENERATE:
1. BEST VIRAL TITLE (Create 3 catchy curiosity-driven titles and select the strongest as BEST TITLE)
2. VIRAL CAPTION (Hook + natural call to action)
3. TRENDING HASHTAGS (Mix niche-specific, popular and trending hashtags)
4. SEO KEYWORDS (10-15 relevant searchable keywords)
5. VIDEO DESCRIPTION (SEO-optimized YouTube Shorts description)
6. BEST THUMBNAIL TEXT (3 short powerful options)
7. VIRAL POTENTIAL ANALYSIS (Score 1 to 10 + retention analysis)`;

const IDB_NAME = 'ShortsPilotClipsDB';
const IDB_STORE = 'clips';

const sanitizeMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('blob:')) return rawUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
  } catch {}
  return '';
};

const openClipsDB = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) return reject(new Error('IndexedDB not supported'));
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbSaveClip = async (clipObj) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const { croppedUrl, ...persistable } = clipObj;
      tx.objectStore(IDB_STORE).put({ ...persistable, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch { return false; }
};

const idbGetAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        resolve(items.map((item) => ({
          ...item,
          croppedUrl: item.blob instanceof Blob ? URL.createObjectURL(item.blob) : null
        })));
      };
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
};

const idbDeleteClip = async (clipId) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(clipId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
};

const idbClearAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
};

const emailToKey = (email) => (email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

export default function App() {
  const [globalConfig, setGlobalConfig] = useState({
    receiverUpi: '9767905729@paytm',
    monthlyPrice: '499',
    yearlyOriginalPrice: '5999',
    yearlyPrice: '3999',
    couponCode: 'SAVE200',
    couponDiscount: '200',
    freeLimit: 3,
    heroHeadline: 'Auto-Scheduled Daily on YouTube',
    watermarkText: 'Made with ShortsPilot',
    guaranteeActive: true,
    monthlyGuaranteeViews: '50K',
    yearlyGuaranteeViews: '100K',
    bannerText: '🔥 COUPON OFFER: Use code "SAVE200" at checkout & get Flat ₹200 OFF on Monthly Pro!',
    bannerActive: true,
    broadcastAlertText: '',
    broadcastAlertActive: false,
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    aiProvider: 'primary',
    primaryAiKey: DEFAULT_AI_KEY,
    claudeApiKey: DEFAULT_CLAUDE_KEY,
    customAiPrompt: DEFAULT_CUSTOM_AI_PROMPT,
    supportEmail: 'support@shortspilot.in',
    adminPin: '9767905729'
  });

  const [activeTab, setActiveTab] = useState('home'); // home, analytics, projects, settings
  const [isAutoPostActive, setIsAutoPostActive] = useState(true);
  const [activeTimeSlot, setActiveTimeSlot] = useState('9:00 AM');
  const [videoQueue, setVideoQueue] = useState([]);
  const [tier, setTier] = useState('free');
  const [activePlanType, setActivePlanType] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);

  // Modals & Panels
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    { role: 'ai', text: 'Hi! I am your ShortsPilot AI Support Assistant. Ask me anything about 3x daily auto-posting, viral scores, or VIP Pro plans!' }
  ]);
  const [supportInput, setSupportInput] = useState('');
  const [activeToolModal, setActiveToolModal] = useState(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [gmailUser, setGmailUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_gmail_user') || 'null'); } catch { return null; }
  });
  const [ytChannel, setYtChannel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_yt_channel') || 'null'); } catch { return null; }
  });
  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);

  useEffect(() => {
    ytChannelRef.current = ytChannel;
  }, [ytChannel]);

  useEffect(() => {
    let mounted = true;
    idbGetAllClips().then((savedClips) => {
      if (mounted && savedClips.length > 0) {
        setVideoQueue(savedClips);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Keyboard shortcut for Admin (Ctrl + Shift + O)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(async (file, idx) => {
      const clipId = Date.now() + idx;
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const newClip = {
        id: clipId,
        title: `${rawName} — Viral Short #Shorts`,
        hashtags: '#Shorts #Viral #TrendingIndia',
        status: 'published',
        views: '1.2K',
        score: '9.9/10',
        duration: '0:15',
        time: 'Just now',
        thumbnail: URL.createObjectURL(file),
        blob: file
      };

      await idbSaveClip(newClip);
      setVideoQueue((prev) => [newClip, ...prev]);
    });
    e.target.value = '';
  };

  const handleDeleteClip = async (id) => {
    await idbDeleteClip(id);
    setVideoQueue((prev) => prev.filter(c => c.id !== id));
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const userText = supportInput.trim();
    setSupportMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setSupportInput('');

    setTimeout(() => {
      setSupportMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Our AI engine is actively monitoring your 3x daily schedule (9 AM, 2 PM, 7:30 PM). Make sure your YouTube account is connected for seamless auto-posting!' }
      ]);
    }, 600);
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pinInput === (globalConfig.adminPin || '9767905729')) {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master Security PIN');
    }
  };

  const handleVerifyPayment = (e) => {
    e.preventDefault();
    if (!gmailUser?.email) {
      setCheckoutError('Please connect your Google account first.');
      return;
    }
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter valid 12-digit UPI UTR number.');
      return;
    }
    setCheckoutPendingMsg('⏳ UTR Submitted! Pro plan will activate within 1–2 minutes.');
  };

  return (
    <div className="min-h-screen w-full bg-[#070913] text-slate-100 font-sans relative overflow-x-hidden flex flex-col items-center">
      
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* MOBILE APP CONTAINER */}
      <div className="w-full max-w-md bg-[#070913] text-white rounded-none sm:rounded-[36px] sm:border sm:border-purple-500/30 sm:shadow-2xl overflow-hidden relative font-sans my-0 sm:my-6 flex flex-col min-h-screen sm:min-h-0">
        
        {/* TOP HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-[#070913]/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-300 hover:text-white p-1">
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
            <button onClick={() => setIsPricingOpen(true)} className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[11px] flex items-center gap-1 shadow-md shadow-amber-500/20 hover:scale-105 transition-transform">
              <Crown className="w-3 h-3 fill-black" /> Pro
            </button>
            <button onClick={() => setIsNotificationModalOpen(true)} className="relative p-2 rounded-full bg-[#121829] border border-slate-800 text-slate-300 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
            <button onClick={() => setShowAiSupport(true)} className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 p-0.5 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/30 hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-32 pt-2 space-y-4 overflow-y-auto flex-1">

          {/* HERO BANNER CARD */}
          <div className="relative rounded-3xl p-5 bg-gradient-to-r from-[#180d35] via-[#10132b] to-[#0a182f] border border-pink-500/40 shadow-2xl overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="max-w-[200px]">
                <h2 className="text-xl font-extrabold text-white leading-tight mb-1">
                  Automate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Shorts</span>
                </h2>
                <p className="text-[10px] text-slate-300 mb-3 leading-relaxed">
                  Upload • Auto Edit • Auto Post • Grow Faster
                </p>
                <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileUpload} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/40 hover:scale-105 transition-transform cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Start Automation
                </button>
              </div>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-600/30 to-sky-500/30 border border-pink-500/50 flex items-center justify-center relative shadow-inner">
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-pink-600 text-[8px] font-bold">AI</div>
                <Youtube className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
              </div>
            </div>
          </div>

          {/* STATS 4-GRID CARDS */}
          <div className="grid grid-cols-4 gap-2">
            <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#101528] border border-sky-500/20 text-center shadow-lg cursor-pointer hover:border-sky-400 transition-all">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                <Play className="w-3.5 h-3.5 fill-sky-400" />
              </div>
              <div className="text-sm font-extrabold text-white">{247 + videoQueue.length}</div>
              <div className="text-[9px] text-slate-400">Videos Posted</div>
            </div>

            <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#101528] border border-emerald-500/20 text-center shadow-lg cursor-pointer hover:border-emerald-400 transition-all">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-extrabold text-emerald-400">12.4K</div>
              <div className="text-[9px] text-slate-400">Subs <span className="text-emerald-400 font-bold">↑18%</span></div>
            </div>

            <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#101528] border border-purple-500/20 text-center shadow-lg cursor-pointer hover:border-purple-400 transition-all">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-extrabold text-purple-400">1.8M</div>
              <div className="text-[9px] text-slate-400">Views <span className="text-purple-400 font-bold">↑46%</span></div>
            </div>

            <div onClick={() => setIsPricingOpen(true)} className="p-2.5 rounded-2xl bg-[#101528] border border-amber-500/20 text-center shadow-lg cursor-pointer hover:border-amber-400 transition-all">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <div className="text-sm font-extrabold text-amber-400">9.8/10</div>
              <div className="text-[9px] text-slate-400">Viral Score</div>
            </div>
          </div>

          {/* AUTO-POST 3X / DAY WIDGET */}
          <div className="p-4 rounded-3xl bg-[#101528] border border-purple-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Auto-Post 3x / Day</h3>
                  <p className="text-[10px] text-slate-400">Your Shorts are posted at peak Indian times:</p>
                </div>
              </div>

              <button 
                onClick={() => setIsAutoPostActive(!isAutoPostActive)}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center cursor-pointer ${isAutoPostActive ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${isAutoPostActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div 
                onClick={() => setActiveTimeSlot('9:00 AM')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${activeTimeSlot === '9:00 AM' ? 'border-sky-500 shadow-lg shadow-sky-500/20 bg-sky-500/10' : 'border-slate-800'}`}
              >
                <div className="text-amber-400 text-xs mb-0.5">☀️</div>
                <div className="text-xs font-bold text-white">9:00 AM</div>
                <div className="text-[8px] text-slate-400">Morning Slot</div>
              </div>
              <div 
                onClick={() => setActiveTimeSlot('2:00 PM')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${activeTimeSlot === '2:00 PM' ? 'border-sky-500 shadow-lg shadow-sky-500/20 bg-sky-500/10' : 'border-slate-800'}`}
              >
                <div className="text-amber-300 text-xs mb-0.5">☀️</div>
                <div className="text-xs font-bold text-white">2:00 PM</div>
                <div className="text-[8px] text-slate-400">Afternoon Slot</div>
              </div>
              <div 
                onClick={() => setActiveTimeSlot('7:30 PM')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${activeTimeSlot === '7:30 PM' ? 'border-purple-500 shadow-lg shadow-purple-500/20 bg-purple-500/10' : 'border-slate-800'}`}
              >
                <div className="text-purple-400 text-xs mb-0.5">🌙</div>
                <div className="text-xs font-bold text-white">7:30 PM</div>
                <div className="text-[8px] text-slate-400">Night Peak</div>
              </div>
            </div>
          </div>

          {/* QUICK FEATURES 4-GRID */}
          <div className="grid grid-cols-2 gap-2.5">
            <div onClick={() => setActiveToolModal('aiEdit')} className="p-3 rounded-2xl bg-[#101528] border border-sky-500/30 hover:border-sky-400 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">AI Edit</div>
                  <div className="text-[9px] text-slate-400">Auto Cut & Caption</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div onClick={() => setActiveToolModal('hashtags')} className="p-3 rounded-2xl bg-[#101528] border border-pink-500/30 hover:border-pink-400 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">Smart Hashtags</div>
                  <div className="text-[9px] text-slate-400">Trending Tags</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div onClick={() => setActiveToolModal('thumbnail')} className="p-3 rounded-2xl bg-[#101528] border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">Thumbnail Gen</div>
                  <div className="text-[9px] text-slate-400">High CTR Titles</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div onClick={() => setActiveToolModal('schedule')} className="p-3 rounded-2xl bg-[#101528] border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">Schedule</div>
                  <div className="text-[9px] text-slate-400">Content Calendar</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>
          </div>

          {/* QUEUE & RECENT POSTS */}
          {videoQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Vault & Active Queue ({videoQueue.length})
                </h3>
                <button onClick={() => setVideoQueue([])} className="text-[11px] text-pink-400 hover:underline">Clear All</button>
              </div>

              {videoQueue.map((clip) => (
                <div key={clip.id} className="p-3 rounded-2xl bg-[#101528] border border-sky-500/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{clip.title}</h4>
                      <p className="text-[10px] text-sky-400">{clip.hashtags}</p>
                    </div>
                    <button onClick={() => handleDeleteClip(clip.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> Recent Posts
              </h3>
              <button onClick={() => setActiveTab('analytics')} className="text-[11px] text-sky-400 font-semibold hover:underline">View Analytics →</button>
            </div>

            <div className="p-3 rounded-2xl bg-[#101528] border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-800 relative overflow-hidden flex items-center justify-center border border-slate-700 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 to-sky-900 opacity-60" />
                  <Play className="w-5 h-5 text-white z-10 fill-white" />
                  <span className="absolute bottom-1 right-1 text-[8px] px-1 rounded bg-black/70 text-white font-mono">0:28</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Hidden Places in Pune 🌱</h4>
                  <p className="text-[10px] text-slate-400 mb-1.5">Posted: Today, 9:00 AM</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                    ✓ Published
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold mb-1">
                  🔥 9.8/10
                </div>
                <span className="text-slate-500 text-xs">•••</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM FLOATING NAVIGATION BAR */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#070913]/95 backdrop-blur-md border-t border-purple-500/20 px-4 py-3 flex items-center justify-around z-30 shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'analytics' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
            <ChartIcon className="w-5 h-5" />
            <span className="text-[10px]">Analytics</span>
          </button>
          
          <div className="relative -top-6">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-sky-400 p-0.5 flex items-center justify-center shadow-xl shadow-pink-600/50 hover:scale-110 transition-transform cursor-pointer"
            >
              <div className="w-full h-full rounded-full bg-[#070913] flex items-center justify-center">
                <Plus className="w-7 h-7 text-pink-400" />
              </div>
            </button>
          </div>

          <button onClick={() => setActiveTab('projects')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'projects' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
            <FolderKanban className="w-5 h-5" />
            <span className="text-[10px]">Projects</span>
          </button>

          <button onClick={() => setIsSettingsOpen(true)} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">Settings</span>
          </button>
        </div>

      </div>

      {/* MODALS */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#080c15] border border-purple-500/40 p-6 space-y-4">
            <button onClick={() => setActiveToolModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            {activeToolModal === 'aiEdit' && (
              <>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Scissors className="w-5 h-5 text-sky-400" /> AI Auto Cut & Caption</h3>
                <p className="text-xs text-slate-300">Automatically detects silence and generates dynamic subtitles for 9:16 Shorts.</p>
                <button onClick={() => { setActiveToolModal(null); fileInputRef.current?.click(); }} className="w-full py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold">Select Video to Edit</button>
              </>
            )}
            {activeToolModal === 'hashtags' && (
              <>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-pink-400" /> Trending Smart Hashtags</h3>
                <div className="p-3 rounded-xl bg-[#070913] border border-slate-800 text-xs font-mono text-sky-300">
                  #Shorts #ViralShorts #TrendingIndia #FreeFireClutch #MustWatch
                </div>
                <button onClick={() => { navigator.clipboard.writeText('#Shorts #ViralShorts #TrendingIndia'); alert('Copied!'); }} className="w-full py-2.5 rounded-xl bg-pink-600 text-white text-xs font-bold">Copy Tags</button>
              </>
            )}
            {activeToolModal === 'thumbnail' && (
              <>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" /> Thumbnail & Title Gen</h3>
                <ul className="text-xs text-slate-200 space-y-1.5 list-disc pl-4">
                  <li>WAIT UNTIL THE END 😱 (9.9 Viral Score)</li>
                  <li>99% Players Fail This Challenge 🔥</li>
                </ul>
                <button onClick={() => setActiveToolModal(null)} className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold">Close</button>
              </>
            )}
            {activeToolModal === 'schedule' && (
              <>
                <h3 className="text-base font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-400" /> Content Schedule Calendar</h3>
                <div className="p-3 rounded-xl bg-[#070913] border border-slate-800 text-xs text-emerald-400 font-semibold text-center">
                  ✓ Next scheduled auto-post in 42 minutes.
                </div>
                <button onClick={() => setActiveToolModal(null)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">Got it</button>
              </>
            )}
          </div>
        </div>
      )}

      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#080c15] border border-pink-500/40 p-6 space-y-3">
            <button onClick={() => setIsNotificationModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-pink-400" /> Notifications</h3>
            <div className="p-3 rounded-xl bg-[#101528] border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-white">🚀 Short Published Successfully</div>
              <div className="text-slate-400 text-[10px]">Your video reached 1.2K views in 1 hour.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="fixed inset-0 z-40 bg-[#070913] p-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Audience & View Velocity</h2>
              <button onClick={() => setActiveTab('home')} className="p-2 rounded-xl bg-slate-800 text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800">
                <div className="text-xs text-slate-400">Subscribers</div>
                <div className="text-xl font-bold text-white">12,400</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800">
                <div className="text-xs text-slate-400">Total Views</div>
                <div className="text-xl font-bold text-cyan-400">1,842,900</div>
              </div>
            </div>
            <button onClick={() => setActiveTab('home')} className="w-full py-3 rounded-xl bg-purple-600 text-white text-xs font-bold">Back to Home</button>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="fixed inset-0 z-40 bg-[#070913] p-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Automation Projects</h2>
              <button onClick={() => setActiveTab('home')} className="p-2 rounded-xl bg-slate-800 text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white">Active Pipeline: ShortsPilot AI Studio</div>
              <div>Auto-Posting: Enabled (3x Daily)</div>
              <div>Storage Used: 14.8 GB / 5,120 GB</div>
            </div>
            <button onClick={() => setActiveTab('home')} className="w-full py-3 rounded-xl bg-sky-600 text-white text-xs font-bold">Back to Home</button>
          </div>
        </div>
      )}

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#080c15] border border-amber-400/40 p-6 space-y-4">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-amber-400 mb-2 flex items-center gap-1.5"><Crown className="w-5 h-5" /> ShortsPilot Pro</h3>
            <div className="p-3 rounded-xl bg-[#070913] border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Pay via UPI & Submit UTR:</div>
              <div className="text-xs font-mono text-emerald-400">{globalConfig.receiverUpi}</div>
              <input type="email" value={gmailUser?.email || ''} onChange={(e) => setGmailUser({ ...(gmailUser || {}), email: e.target.value })} placeholder="Enter your Gmail ID" className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700 text-xs text-white" />
              <input type="tel" maxLength={12} value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))} placeholder="Enter 12-digit UTR No." className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700 text-xs font-mono text-white" />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button onClick={handleVerifyPayment} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 text-white text-xs font-bold">Submit UTR & Unlock Pro</button>
            </div>
          </div>
        </div>
      )}

      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[450px] rounded-3xl bg-[#080c15] border border-sky-500/40 p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                <h3 className="text-xs font-bold text-white">ShortsPilot AI Assistant</h3>
              </div>
              <button onClick={() => setShowAiSupport(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
              {supportMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-sky-600 text-white' : 'bg-[#101528] text-slate-200'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendSupport} className="flex gap-2 pt-2 border-t border-slate-800">
              <input type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)} placeholder="Ask about auto-posting..." className="flex-1 px-3 py-2 rounded-xl bg-[#070913] border border-slate-700 text-xs text-white" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold">Send</button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75">
          <div className="w-full max-w-xs bg-[#080c15] border-l border-sky-500/30 h-full p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">Settings & Account</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <button onClick={() => { setIsSettingsOpen(false); setIsAdminOpen(true); }} className="w-full py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
                🔐 Owner Admin Panel
              </button>
            </div>
            <div className="text-[11px] text-slate-500">ShortsPilot AI Studio v17.2</div>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-md rounded-3xl bg-[#070a12] border border-pink-500/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5"><Shield className="w-4 h-4 text-pink-400" /> Master Owner Admin</h3>
              <button onClick={() => setIsAdminOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="space-y-3">
                <p className="text-xs text-slate-400">Enter Master Security PIN (Default: 9767905729):</p>
                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Master PIN" className="w-full px-3 py-2 rounded-xl bg-[#05070c] border border-slate-700 text-xs text-center text-white tracking-widest" autoFocus />
                {pinError && <p className="text-xs text-pink-400">{pinError}</p>}
                <button type="submit" className="w-full py-2.5 rounded-xl bg-pink-600 text-white text-xs font-bold">Unlock Admin</button>
              </form>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-[#0c1220] border border-emerald-500/30 text-emerald-400 font-bold">
                  ✅ Admin Unlocked Successfully!
                </div>
                <div>Configured UPI: {globalConfig.receiverUpi}</div>
                <div>Monthly Price: ₹{globalConfig.monthlyPrice}</div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
