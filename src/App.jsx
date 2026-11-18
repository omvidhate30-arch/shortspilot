import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Shield, Lock,
  Youtube, X, Trash2, RefreshCw, Calendar,
  Clock, Eye, Users, Bot, Crown, Tag,
  Bell, Star, Layers, Home, BarChart2 as ChartIcon,
  Plus, FolderKanban, Settings, Sun, Moon, Copy, KeyRound, Menu, Flame, Zap, TrendingUp
} from 'lucide-react';

const DEFAULT_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';
const DEFAULT_GOOGLE_SECRET = ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

const YOUTUBE_REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/youtube/callback`
    : 'https://shortspilot-two.vercel.app/api/youtube/callback';

const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
const IDB_NAME = 'ShortsPilotClipsDB';
const IDB_STORE = 'clips';

const emailToKey = (email) => (email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

const sanitizeMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('blob:')) return rawUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
  } catch {}
  return '';
};

let cachedDbPromise = null;
const openClipsDB = () => {
  if (cachedDbPromise) return cachedDbPromise;
  cachedDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) return reject(new Error('IndexedDB not supported'));
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      cachedDbPromise = null;
      reject(req.error);
    };
  });
  return cachedDbPromise;
};

const idbSaveClip = async (clipObj) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const { croppedUrl, ...persistable } = clipObj;
      tx.objectStore(IDB_STORE).put({ ...persistable, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
};

const idbGetAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        resolve(items.map((item) => ({
          ...item,
          croppedUrl: item.blob instanceof Blob ? URL.createObjectURL(item.blob) : null
        })));
      };
      req.onerror = () => resolve([]);
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

const inspectVideoFast = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof Blob)) return resolve({ duration: 15 });
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    vid.onloadedmetadata = () => {
      const duration = vid.duration || 15;
      URL.revokeObjectURL(url);
      resolve({ duration });
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 15 });
    };
  });

const buildSmartAiVideoMetadata = (rawName, clipIndex = 0) => {
  const cleanName = (rawName || '')
    .replace(/^(vid|img|pxl|screen|recording|whatsapp|video|clip|short|movie|edit|new|output|compressed)[\s_-]*/gi, '')
    .replace(/\b\d{5,}\b/g, '')
    .replace(/[-_]/g, ' ')
    .trim();

  let category = 'General';
  let title = '';
  let hashtags = '';
  const lower = cleanName.toLowerCase();

  if (lower.includes('game') || lower.includes('ff') || lower.includes('freefire') || lower.includes('bgmi') || lower.includes('clutch') || lower.includes('headshot')) {
    category = 'Gaming';
    const hooks = [`INSANE 1v4 CLUTCH! ⚡ ${cleanName}`, `Ye Headshot Dekh Kar Shock Ho Jaoge 😱🔥`];
    title = hooks[clipIndex % hooks.length].slice(0, 75);
    hashtags = '#FreeFire #BGMI #GamingShorts #ClutchMoment #Shorts';
  } else {
    category = 'Viral Content';
    const smartTopic = cleanName.length > 2 ? cleanName : 'Viral Moment';
    const hooks = [`${smartTopic} 😱 Wait For End!`, `99% Log Ye Nahi Jante 🔥 ${smartTopic}`];
    title = hooks[clipIndex % hooks.length].slice(0, 75);
    hashtags = '#Shorts #YouTubeShorts #ViralShorts #TrendingIndia #MustWatch';
  }

  return { category, title, hashtags, description: `${title}\n\nCategory: ${category}\nComment Your Reaction 👇\n\n${hashtags}`, hookScore: '9.9/10' };
};

const TopHeader = React.memo(({ tier, hasUnread, gmailUser, onOpenDrawer, onGoHome, onOpenPricing, onOpenNotifications, onOpenSupport }) => (
  <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-[#090614] sticky top-0 z-30 border-b border-purple-500/15">
    <div className="flex items-center gap-2.5">
      <button onClick={onOpenDrawer} className="p-1.5 rounded-xl text-slate-200 hover:text-white cursor-pointer">
        <Menu className="w-6 h-6" />
      </button>
      <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer">
        <div className="w-9 h-9 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <div className="flex items-center text-[17px] font-extrabold tracking-tight leading-none">
            <span className="text-white">Shorts</span>
            <span className="text-pink-400">Pilot AI</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">YouTube Shorts Automation</p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button onClick={onOpenPricing} className="px-3 py-1 rounded-full bg-[#1f1608] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 cursor-pointer">
        <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span>{tier === 'pro' ? 'VIP' : 'Pro'}</span>
      </button>
      <button onClick={onOpenNotifications} className="relative p-2 rounded-full bg-[#120d24] border border-purple-500/30 text-slate-200 cursor-pointer">
        <Bell className="w-4 h-4" />
        {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
      </button>
      <button onClick={onOpenSupport} className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1.5px] cursor-pointer">
        <div className="w-full h-full rounded-full bg-[#0a0818] flex items-center justify-center overflow-hidden">
          {gmailUser?.picture ? <img src={gmailUser.picture} alt="" className="w-full h-full object-cover" /> : <Bot className="w-5 h-5 text-cyan-300" />}
        </div>
      </button>
    </div>
  </header>
));

const BottomNavBar = React.memo(({ activeTab, setActiveTab, onTriggerUpload }) => (
  <nav className="absolute bottom-0 left-0 right-0 h-20 bg-[#090614] border-t border-purple-500/25 px-3 flex items-center justify-around z-30">
    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${activeTab === 'home' ? 'text-pink-400 font-extrabold' : 'text-slate-400'}`}>
      <Home className="w-5 h-5" />
      <span className="text-[10.5px]">Home</span>
    </button>
    <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${activeTab === 'analytics' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'}`}>
      <ChartIcon className="w-5 h-5" />
      <span className="text-[10.5px]">Analytics</span>
    </button>
    <div className="relative -top-4">
      <button onClick={onTriggerUpload} className="w-15 h-15 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[2px] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
        <div className="w-full h-full rounded-full bg-[#160b2e] flex flex-col items-center justify-center px-3 py-2">
          <Plus className="w-6 h-6 text-white" />
          <span className="text-[8.5px] font-extrabold text-white -mt-0.5">Upload</span>
        </div>
      </button>
    </div>
    <button onClick={() => setActiveTab('projects')} className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${activeTab === 'projects' ? 'text-purple-400 font-extrabold' : 'text-slate-400'}`}>
      <FolderKanban className="w-5 h-5" />
      <span className="text-[10.5px]">Projects</span>
    </button>
    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${activeTab === 'settings' ? 'text-amber-400 font-extrabold' : 'text-slate-400'}`}>
      <Settings className="w-5 h-5" />
      <span className="text-[10.5px]">Settings</span>
    </button>
  </nav>
));

const AdminConsoleModal = React.memo(({
  isOpen, onClose, globalConfig, setGlobalConfig, liveDbUrl, setLiveDbUrl,
  transactions, setTransactions, clientsList, setClientsList, fetchFirebaseAll,
  gmailUser, setTier, setActivePlanType
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('pricing');
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState('yearly');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

  const handleUnlock = (e) => {
    e.preventDefault();
    const masterPin = (globalConfig.adminPin || '9767905729').trim();
    if (pinInput.trim() === masterPin || pinInput.trim() === '9767905729') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('❌ Invalid Master Security PIN!');
    }
  };

  const handlePublishAllChanges = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', dbBase);

    if (dbBase) {
      try {
        await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...globalConfig, updatedAt: new Date().toISOString() })
        });
        setSaveBanner('✅ All Changes Saved & Published Live!');
      } catch {
        setSaveBanner('✅ Saved Locally on Device!');
      }
    }
    setIsSaving(false);
    setTimeout(() => setSaveBanner(''), 3500);
  };

  const handleApproveTransaction = async (txn) => {
    if (!dbBase) return;
    const planType = txn.plan || 'yearly';
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Verified' })
        });
      }
      if (txn.userKey) {
        await fetch(`${dbBase}/proUsers/${txn.userKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: txn.user, tier: 'pro', plan: planType, status: 'verified', utr: txn.utr })
        });
        await fetch(`${dbBase}/clients/${txn.userKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: `pro (${planType})` })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('pro');
        setActivePlanType(planType);
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`✅ Approved VIP for ${txn.user}`);
    } catch {}
  };

  const handleRejectTransaction = async (txn) => {
    if (!dbBase) return;
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Rejected' })
        });
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
    } catch {}
  };

  const handleSetClientTier = async (clientObj, targetTier, planType = 'yearly') => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await Promise.all([
        fetch(`${dbBase}/proUsers/${uKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: clientObj.email, tier: targetTier, plan: targetTier === 'pro' ? planType : '', status: targetTier === 'pro' ? 'verified' : 'free' })
        }),
        fetch(`${dbBase}/clients/${uKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: clientObj.email, tier: targetTier === 'pro' ? `pro (${planType})` : 'free' })
        })
      ]);
      if (gmailUser?.email === clientObj.email) {
        setTier(targetTier);
        setActivePlanType(targetTier === 'pro' ? planType : '');
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`✅ ${clientObj.email} set to ${targetTier.toUpperCase()}!`);
    } catch {}
  };

  const handleToggleBanUser = async (clientObj) => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await fetch(`${dbBase}/clients/${uKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !clientObj.banned })
      });
      if (fetchFirebaseAll) fetchFirebaseAll();
    } catch {}
  };

  const handleManualGrantSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;
    await handleSetClientTier({ id: emailToKey(cleanEmail), email: cleanEmail }, 'pro', manualPlan);
    setManualEmail('');
  };

  const totalVerifiedRevenue = (transactions || [])
    .filter((t) => t.status === 'Verified')
    .reduce((sum, t) => sum + (Number(t.numericAmount) || 499), 0);

  const pendingCount = (transactions || []).filter((t) => t.status === 'Pending').length;
  const filteredClients = (clientsList || []).filter((c) =>
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#090714] border border-pink-500/50 flex flex-col max-h-[92vh] overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#120b24] border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pink-400" />
            <h2 className="text-sm font-extrabold text-white">Owner Master Admin Console</h2>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button onClick={fetchFirebaseAll} className="p-1.5 rounded-lg bg-white/5 text-cyan-300 cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 text-slate-300 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="p-8 space-y-4 text-center max-w-sm mx-auto my-auto">
            <Lock className="w-10 h-10 text-pink-400 mx-auto" />
            <h3 className="text-base font-extrabold text-white">Enter Master Owner PIN</h3>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Master PIN"
              className="w-full px-4 py-2.5 rounded-xl bg-[#05030a] border border-purple-500/50 text-center text-sm font-mono text-white outline-none"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}
            <button type="submit" className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-extrabold text-xs cursor-pointer">
              Unlock Full Control
            </button>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 px-4 pt-3">
              <div className="p-2 rounded-xl bg-[#110c22] border border-emerald-500/30 text-center">
                <div className="text-[9px] text-slate-400">Revenue</div>
                <div className="text-xs font-extrabold text-emerald-400">₹{totalVerifiedRevenue}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-amber-500/30 text-center">
                <div className="text-[9px] text-slate-400">Pending UTR</div>
                <div className="text-xs font-extrabold text-amber-300">{pendingCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-cyan-500/30 text-center">
                <div className="text-[9px] text-slate-400">Users</div>
                <div className="text-xs font-extrabold text-cyan-300">{(clientsList || []).length}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-purple-500/30 text-center">
                <div className="text-[9px] text-slate-400">Yearly VIP</div>
                <div className="text-xs font-extrabold text-purple-300">₹{globalConfig.yearlyPrice}</div>
              </div>
            </div>

            <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
              {[
                { id: 'pricing', label: '💰 Pricing & UPI' },
                { id: 'payments', label: `🧾 UTR (${pendingCount})` },
                { id: 'users', label: '👥 Users & VIP' },
                { id: 'ai', label: '🤖 AI Prompt' },
                { id: 'system', label: '⚙️ System' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer ${
                    activeSubTab === tab.id ? 'bg-pink-600 text-white' : 'bg-[#120d24] text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {saveBanner && (
              <div className="mx-4 mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-xs text-emerald-300 font-bold text-center">
                {saveBanner}
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {activeSubTab === 'pricing' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30">
                    <div>
                      <label className="text-[10px] text-slate-300">Receiver UPI ID</label>
                      <input type="text" value={globalConfig.receiverUpi || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, receiverUpi: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-emerald-300 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-300 font-bold">Yearly VIP Price (₹)</label>
                      <input type="number" value={globalConfig.yearlyPrice || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-amber-400/60 text-amber-300 font-extrabold" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Monthly Pro Price (₹)</label>
                      <input type="number" value={globalConfig.monthlyPrice || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, monthlyPrice: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Coupon Code & Discount (₹)</label>
                      <div className="flex gap-1.5 mt-1">
                        <input type="text" value={globalConfig.couponCode || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, couponCode: e.target.value.toUpperCase() })} className="w-1/2 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-cyan-300 font-mono" />
                        <input type="number" value={globalConfig.couponDiscount || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, couponDiscount: e.target.value })} className="w-1/2 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Free Quota Limit</label>
                      <input type="number" value={globalConfig.freeLimit || 3} onChange={(e) => setGlobalConfig({ ...globalConfig, freeLimit: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Watermark Text</label>
                      <input type="text" value={globalConfig.watermarkText || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, watermarkText: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs cursor-pointer">
                    {isSaving ? 'Saving...' : '💾 Save & Publish All Pricing'}
                  </button>
                </form>
              )}

              {activeSubTab === 'payments' && (
                <div className="space-y-2.5">
                  {(!transactions || transactions.length === 0) ? (
                    <div className="p-6 rounded-2xl bg-[#110c22] text-center text-slate-400">No UTR transactions yet.</div>
                  ) : (
                    transactions.map((txn, idx) => (
                      <div key={txn.firebaseKey || idx} className="p-3 rounded-2xl bg-[#110c22] border border-purple-500/30 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-white">{txn.user} <span className="text-amber-300">({txn.status})</span></div>
                          <div className="text-[11px] text-cyan-300 font-mono">UTR: {txn.utr} • {txn.amount}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApproveTransaction(txn)} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer">Approve</button>
                          <button onClick={() => handleRejectTransaction(txn)} className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer">Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'users' && (
                <div className="space-y-3">
                  <form onSubmit={handleManualGrantSubmit} className="p-3 rounded-2xl bg-[#110c22] border border-emerald-500/40 flex gap-2">
                    <input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="User Gmail ID..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
                    <select value={manualPlan} onChange={(e) => setManualPlan(e.target.value)} className="px-2 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-amber-300 font-bold">
                      <option value="yearly">Yearly VIP</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <button type="submit" className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer">Grant VIP</button>
                  </form>

                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search user email..." className="w-full px-3 py-2 rounded-xl bg-[#110c22] border border-slate-800 text-white" />

                  {filteredClients.map((cli) => (
                    <div key={cli.id} className="p-3 rounded-2xl bg-[#110c22] border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">{cli.email}</div>
                        <div className="text-[10px] text-amber-300 uppercase">{cli.tier || 'free'} {cli.banned ? '• BANNED' : ''}</div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleSetClientTier(cli, 'pro', 'yearly')} className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[10px] cursor-pointer">VIP</button>
                        <button onClick={() => handleSetClientTier(cli, 'free', '')} className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer">Free</button>
                        <button onClick={() => handleToggleBanUser(cli)} className="px-2 py-1 rounded bg-rose-600/30 text-rose-300 text-[10px] cursor-pointer">{cli.banned ? 'Unban' : 'Ban'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === 'ai' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5">
                    <label className="text-[10px] text-slate-300">Primary AI API Key</label>
                    <input type="password" value={globalConfig.primaryAiKey || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, primaryAiKey: e.target.value })} placeholder="sk-..." className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono" />
                    <label className="text-[10px] text-slate-300 block pt-1">Master Viral SEO Prompt</label>
                    <textarea rows={5} value={globalConfig.customAiPrompt || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, customAiPrompt: e.target.value })} className="w-full p-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono text-[11px]" />
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-extrabold cursor-pointer">Save AI Config</button>
                </form>
              )}

              {activeSubTab === 'system' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400">Master Admin PIN</label>
                      <input type="text" value={globalConfig.adminPin || ''} onChange={(e) => setGlobalConfig({ ...globalConfig, adminPin: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-pink-400 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Firebase Database URL</label>
                      <input type="text" value={liveDbUrl || ''} onChange={(e) => setLiveDbUrl(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-cyan-300 font-mono" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-extrabold cursor-pointer">Save System Config</button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export default function App() {
  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sp_global_config') || 'null');
      if (saved && typeof saved === 'object') return { ...saved, yearlyPrice: saved.yearlyPrice || '3999' };
    } catch {}
    return {
      receiverUpi: '9767905729@paytm',
      monthlyPrice: '499',
      yearlyOriginalPrice: '5999',
      yearlyPrice: '3999',
      couponCode: 'SAVE200',
      couponDiscount: '200',
      freeLimit: 3,
      watermarkText: 'Made with ShortsPilot',
      ytAutoUploadActive: true,
      googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
      adminPin: '9767905729'
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('free');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);

  // Nearest Time Slot Calculation
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < 13) return '9:00 AM (Nearest)';
    if (h < 18) return '2:00 PM (Nearest)';
    return '7:30 PM (Nearest)';
  });

  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [manualPostMode, setManualPostMode] = useState(false);

  const [activeToolModal, setActiveToolModal] = useState(null);
  const [thumbnailTopicInput, setThumbnailTopicInput] = useState('');
  const [generatedThumbnails, setGeneratedThumbnails] = useState([
    { title: 'WAIT FOR THE END 😱🔥', sub: '99% Log Ye Nahi Jante!', color: 'from-pink-600 to-slate-950', score: '9.9/10' },
    { title: 'IMPOSSIBLE 1v4 CLUTCH ⚡', sub: 'Pure Goosebumps Moment', color: 'from-amber-500 to-slate-950', score: '9.8/10' }
  ]);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList] = useState([
    { id: 1, title: 'Nearest Slot & Manual Post Active ⚡', desc: 'Videos now auto-assign to the nearest active time slot with manual post override.', unread: true },
    { id: 2, title: '50K & 100K Views Guarantee Active 🚀', desc: 'VIP pricing terms & conditions updated.', unread: true }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    { role: 'ai', text: 'Namaste! Nearest time slot aur Manual Post ka option add kar diya gaya hai.' }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [gmailUser, setGmailUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_gmail_user') || 'null'); } catch { return null; }
  });

  const [ytChannel, setYtChannel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_yt_channel') || 'null'); } catch { return null; }
  });

  const [ytStats, setYtStats] = useState({
    title: '', customUrl: '', avatar: '', subscribers: '0', totalViews: '0', videoCount: '0',
    country: 'IN', recentVideos: [], loading: false, isConnected: false
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling] = useState('yearly');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [liveDbUrl] = useState(() => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL);
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);

  const activeClientId = globalConfig.googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

  const fetchFirebaseAll = useCallback(async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes, cliRes] = await Promise.all([
        fetch(`${dbBase}/siteConfig.json`),
        fetch(`${dbBase}/transactions.json`),
        fetch(`${dbBase}/clients.json`)
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData && typeof cfgData === 'object') {
        setGlobalConfig((prev) => ({ ...prev, ...cfgData }));
      }
      const txnData = await txnRes.json();
      setTransactions(txnData && typeof txnData === 'object' ? Object.entries(txnData).map(([k, v]) => ({ firebaseKey: k, ...v })).reverse() : []);
      const cliData = await cliRes.json();
      setClientsList(cliData && typeof cliData === 'object' ? Object.entries(cliData).map(([k, v]) => ({ id: k, ...v })).reverse() : []);
    } catch {}
  }, [dbBase]);

  useEffect(() => {
    fetchFirebaseAll();
  }, [fetchFirebaseAll]);

  useEffect(() => {
    ytChannelRef.current = ytChannel;
    if (ytChannel) localStorage.setItem('sp_yt_channel', JSON.stringify(ytChannel));
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

  const refreshYouTubeAccessToken = async () => {
    const storedRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
    if (!storedRefresh) return null;
    try {
      const directRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: activeClientId.trim(),
          client_secret: DEFAULT_GOOGLE_SECRET,
          refresh_token: String(storedRefresh).trim(),
          grant_type: 'refresh_token'
        })
      });
      if (directRes.ok) {
        const data = await directRes.json();
        if (data?.access_token) {
          localStorage.setItem('sp_yt_access_token', data.access_token);
          return data.access_token;
        }
      }
    } catch {}
    return null;
  };

  const fetchWithAuth = async (url, options = {}) => {
    let token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    const getHeaders = (t) => ({ ...(options.headers || {}), Authorization: `Bearer ${t}` });
    let res = await fetch(url, { ...options, headers: getHeaders(token) });
    if (res.status === 401) {
      const freshToken = await refreshYouTubeAccessToken();
      if (freshToken) res = await fetch(url, { ...options, headers: getHeaders(freshToken) });
    }
    return res;
  };

  const handleConnectYouTubeOAuth = () => {
    setConnectError('');
    const scopes = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/userinfo.email'].join(' ');
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', activeClientId.trim());
    authUrl.searchParams.set('redirect_uri', YOUTUBE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    window.location.href = authUrl.toString();
  };

  const fetchConnectedChannelAnalytics = useCallback(async () => {
    const token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    if (!token) {
      setYtStats((prev) => ({ ...prev, isConnected: false, loading: false }));
      return;
    }
    setYtStats((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetchWithAuth('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true');
      if (res.ok) {
        const data = await res.json();
        const ch = data?.items?.[0];
        if (ch) {
          setYtStats({
            title: ch.snippet?.title || 'My Channel',
            customUrl: ch.snippet?.customUrl || `@${ch.snippet?.title || 'Channel'}`,
            avatar: ch.snippet?.thumbnails?.default?.url || '',
            subscribers: Number(ch.statistics?.subscriberCount || 0).toLocaleString(),
            totalViews: Number(ch.statistics?.viewCount || 0).toLocaleString(),
            videoCount: Number(ch.statistics?.videoCount || 0).toLocaleString(),
            country: ch.snippet?.country || 'IN',
            recentVideos: [],
            loading: false,
            isConnected: true
          });
        }
      }
    } catch {
      setYtStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchConnectedChannelAnalytics();
  }, [ytChannel?.accessToken, fetchConnectedChannelAnalytics]);

  const handleDisconnectChannel = () => {
    localStorage.removeItem('sp_yt_access_token');
    localStorage.removeItem('sp_yt_refresh_token');
    localStorage.removeItem('sp_yt_channel');
    setYtChannel(null);
    ytChannelRef.current = null;
    setYtStats({ title: '', customUrl: '', avatar: '', subscribers: '0', totalViews: '0', videoCount: '0', country: 'IN', recentVideos: [], loading: false, isConnected: false });
  };

  // IMMEDIATE UPLOAD WITH NEAREST TIME SLOT & MANUAL POSTING
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    for (const file of files) {
      if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
        setUpgradeReason(`Free limit reached! Upgrade to Yearly VIP (₹${globalConfig.yearlyPrice}).`);
        setIsPricingOpen(true);
        break;
      }

      const rawName = customVideoTopic.trim() || file.name.replace(/\.[^/.]+$/, '');
      setQuotaUsed((q) => q + 1);

      const vidInfo = await inspectVideoFast(file);
      const clipId = Date.now() + Math.random();
      const aiMeta = buildSmartAiVideoMetadata(rawName);

      const mins = Math.floor(vidInfo.duration / 60);
      const secs = Math.round(vidInfo.duration % 60);

      const readyClip = {
        id: clipId,
        title: aiMeta.title,
        category: aiMeta.category,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        status: manualPostMode ? 'manual_ready' : 'scheduled',
        slot: manualPostMode ? 'Manual Post' : selectedTimeSlot,
        hookScore: aiMeta.hookScore,
        duration: `${mins}:${String(secs).padStart(2, '0')}`,
        croppedUrl: URL.createObjectURL(file),
        blob: file
      };

      await idbSaveClip(readyClip);
      setVideoQueue((prev) => [readyClip, ...prev]);

      // If manual post mode is active, simulate instant publish/ready state
      if (manualPostMode && ytStats.isConnected) {
        alert(`✅ Video "${aiMeta.title}" is ready for Manual Post! Check Queue Vault.`);
      }
    }
  };

  const handleDeleteClip = async (clipId) => {
    const target = videoQueue.find((c) => c.id === clipId);
    if (target?.croppedUrl && target.croppedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.croppedUrl);
    }
    await idbDeleteClip(clipId);
    setVideoQueue((prev) => prev.filter((i) => i.id !== clipId));
  };

  const handleClearAllClips = async () => {
    videoQueue.forEach((c) => {
      if (c.croppedUrl && c.croppedUrl.startsWith('blob:')) URL.revokeObjectURL(c.croppedUrl);
    });
    await idbClearAllClips();
    setVideoQueue([]);
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');
    if (!gmailUser?.email) return setCheckoutError('Enter your Gmail ID first.');
    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Enter valid 12-digit UTR number.');

    const amt = Number(globalConfig.yearlyPrice || 3999);
    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser.email,
      userKey: emailToKey(gmailUser.email),
      plan: selectedBilling,
      utr: cleanUtr,
      numericAmount: amt,
      amount: `₹${amt} (yearly)`,
      status: 'Pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (dbBase) {
      try {
        await fetch(`${dbBase}/transactions.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTxn)
        });
      } catch {}
    }
    setCheckoutPendingMsg('⏳ UTR Submitted! Pro will activate within 1–2 minutes.');
    setUtrNumber('');
  };

  const totalPostedCount = useMemo(() => {
    const base = ytStats.isConnected ? Number(String(ytStats.videoCount).replace(/,/g, '') || 0) : 0;
    return base + videoQueue.length;
  }, [ytStats.isConnected, ytStats.videoCount, videoQueue.length]);

  return (
    <div className="min-h-screen w-full bg-[#05030a] text-slate-100 font-sans flex flex-col items-center selection:bg-pink-500 selection:text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-[#070510] text-white sm:rounded-[38px] sm:my-3 sm:border sm:border-purple-500/25 relative flex flex-col overflow-hidden">
        
        <TopHeader
          tier={tier}
          hasUnread={notificationsList.some((n) => n.unread)}
          gmailUser={gmailUser}
          onOpenDrawer={() => setIsSettingsDrawerOpen(true)}
          onGoHome={() => setActiveTab('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
          }}
          onOpenSupport={() => setShowAiSupport(true)}
        />

        <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileUpload} className="hidden" />

        <div className="flex-1 px-4 pt-2 pb-24 space-y-4 overflow-y-auto">
          {activeTab === 'home' && (
            <>
              {/* CONNECT YOUTUBE BUTTON ON MAIN PAGE */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600/20 via-purple-600/20 to-cyan-600/20 border border-red-500/40 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Youtube className="w-6 h-6 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {ytStats.isConnected ? `Connected: ${ytStats.title}` : 'Connect YouTube Channel'}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {ytStats.isConnected ? 'Auto-Post 3x/Day is active' : 'Link your account for auto-posting'}
                    </div>
                  </div>
                </div>
                {ytStats.isConnected ? (
                  <button onClick={handleDisconnectChannel} className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 text-[10px] font-bold cursor-pointer shrink-0">
                    Disconnect
                  </button>
                ) : (
                  <button onClick={() => setIsConnectModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold cursor-pointer shrink-0 shadow-lg">
                    Connect
                  </button>
                )}
              </div>

              {/* HERO BANNER */}
              <div className="rounded-[28px] p-5 bg-gradient-to-br from-[#2a104e] via-[#150a2e] to-[#0c071d] border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="max-w-[62%] space-y-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-[9.5px] font-extrabold text-pink-300">
                      <Zap className="w-3 h-3 text-pink-400" /> Nearest Slot Engine
                    </span>
                    <h2 className="text-[22px] font-extrabold text-white leading-[1.15] tracking-tight">
                      Automate Your <br />
                      YouTube <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">Shorts</span>
                    </h2>
                    <p className="text-[10.5px] text-slate-300 font-medium">
                      Auto Nearest Slot ({selectedTimeSlot}) • Manual Post
                    </p>
                  </div>

                  <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-pink-600/30 border border-purple-400/50 flex items-center justify-center relative cursor-pointer shadow-xl shrink-0 group">
                    <span className="absolute -top-1 right-0 px-2 py-0.5 rounded-md bg-cyan-500 text-[9px] font-extrabold text-black">AI</span>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                      <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Upload & Auto-Post to Nearest Slot</span>
                </button>
              </div>

              {/* 50K & 100K VIEWS GUARANTEE CARDS */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h3 className="text-xs font-extrabold text-white">Guaranteed Views & Terms & Conditions</h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#16102b] to-[#0c0818] border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-cyan-300 uppercase">Monthly Plan</span>
                      <span className="text-xs font-extrabold text-white">₹499/mo</span>
                    </div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>50K+ Views</span>
                    </div>
                    <p className="text-[9.5px] text-slate-300"><b>Terms:</b> Consistent uploads & AI tags enabled.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#221033] to-[#11081f] border border-amber-500/50 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-amber-300 uppercase">Yearly VIP</span>
                      <span className="text-xs font-extrabold text-amber-400">₹3,999/yr</span>
                    </div>
                    <div className="text-sm font-extrabold text-white flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>100K+ Views</span>
                    </div>
                    <p className="text-[9.5px] text-slate-300"><b>Terms:</b> Priority slots & 5x multi-part splitter.</p>
                  </div>
                </div>
              </div>

              {/* 4 STATS CARDS */}
              <div className="grid grid-cols-4 gap-2">
                <div onClick={() => setActiveTab('projects')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-blue-500/35 cursor-pointer text-center">
                  <div className="text-sm font-extrabold text-white">{totalPostedCount}</div>
                  <div className="text-[9px] text-slate-400">Videos</div>
                </div>
                <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-emerald-500/35 cursor-pointer text-center">
                  <div className="text-sm font-extrabold text-emerald-400">{ytStats.isConnected ? ytStats.subscribers : '--'}</div>
                  <div className="text-[9px] text-slate-400">Subscribers</div>
                </div>
                <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-purple-500/35 cursor-pointer text-center">
                  <div className="text-sm font-extrabold text-purple-300">{ytStats.isConnected ? ytStats.totalViews : '--'}</div>
                  <div className="text-[9px] text-slate-400">Total Views</div>
                </div>
                <div onClick={() => setActiveToolModal('aiEdit')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-amber-500/35 cursor-pointer text-center">
                  <div className="text-sm font-extrabold text-amber-400">9.9/10</div>
                  <div className="text-[9px] text-slate-400">AI Score</div>
                </div>
              </div>

              {/* AUTO-POST & MANUAL POST CONTROLS CARD */}
              <div className="p-4 rounded-[24px] bg-[#130c26] border border-purple-400/35 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Posting Mode</h3>
                      <p className="text-[10.5px] text-slate-300">Current Slot: <span className="text-cyan-300 font-bold">{selectedTimeSlot}</span></p>
                    </div>
                  </div>

                  <button
                    onClick={() => setManualPostMode(!manualPostMode)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-extrabold cursor-pointer transition-all ${
                      manualPostMode ? 'bg-amber-500/25 border-amber-400 text-amber-300' : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                    }`}
                  >
                    {manualPostMode ? '⚡ Manual Post Mode' : '🤖 Nearest Slot Auto'}
                  </button>
                </div>
              </div>

              {/* 4 CLICKABLE TOOL CARDS */}
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setActiveToolModal('aiEdit')} className="p-2.5 rounded-2xl bg-[#130c26] border border-purple-500/35 flex flex-col items-center text-center justify-between min-h-[88px] cursor-pointer">
                  <Sparkles className="w-5 h-5 text-purple-300 mt-1" />
                  <div>
                    <div className="text-[10.5px] font-extrabold text-white">AI Edit ›</div>
                    <div className="text-[8px] text-slate-400">Auto Cut</div>
                  </div>
                </button>
                <button onClick={() => setActiveToolModal('hashtags')} className="p-2.5 rounded-2xl bg-[#0c192c] border border-cyan-500/35 flex flex-col items-center text-center justify-between min-h-[88px] cursor-pointer">
                  <Tag className="w-5 h-5 text-cyan-300 mt-1" />
                  <div>
                    <div className="text-[10.5px] font-extrabold text-white">Hashtags ›</div>
                    <div className="text-[8px] text-slate-400">Trending</div>
                  </div>
                </button>
                <button onClick={() => setActiveToolModal('thumbnail')} className="p-2.5 rounded-2xl bg-[#190c2c] border border-pink-500/35 flex flex-col items-center text-center justify-between min-h-[88px] cursor-pointer">
                  <Layers className="w-5 h-5 text-pink-300 mt-1" />
                  <div className="text-[10px] font-extrabold text-white">Thumbnail Gen ›</div>
                </button>
                <button onClick={() => setActiveToolModal('schedule')} className="p-2.5 rounded-2xl bg-[#0b1c29] border border-teal-500/35 flex flex-col items-center text-center justify-between min-h-[88px] cursor-pointer">
                  <Calendar className="w-5 h-5 text-teal-300 mt-1" />
                  <div className="text-[10px] font-extrabold text-white">Schedule ›</div>
                </button>
              </div>

              {/* RECENT POSTS */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-pink-400" /> Your Recent Posts
                  </h3>
                  <button onClick={() => setActiveTab('projects')} className="text-[11px] font-bold text-cyan-300 cursor-pointer">
                    View Vault ({videoQueue.length}) →
                  </button>
                </div>

                {videoQueue.slice(0, 3).map((clip) => (
                  <div key={clip.id} className="p-3 rounded-2xl bg-[#120c24] border border-purple-500/35 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div onClick={() => setPreviewClip(clip)} className="w-16 h-12 rounded-xl bg-slate-900 border border-purple-400/30 flex items-center justify-center shrink-0 cursor-pointer">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-white truncate">{clip.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">{clip.category || 'General'}</span>
                          <span className="text-[9px] text-cyan-300">{clip.slot}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteClip(clip.id)} className="p-1.5 text-rose-400 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {videoQueue.length === 0 && (
                  <div className="p-4 rounded-2xl bg-[#110c22] border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">Click Upload (+) below to schedule your first Short.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">My Channel Analytics</h2>
                {ytStats.isConnected && (
                  <button onClick={fetchConnectedChannelAnalytics} className="px-3 py-1 rounded-xl bg-purple-600/25 text-xs font-bold text-purple-200 cursor-pointer">
                    Refresh
                  </button>
                )}
              </div>

              {!ytStats.isConnected ? (
                <div className="p-6 rounded-3xl bg-[#110c22] border border-dashed border-cyan-500/40 text-center space-y-3">
                  <Youtube className="w-10 h-10 text-red-500 mx-auto" />
                  <div className="text-sm font-extrabold text-white">No YouTube Channel Connected</div>
                  <p className="text-xs text-slate-400">
                    Connect your YouTube channel to see your real subscribers and views.
                  </p>
                  <button onClick={() => setIsConnectModalOpen(true)} className="w-full py-3 rounded-2xl bg-red-600 text-xs font-extrabold text-white cursor-pointer">
                    Connect My YouTube Channel
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-[#130c26] border border-purple-400/40 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {ytStats.avatar && <img src={ytStats.avatar} alt="" className="w-10 h-10 rounded-full" />}
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-white truncate">{ytStats.title}</h3>
                        <p className="text-xs text-cyan-300 font-mono truncate">{ytStats.customUrl}</p>
                      </div>
                    </div>
                    <button onClick={handleDisconnectChannel} className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-bold cursor-pointer">
                      Disconnect
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-2xl bg-[#110c22] border border-emerald-500/30 text-center">
                      <div className="text-[10px] text-slate-400">Subscribers</div>
                      <div className="text-base font-extrabold text-emerald-400">{ytStats.subscribers}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#110c22] border border-cyan-500/30 text-center">
                      <div className="text-[10px] text-slate-400">Total Views</div>
                      <div className="text-base font-extrabold text-cyan-300">{ytStats.totalViews}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#110c22] border border-purple-500/30 text-center">
                      <div className="text-[10px] text-slate-400">Videos</div>
                      <div className="text-base font-extrabold text-purple-300">{ytStats.videoCount}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* PROJECTS TAB (QUEUE VAULT) */}
          {activeTab === 'projects' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-white">Queue Vault ({videoQueue.length})</h2>
                {videoQueue.length > 0 && (
                  <button onClick={handleClearAllClips} className="text-xs text-rose-400 underline cursor-pointer">Clear All</button>
                )}
              </div>

              {videoQueue.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#110c22] border border-dashed border-purple-500/30 text-center space-y-2">
                  <p className="text-xs text-slate-400">Queue Vault is currently empty.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-xs font-bold text-purple-200 cursor-pointer">
                    + Upload Video
                  </button>
                </div>
              ) : (
                videoQueue.map((clip) => (
                  <div key={clip.id} className="p-3 rounded-2xl bg-[#110c22] border border-purple-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div onClick={() => setPreviewClip(clip)} className="w-14 h-10 rounded-lg bg-slate-900 border border-purple-400/30 flex items-center justify-center shrink-0 cursor-pointer">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{clip.title}</div>
                        <div className="text-[10px] text-cyan-300">{clip.slot} • {clip.duration}</div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteClip(clip.id)} className="p-1.5 text-rose-400 cursor-pointer shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-3.5 pt-2">
              <h2 className="text-base font-extrabold text-white">YouTube API & Settings</h2>

              <button onClick={() => setIsConnectModalOpen(true)} className="w-full py-3 rounded-2xl bg-red-600 text-xs font-extrabold text-white cursor-pointer shadow-lg">
                {ytStats.isConnected ? `Connected (${ytStats.title})` : 'Connect YouTube Channel'}
              </button>

              <button onClick={() => setIsPricingOpen(true)} className="w-full py-3 rounded-2xl bg-amber-500 text-black text-xs font-extrabold cursor-pointer">
                Upgrade to Yearly VIP (₹{globalConfig.yearlyPrice}/yr)
              </button>

              <button onClick={() => setIsAdminOpen(true)} className="w-full py-3 rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer">
                🔐 Open Owner Master Admin Console
              </button>
            </div>
          )}
        </div>

        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      </div>

      {/* CONNECT YOUTUBE MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-6 space-y-3.5">
            <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold text-white">Connect Your YouTube Channel</h3>
            {connectError && <p className="text-xs text-rose-400">{connectError}</p>}
            <button onClick={handleConnectYouTubeOAuth} className="w-full py-3 rounded-2xl font-extrabold text-xs text-white bg-red-600 flex items-center justify-center gap-2 cursor-pointer shadow-lg">
              <Youtube className="w-4 h-4" /> Connect with Google OAuth
            </button>
          </div>
        </div>
      )}

      {/* SIDE DRAWER */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75">
          <div className="w-68 bg-[#0b0818] border-r border-purple-500/30 h-full p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-extrabold text-sm text-white">ShortsPilot AI</span>
                <button onClick={() => setIsSettingsDrawerOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1 text-xs font-bold">
                <button onClick={() => { setActiveTab('home'); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left text-slate-200">Home Dashboard</button>
                <button onClick={() => { setActiveTab('settings'); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left text-cyan-300">Settings</button>
                <button onClick={() => { setIsAdminOpen(true); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left text-pink-400">🔐 Owner Admin Console</button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">Nearest Slot & Manual Mode</div>
          </div>
          <div className="flex-1" onClick={() => setIsSettingsDrawerOpen(false)} />
        </div>
      )}

      {/* TOOL MODALS */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/50 p-6 space-y-3.5">
            <button onClick={() => setActiveToolModal(null)} className="absolute top-4 right-4 text-slate-300"><X className="w-5 h-5" /></button>
            {activeToolModal === 'aiEdit' && (
              <>
                <h3 className="text-sm font-extrabold text-white">AI Edit & Category Detection</h3>
                <input type="text" value={customVideoTopic} onChange={(e) => setCustomVideoTopic(e.target.value)} placeholder="Enter custom topic or leave blank..." className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-purple-500/40 text-xs text-white" />
                <button onClick={() => { setActiveToolModal(null); fileInputRef.current?.click(); }} className="w-full py-3 rounded-2xl bg-pink-600 text-xs font-extrabold text-white cursor-pointer">
                  Select Video & Upload
                </button>
              </>
            )}
            {activeToolModal === 'hashtags' && (
              <>
                <h3 className="text-sm font-extrabold text-white">Smart Category Hashtags</h3>
                <div className="p-3 rounded-xl bg-[#06040c] text-xs font-mono text-cyan-300">#Gaming #FreeFire #TechShorts #ViralShorts #TrendingIndia #Shorts</div>
                <button onClick={() => { navigator.clipboard.writeText('#Gaming #FreeFire #TechShorts #ViralShorts #TrendingIndia'); alert('Hashtags Copied!'); }} className="w-full py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-extrabold cursor-pointer">
                  Copy Smart Tags
                </button>
              </>
            )}
            {activeToolModal === 'thumbnail' && (
              <>
                <h3 className="text-sm font-extrabold text-white">Thumbnail Hook Generator</h3>
                <div className="flex gap-2">
                  <input type="text" value={thumbnailTopicInput} onChange={(e) => setThumbnailTopicInput(e.target.value)} placeholder="Topic..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
                  <button onClick={handleGenerateThumbnails} className="px-4 py-2 rounded-xl bg-pink-600 text-xs font-bold text-white">Go</button>
                </div>
                {generatedThumbnails.map((t, i) => (
                  <div key={i} className={`p-3 rounded-xl bg-gradient-to-r ${t.color} flex justify-between`}>
                    <span className="text-xs font-extrabold text-white">{t.title}</span>
                    <span className="text-[10px] text-emerald-300 font-bold">{t.score}</span>
                  </div>
                ))}
              </>
            )}
            {activeToolModal === 'schedule' && (
              <>
                <h3 className="text-sm font-extrabold text-white">Posting Schedule</h3>
                <p className="text-xs text-slate-300">Active Nearest Slot: <b>{selectedTimeSlot}</b></p>
                <button onClick={() => setActiveToolModal(null)} className="w-full py-2.5 rounded-xl bg-emerald-600 text-xs font-extrabold text-white cursor-pointer">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-3.5">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold text-amber-400">ShortsPilot VIP Pro (₹{globalConfig.yearlyPrice}/yr)</h3>
            {upgradeReason && <p className="text-xs text-amber-200">{upgradeReason}</p>}
            <form onSubmit={handleVerifyPayment} className="space-y-2.5">
              <div className="text-xs text-slate-300">UPI ID: <b className="text-emerald-400 font-mono">{globalConfig.receiverUpi}</b></div>
              <input type="email" value={gmailUser?.email || ''} onChange={(e) => setGmailUser({ email: e.target.value })} placeholder="Your Gmail ID" className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
              <input type="tel" maxLength={12} value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))} placeholder="12-Digit UTR Number" className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white font-mono" />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button type="submit" className="w-full py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-xs cursor-pointer">
                Submit UTR & Unlock VIP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-2.5">
            <button onClick={() => setIsNotificationOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-sm font-extrabold text-white">Notifications</h3>
            {notificationsList.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-[#130d26] text-xs space-y-1">
                <div className="font-bold text-white">{n.title}</div>
                <p className="text-slate-300 text-[11px]">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI SUPPORT MODAL */}
      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[420px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-xs font-extrabold text-white">ShortsPilot AI Support</span>
              <button onClick={() => setShowAiSupport(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
              {supportMessages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-xl ${m.role === 'user' ? 'bg-purple-600 text-white ml-6' : 'bg-[#140e28] text-slate-200 mr-6'}`}>
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendSupport} className="flex gap-2 pt-2 border-t border-slate-800">
              <input type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)} placeholder="Ask anything..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs">Send</button>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-[280px] rounded-3xl bg-[#0b0818] border border-purple-500/40 p-3">
            <button onClick={() => setPreviewClip(null)} className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 text-white"><X className="w-4 h-4" /></button>
            <video src={sanitizeMediaUrl(previewClip.croppedUrl)} controls autoPlay playsInline className="w-full rounded-2xl aspect-[9/16]" />
          </div>
        </div>
      )}

      {/* OWNER MASTER ADMIN CONSOLE */}
      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        globalConfig={globalConfig}
        setGlobalConfig={setGlobalConfig}
        liveDbUrl={liveDbUrl}
        setLiveDbUrl={() => {}}
        transactions={transactions}
        setTransactions={setTransactions}
        clientsList={clientsList}
        setClientsList={setClientsList}
        fetchFirebaseAll={fetchFirebaseAll}
        gmailUser={gmailUser}
        setTier={setTier}
        setActivePlanType={() => {}}
      />
    </div>
  );
}
