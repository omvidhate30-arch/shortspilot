import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Play,
  X,
  Trash2,
  Calendar,
  Clock,
  Bot,
  Crown,
  Bell,
  Home,
  BarChart2 as ChartIcon,
  Plus,
  FolderKanban,
  Settings,
  Menu,
  Zap,
  TrendingUp,
  Scissors,
  Image as ImageIcon,
  Instagram
} from 'lucide-react';

const DEFAULT_FIREBASE_URL = 'https://shortspilot-default-rtdb.firebaseio.com';

const emailToKey = (email = '') =>
  String(email || '')
    .trim()
    .toLowerCase()
    .replace(/[.#$[\]@]/g, '_');

const sanitizeMediaUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('blob:') || url.startsWith('https://') || url.startsWith('http://')) {
    return url;
  }
  return '';
};

const formatClockTime = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const readLocalRegistry = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const saveLocalRegistry = (email, record) => {
  try {
    const current = readLocalRegistry();
    current[email] = { ...(current[email] || {}), ...record };
    localStorage.setItem('sp_user_registry', JSON.stringify(current));
  } catch {}
};

const removeLocalRegistry = (email) => {
  try {
    const current = readLocalRegistry();
    delete current[email];
    localStorage.setItem('sp_user_registry', JSON.stringify(current));
  } catch {}
};

const readVideoMetadata = (file) =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
        URL.revokeObjectURL(url);
        resolve({ duration: dur });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ duration: 30 });
      };
      video.src = url;
    } catch {
      resolve({ duration: 30 });
    }
  });

const buildClipPackage = (rawTopic, index = 0, partLabel = '', watermarkText = 'Developed by shortspilot.in') => {
  const cleanTopic = (rawTopic || 'Viral Short').trim();
  const title = partLabel ? `${cleanTopic} (${partLabel})` : cleanTopic;
  const tagBase = cleanTopic
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => `#${w}`)
    .join(' ');
  const hashtags = `${tagBase || '#Shorts'} #ShortsPilot #ViralShorts #Trending`;
  const description = `${title}\n\n${hashtags}\n\n${watermarkText}`;
  const hookScore = `${Math.min(99, 88 + ((index * 3) % 10))}/100`;

  return {
    title,
    category: 'Shorts',
    hashtags,
    description,
    watermarkText,
    websiteUrl: 'https://shortspilot.in',
    hookScore
  };
};

const buildThumbnailConcepts = (topic = 'GTA 6') => {
  const clean = (topic || 'VIRAL').trim().toUpperCase().slice(0, 18);
  return [
    {
      id: 't1',
      badge: 'HIGH CTR',
      hookText: 'WAIT FOR END 😱',
      subText: clean,
      accentText: 'text-amber-300',
      ctrScore: '9.6 CTR',
      gradient: 'from-pink-600 via-purple-900 to-slate-950'
    },
    {
      id: 't2',
      badge: 'TRENDING',
      hookText: 'INSANE CLUTCH 🔥',
      subText: clean,
      accentText: 'text-cyan-300',
      ctrScore: '9.4 CTR',
      gradient: 'from-cyan-600 via-blue-950 to-slate-950'
    },
    {
      id: 't3',
      badge: 'VIRAL',
      hookText: 'NO WAY!! 🤯',
      subText: clean,
      accentText: 'text-rose-300',
      ctrScore: '9.2 CTR',
      gradient: 'from-amber-500 via-rose-900 to-slate-950'
    }
  ];
};

const DesktopSidebar = React.memo(
  ({
    activeTab,
    setActiveTab,
    onTriggerUpload,
    onOpenSplitter,
    onOpenThumbnail,
    onOpenPricing,
    onOpenAdmin,
    monthlyPrice,
    yearlyPrice,
    videoCount
  }) => (
    <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[#090614] border-r border-purple-500/20 p-5 sticky top-0 h-screen z-30">
      <div className="space-y-5">
        <div onClick={() => setActiveTab('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center text-lg font-extrabold tracking-tight leading-none">
              <span className="text-white">Shorts</span>
              <span className="text-pink-400">Pilot AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">shortspilot.in • PC Studio</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Publish Short</span>
        </button>

        <div className="space-y-1.5 text-xs font-bold">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 pb-1">
            PC Workspace
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'home'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <ChartIcon className="w-4 h-4" />
            <span>Studio Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'projects'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4" />
              <span>Queue Vault</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-[10px] text-purple-200">
              {videoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 pt-3 pb-1">
            AI Studio Tools
          </div>

          <button
            type="button"
            onClick={onOpenSplitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-pink-300 hover:bg-pink-500/15 cursor-pointer transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span>AI Clip Cutter (1, 3, 5)</span>
          </button>

          <button
            type="button"
            onClick={onOpenThumbnail}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-cyan-500/15 cursor-pointer transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span>9:16 Thumbnail Gen</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-purple-500/20">
        <button
          type="button"
          onClick={onOpenPricing}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/50 text-left cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-amber-300">
            <span>VIP Offer Active</span>
            <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[10px] text-slate-300 mt-1">
            ₹{monthlyPrice}/mo • ₹{yearlyPrice}/yr
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenAdmin}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer hover:bg-purple-600/30"
        >
          🔐 Owner Admin Console
        </button>
        <div className="text-[9.5px] text-center text-slate-500 font-mono">
          Developed by shortspilot.in
        </div>
      </div>
    </aside>
  )
);

const TopHeader = React.memo(
  ({ tier, hasUnread, onOpenDrawer, onGoHome, onOpenPricing, onOpenNotifications }) => (
    <header className="flex items-center justify-between px-4 lg:px-8 pt-4 pb-3 bg-[#090614]/95 backdrop-blur sticky top-0 z-30 border-b border-purple-500/15">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="lg:hidden p-1.5 rounded-xl text-slate-200 hover:text-white cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div onClick={onGoHome} className="flex lg:hidden items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center text-[17px] font-extrabold tracking-tight leading-none">
              <span className="text-white">Shorts</span>
              <span className="text-pink-400">Pilot AI</span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">
              Developed by shortspilot.in
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold">
            ● Studio Ready
          </span>
          <span className="text-xs text-slate-400">
            Brand: <b className="text-cyan-300 font-mono">Developed by shortspilot.in</b>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenPricing}
          className="px-3 py-1.5 rounded-full bg-[#1f1608] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{tier === 'pro' ? 'VIP Active' : 'Offer ₹99'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-[#120d24] border border-purple-500/30 text-slate-200 cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
        </button>
      </div>
    </header>
  )
);

const MobileBottomNavBar = React.memo(({ activeTab, setActiveTab, onTriggerUpload }) => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#090614] border-t border-purple-500/25 px-3 flex items-center justify-around z-40">
    <button
      type="button"
      onClick={() => setActiveTab('home')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'home' ? 'text-pink-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <Home className="w-5 h-5" />
      <span className="text-[10.5px]">Home</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('analytics')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'analytics' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <ChartIcon className="w-5 h-5" />
      <span className="text-[10.5px]">Analytics</span>
    </button>
    <div className="relative -top-4">
      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-15 h-15 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[2px] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      >
        <div className="w-full h-full rounded-full bg-[#160b2e] flex flex-col items-center justify-center px-3 py-2">
          <Plus className="w-6 h-6 text-white" />
          <span className="text-[8.5px] font-extrabold text-white -mt-0.5">Upload</span>
        </div>
      </button>
    </div>
    <button
      type="button"
      onClick={() => setActiveTab('projects')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'projects' ? 'text-purple-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <FolderKanban className="w-5 h-5" />
      <span className="text-[10.5px]">Projects</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('settings')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'settings' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <Settings className="w-5 h-5" />
      <span className="text-[10.5px]">Settings</span>
    </button>
  </nav>
));

export default function App() {
  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sp_global_config') || 'null');
      if (saved && typeof saved === 'object') {
        return {
          ...saved,
          monthlyOriginalPrice: '499',
          monthlyPrice: saved.monthlyPrice || '99',
          yearlyOriginalPrice: '6999',
          yearlyPrice: saved.yearlyPrice || '3999',
          watermarkText: saved.watermarkText || 'Developed by shortspilot.in',
          ownerAlertEmail: saved.ownerAlertEmail || '',
          paymentWebhookUrl: saved.paymentWebhookUrl || ''
        };
      }
    } catch {}
    return {
      receiverUpi: '9767905729@paytm',
      monthlyOriginalPrice: '499',
      monthlyPrice: '99',
      yearlyOriginalPrice: '6999',
      yearlyPrice: '3999',
      couponCode: 'SAVE200',
      couponDiscount: '200',
      freeLimit: 3,
      watermarkText: 'Developed by shortspilot.in',
      ownerAlertEmail: '',
      paymentWebhookUrl: '',
      ytAutoUploadActive: true,
      adminPin: '9767905729'
    };
  });

  const [igData, setIgData] = useState(() => {
    try {
      const reg = readLocalRegistry()['creator@shortspilot.in'];
      if (reg?.igToken) {
        return {
          username: reg.igUsername || '@instagram_user',
          token: reg.igToken,
          connected: true
        };
      }
    } catch {}
    return { username: '', token: '', connected: false };
  });

  const [igUsernameDraft, setIgUsernameDraft] = useState(() => igData.username || '');
  const [igTokenDraft, setIgTokenDraft] = useState(() => igData.token || '');
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [igError, setIgError] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('pro');
  const [videoQueue, setVideoQueue] = useState([]);

  const [clipSplitCount, setClipSplitCount] = useState(3);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);

  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbTopicInput, setThumbTopicInput] = useState('');
  const [selectedThumbConcept, setSelectedThumbConcept] = useState(
    () => buildThumbnailConcepts('GTA 6')[0]
  );
  const [thumbConcepts, setThumbConcepts] = useState(() => buildThumbnailConcepts('GTA 6'));

  const [selectedTimeSlot] = useState(() => {
    const h = new Date().getHours();
    if (h < 13) return '9:00 AM (Nearest VIP Slot)';
    if (h < 18) return '2:00 PM (Nearest VIP Slot)';
    return '7:30 PM (Nearest VIP Slot)';
  });

  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [autoPublishStatus, setAutoPublishStatus] = useState('');
  const [manualPostMode, setManualPostMode] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: 'Studio Ready ✅',
      desc: 'Upload videos, cut 1, 3, or 5 clips, and generate 9:16 thumbnails.',
      unread: true
    }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Video upload karein, AI Clip Cutter se 1/3/5 clips cut karein, ya 9:16 thumbnail banayein.'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [upgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || DEFAULT_FIREBASE_URL
  );
  const [transactions, setTransactions] = useState([]);

  const fileInputRef = useRef(null);
  const splitterInputRef = useRef(null);

  const dbBase = (liveDbUrl || DEFAULT_FIREBASE_URL).trim().replace(/\/$/, '');

  const fetchFirebaseData = useCallback(async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes] = await Promise.all([
        fetch(`${dbBase}/siteConfig.json`),
        fetch(`${dbBase}/transactions.json`)
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData && typeof cfgData === 'object') {
        setGlobalConfig((prev) => ({
          ...prev,
          ...cfgData,
          monthlyOriginalPrice: '499',
          yearlyOriginalPrice: '6999',
          watermarkText: cfgData.watermarkText || 'Developed by shortspilot.in'
        }));
      }
      const txnData = await txnRes.json();
      setTransactions(
        txnData && typeof txnData === 'object'
          ? Object.entries(txnData)
              .map(([k, v]) => ({ firebaseKey: k, ...v }))
              .reverse()
          : []
      );
    } catch {}
  }, [dbBase]);

  useEffect(() => {
    fetchFirebaseData();
  }, [fetchFirebaseData]);

  const handleSaveInstagramToken = async (e) => {
    e?.preventDefault();
    setIgError('');
    const cleanToken = (igTokenDraft || '').trim();
    const rawUser = (igUsernameDraft || '').trim() || '@instagram_creator';
    const formattedUser = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;

    if (!cleanToken || cleanToken.length < 6) {
      return setIgError('Enter a valid Instagram Token.');
    }

    setIgData({
      username: formattedUser,
      token: cleanToken,
      connected: true
    });
    saveLocalRegistry('creator@shortspilot.in', {
      igUsername: formattedUser,
      igToken: cleanToken,
      updatedAt: Date.now()
    });
    setIsIgModalOpen(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setAutoPublishStatus('Preparing Clean Title, #Tags & Description...');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rawName = customVideoTopic.trim() || file.name.replace(/\.[^/.]+$/, '');
      const meta = await readVideoMetadata(file);
      const aiMeta = buildClipPackage(
        rawName,
        i,
        '',
        globalConfig.watermarkText || 'Developed by shortspilot.in'
      );
      const objectUrl = URL.createObjectURL(file);

      const readyClip = {
        id: `${Date.now()}-${Math.random()}`,
        title: aiMeta.title,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        thumbnailHook: selectedThumbConcept?.hookText || 'WAIT FOR END 😱',
        thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        status: manualPostMode ? 'Manual Ready' : 'Published to Queue',
        hookScore: aiMeta.hookScore,
        duration: formatClockTime(meta.duration),
        croppedUrl: objectUrl
      };

      setVideoQueue((prev) => [readyClip, ...prev]);
    }
    setAutoPublishStatus('');
  };

  const handleSplitFullVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsSplitterModalOpen(false);
    const count = Number(clipSplitCount) || 3;
    setAutoPublishStatus(`Cutting ${count} Clips...`);

    const rawName = customVideoTopic.trim() || file.name.replace(/\.[^/.]+$/, '');
    const meta = await readVideoMetadata(file);
    const totalDur = Math.max(15, meta.duration || 60);
    const segDur = Math.max(5, Math.floor(totalDur / count));
    const baseObjectUrl = URL.createObjectURL(file);
    const generated = [];

    for (let i = 0; i < count; i++) {
      const startSec = Math.floor(i * segDur);
      const endSec =
        i === count - 1 ? Math.floor(totalDur) : Math.min(Math.floor(totalDur), startSec + segDur);
      const clipLength = Math.max(1, endSec - startSec);
      const timeRangeLabel = `${formatClockTime(startSec)}–${formatClockTime(endSec)}`;
      const partLabel = count > 1 ? `Part ${i + 1}/${count}` : '';
      const aiMeta = buildClipPackage(
        rawName,
        i,
        partLabel,
        globalConfig.watermarkText || 'Developed by shortspilot.in'
      );

      generated.push({
        id: `${Date.now()}-${Math.random()}-${i}`,
        title: aiMeta.title,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        thumbnailHook: selectedThumbConcept?.hookText || 'WAIT FOR END 😱',
        thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        status: manualPostMode ? `Cut Ready (${timeRangeLabel})` : `Cut Clip (${timeRangeLabel})`,
        hookScore: aiMeta.hookScore,
        duration: formatClockTime(clipLength),
        croppedUrl: `${baseObjectUrl}#t=${startSec},${endSec}`
      });
    }

    setVideoQueue((prev) => [...generated, ...prev]);
    setAutoPublishStatus('');
  };

  const handleGenerateThumbnails = (e) => {
    e.preventDefault();
    const updated = buildThumbnailConcepts(thumbTopicInput || customVideoTopic || 'GTA 6');
    setThumbConcepts(updated);
    setSelectedThumbConcept(updated[0]);
  };

  const handleDeleteClip = (clipId) => {
    const target = videoQueue.find((c) => c.id === clipId);
    if (target?.croppedUrl && target.croppedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.croppedUrl.split('#')[0]);
    }
    setVideoQueue((prev) => prev.filter((item) => item.id !== clipId));
  };

  const handleClearAllClips = () => {
    videoQueue.forEach((c) => {
      if (c.croppedUrl && c.croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(c.croppedUrl.split('#')[0]);
      }
    });
    setVideoQueue([]);
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');
    const cleanEmail = (checkoutEmail || '').trim().toLowerCase();
    if (!cleanEmail) return setCheckoutError('Enter your contact email first.');
    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Enter valid 12-digit UTR number.');

    const amt =
      selectedBilling === 'yearly'
        ? Number(globalConfig.yearlyPrice || 3999)
        : Number(globalConfig.monthlyPrice || 99);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: cleanEmail,
      userKey: emailToKey(cleanEmail),
      plan: selectedBilling,
      utr: cleanUtr,
      numericAmount: amt,
      amount: `₹${amt} (${selectedBilling})`,
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

    setTransactions((prev) => [newTxn, ...prev]);
    setCheckoutPendingMsg('⏳ UTR Submitted! VIP will activate after verification.');
    setUtrNumber('');
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const msg = supportInput.trim();
    setSupportMessages((prev) => [
      ...prev,
      { role: 'user', text: msg },
      {
        role: 'ai',
        text: 'Video upload karein, AI Clip Cutter se 1/3/5 clips cut karein, ya 9:16 thumbnail banayein.'
      }
    ]);
    setSupportInput('');
  };

  const totalPostedCount = useMemo(() => videoQueue.length, [videoQueue.length]);

  return (
    <div className="min-h-screen w-full bg-[#05030a] text-slate-100 font-sans flex selection:bg-pink-500 selection:text-white">
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onOpenSplitter={() => setIsSplitterModalOpen(true)}
        onOpenThumbnail={() => setIsThumbnailModalOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        monthlyPrice={globalConfig.monthlyPrice || '99'}
        yearlyPrice={globalConfig.yearlyPrice || '3999'}
        videoCount={videoQueue.length}
      />

      <div className="flex-1 min-h-screen bg-[#070510] text-white flex flex-col">
        <TopHeader
          tier={tier}
          hasUnread={notificationsList.some((n) => n.unread)}
          onOpenDrawer={() => setIsSettingsDrawerOpen(true)}
          onGoHome={() => setActiveTab('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={splitterInputRef}
          type="file"
          accept="video/*"
          onChange={handleSplitFullVideo}
          className="hidden"
        />

        <div className="flex-1 w-full max-w-[460px] lg:max-w-6xl mx-auto px-4 lg:px-8 pt-3 lg:pt-6 pb-28 lg:pb-12 space-y-4 lg:space-y-6">
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-pink-600/20 border border-amber-400/50 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs lg:text-sm font-extrabold text-amber-300 truncate">
                        Shorts Feed Engine Active
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-200">
                        Clean Titles • Smart #Tags • shortspilot.in
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    PRO
                  </span>
                </div>

                {igData.connected ? (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-amber-500/15 border border-pink-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>{igData.username}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[9.5px] font-extrabold">
                            Connected ✅
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-pink-200/80 truncate">
                          Token saved
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-fuchsia-600/15 via-pink-600/15 to-amber-500/15 border border-pink-500/35 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>Instagram</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9.5px] font-extrabold">
                            Pending ⏳
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-400 truncate">
                          Add token anytime with minimal setup
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIgModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[10.5px] font-extrabold cursor-pointer shrink-0"
                    >
                      Add Token
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                <div className="rounded-[28px] p-5 lg:p-6 bg-gradient-to-br from-[#2a104e] via-[#150a2e] to-[#0c071d] border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="max-w-[65%] space-y-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-[9.5px] font-extrabold text-pink-300">
                        <Zap className="w-3 h-3 text-pink-400" /> Shorts Feed Engine
                      </span>
                      <h2 className="text-[22px] lg:text-[26px] font-extrabold text-white leading-[1.15] tracking-tight">
                        Publish to <br />
                        YouTube{' '}
                        <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                          Shorts
                        </span>
                      </h2>
                      <p className="text-[10.5px] lg:text-xs text-slate-300 font-medium">
                        Mode: {manualPostMode ? 'Manual Post' : selectedTimeSlot}
                      </p>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-pink-600/30 border border-purple-400/50 flex items-center justify-center relative cursor-pointer shadow-xl shrink-0 group"
                    >
                      <span className="absolute -top-1 right-0 px-2 py-0.5 rounded-md bg-cyan-500 text-[9px] font-extrabold text-black">
                        SHORT
                      </span>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={customVideoTopic}
                    onChange={(e) => setCustomVideoTopic(e.target.value)}
                    placeholder="Topic / game (e.g. GTA 6, Free Fire, BMW)..."
                    className="w-full px-3 py-2 rounded-xl bg-[#070412] border border-purple-500/35 text-xs text-white placeholder:text-slate-400"
                  />

                  {autoPublishStatus && (
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold text-center animate-pulse">
                      {autoPublishStatus}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 lg:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs lg:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {manualPostMode ? 'Upload to Manual Vault' : 'Upload & Publish to Shorts Feed'}
                    </span>
                  </button>
                </div>

                <div className="p-4 lg:p-6 rounded-[28px] bg-gradient-to-br from-[#231042] via-[#150b29] to-[#0c1428] border border-pink-500/50 flex flex-col justify-between space-y-3 shadow-[0_0_25px_rgba(236,72,153,0.22)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl bg-pink-500/25 border border-pink-400/50 flex items-center justify-center shrink-0">
                        <Scissors className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm lg:text-base font-extrabold text-white truncate">
                            AI Engaging Clips
                          </h3>
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/30 text-[8.5px] font-extrabold text-pink-200">
                            AUTO CUT
                          </span>
                        </div>
                        <p className="text-[10.5px] lg:text-xs text-slate-300">
                          Cut 1, 3, or 5 clips from any long video
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSplitterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-extrabold cursor-pointer shadow-md shrink-0"
                    >
                      Open Cutter
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setClipSplitCount(num)}
                        className={`py-2 lg:py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                          clipSplitCount === num
                            ? 'bg-pink-500/30 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)]'
                            : 'bg-[#0b0718] border-slate-800 text-slate-400'
                        }`}
                      >
                        {num} {num === 1 ? 'Clip' : 'Clips'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => splitterInputRef.current?.click()}
                    className="w-full py-2.5 lg:py-3.5 px-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs lg:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>
                      Select Long Video & Cut {clipSplitCount} {clipSplitCount === 1 ? 'Clip' : 'Clips'} Now
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
                <div className="p-4 rounded-[24px] bg-gradient-to-r from-[#0e1a2b] to-[#1a0c2e] border border-cyan-500/40 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">9:16 Shorts Thumbnail</h3>
                      <p className="text-[10.5px] text-slate-300">
                        Active Hook:{' '}
                        <span className="text-amber-300 font-bold">
                          {selectedThumbConcept?.hookText}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThumbnailModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-extrabold cursor-pointer shadow-md"
                  >
                    Create 9:16
                  </button>
                </div>

                <div className="p-4 rounded-[24px] bg-[#130c26] border border-purple-400/35 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Posting Control</h3>
                      <p className="text-[10.5px] text-slate-300">
                        Choose auto or manual upload mode
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setManualPostMode(!manualPostMode)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-extrabold cursor-pointer transition-all ${
                      manualPostMode
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                        : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                    }`}
                  >
                    {manualPostMode ? '⚡ Manual Post Active' : '🤖 Nearest Slot Auto'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
                <div
                  onClick={() => {
                    setSelectedBilling('monthly');
                    setIsPricingOpen(true);
                  }}
                  className="p-3.5 lg:p-5 rounded-2xl bg-gradient-to-b from-[#16102b] to-[#0c0818] border border-cyan-500/50 space-y-2 cursor-pointer hover:border-cyan-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-xs font-extrabold text-cyan-300 uppercase">
                      Monthly Pro
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[8.5px] font-extrabold text-cyan-300">
                      80% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base lg:text-2xl font-extrabold text-white">
                      ₹{globalConfig.monthlyPrice || '99'}
                    </span>
                    <span className="text-[11px] lg:text-sm text-slate-400 line-through">
                      ₹{globalConfig.monthlyOriginalPrice || '499'}
                    </span>
                    <span className="text-[9px] lg:text-xs text-slate-400">/mo</span>
                  </div>
                  <div className="text-xs lg:text-sm font-extrabold text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>50K+ Views</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedBilling('yearly');
                    setIsPricingOpen(true);
                  }}
                  className="p-3.5 lg:p-5 rounded-2xl bg-gradient-to-b from-[#221033] to-[#11081f] border border-amber-500/60 space-y-2 shadow-lg cursor-pointer hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-xs font-extrabold text-amber-300 uppercase">
                      Yearly VIP
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[8.5px] font-extrabold text-amber-300">
                      43% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base lg:text-2xl font-extrabold text-amber-400">
                      ₹{globalConfig.yearlyPrice || '3999'}
                    </span>
                    <span className="text-[11px] lg:text-sm text-slate-400 line-through">
                      ₹{globalConfig.yearlyOriginalPrice || '6999'}
                    </span>
                    <span className="text-[9px] lg:text-xs text-slate-400">/yr</span>
                  </div>
                  <div className="text-xs lg:text-sm font-extrabold text-white flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>100K+ Views</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setActiveTab('projects')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-blue-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-white">
                    {totalPostedCount}
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Queued Shorts</div>
                </div>
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-purple-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-purple-300">
                    {clipSplitCount} Clips
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Split Mode</div>
                </div>
                <div className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-amber-500/35 text-center">
                  <div className="text-sm lg:text-lg font-extrabold text-amber-400">10/10</div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Pro Score</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs lg:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-pink-400" /> Your Published & Cut Shorts
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className="text-[11px] lg:text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    View Vault ({videoQueue.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {videoQueue.slice(0, 6).map((clip) => (
                    <div
                      key={clip.id}
                      className="p-3.5 rounded-2xl bg-[#120c24] border border-purple-500/35 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewClip(clip)}
                            className={`w-12 h-16 rounded-xl bg-gradient-to-b ${
                              clip.thumbnailGradient || 'from-pink-600 to-slate-950'
                            } border border-purple-400/40 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center`}
                          >
                            <span className="text-[6.5px] font-black text-white leading-tight uppercase">
                              {clip.thumbnailHook || 'SHORT'}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white fill-white mt-0.5" />
                          </div>
                          <div className="min-w-0">
                            <h4
                              onClick={() => setPreviewClip(clip)}
                              className="text-xs font-extrabold text-white truncate cursor-pointer hover:text-pink-300"
                            >
                              {clip.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                {clip.status}
                              </span>
                              <span className="text-[9px] text-amber-300 font-bold">
                                Hook: {clip.hookScore}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClip(clip.id)}
                          className="p-1.5 text-rose-400 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[9.5px] text-cyan-300/90 font-mono truncate bg-[#080512] px-2.5 py-1.5 rounded-lg border border-slate-800">
                        {clip.hashtags}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 pt-2 max-w-3xl mx-auto">
              <h2 className="text-base lg:text-xl font-extrabold text-white">Studio Analytics</h2>
              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-1.5 text-xs">
                <div>
                  Instagram:{' '}
                  <b className={igData.connected ? 'text-emerald-400' : 'text-amber-300'}>
                    {igData.connected ? `Connected ✅ (${igData.username})` : 'Pending ⏳'}
                  </b>
                </div>
                <div>
                  Total Queued Clips: <b>{totalPostedCount}</b>
                </div>
                <div>
                  Split Clip Count: <b>{clipSplitCount}</b>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base lg:text-xl font-extrabold text-white">
                  Queue Vault ({videoQueue.length})
                </h2>
                {videoQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllClips}
                    className="text-xs text-rose-400 underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {videoQueue.length === 0 ? (
                <div className="p-10 rounded-3xl bg-[#110c22] border border-dashed border-purple-500/30 text-center space-y-3">
                  <p className="text-xs lg:text-sm text-slate-400">Queue Vault is currently empty.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-xs font-bold text-purple-200 cursor-pointer"
                  >
                    + Upload Short
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {videoQueue.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewClip(clip)}
                            className={`w-11 h-14 rounded-lg bg-gradient-to-b ${
                              clip.thumbnailGradient || 'from-pink-600 to-slate-950'
                            } border border-purple-400/30 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center`}
                          >
                            <span className="text-[6px] font-black text-white leading-tight uppercase">
                              {clip.thumbnailHook || 'SHORT'}
                            </span>
                            <Play className="w-3 h-3 text-white fill-white mt-0.5" />
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => setPreviewClip(clip)}
                              className="text-xs lg:text-sm font-bold text-white truncate cursor-pointer"
                            >
                              {clip.title}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold">
                              {clip.status} • {clip.duration}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClip(clip.id)}
                          className="p-1.5 text-rose-400 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-sans bg-[#070412] p-2.5 rounded-xl border border-slate-800 max-h-28 overflow-y-auto">
                        {clip.description}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 pt-2 max-w-2xl mx-auto">
              <h2 className="text-base lg:text-xl font-extrabold text-white">Settings</h2>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-pink-500/35 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5 text-pink-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs lg:text-sm font-extrabold text-white truncate">
                      {igData.connected ? igData.username : 'Instagram Token Connect'}
                    </div>
                    <div className="text-[10px] lg:text-xs text-slate-400 truncate">
                      {igData.connected
                        ? 'Connected ✅'
                        : 'Pending ⏳ — add token easily anytime'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIgModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold cursor-pointer shrink-0"
                >
                  {igData.connected ? 'Update Token' : 'Add Token'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPricingOpen(true)}
                className="w-full py-3 rounded-2xl bg-amber-500 text-black text-xs font-extrabold cursor-pointer shadow-lg"
              >
                🔥 View Offer Plans (₹{globalConfig.monthlyPrice}/mo & ₹{globalConfig.yearlyPrice}/yr)
              </button>

              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                className="w-full py-3 rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer shadow-lg"
              >
                🔐 Open Owner Master Admin Console
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAiSupport(true)}
          aria-label="Floating AI Support"
          className="fixed bottom-22 lg:bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Bot className="w-6 h-6" />
        </button>

        <MobileBottomNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      </div>

      {isIgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <form
            onSubmit={handleSaveInstagramToken}
            className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-pink-500/50 p-6 space-y-3"
          >
            <button
              type="button"
              onClick={() => setIsIgModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-300" /> Instagram Token Connect
            </h3>
            <input
              type="text"
              required
              value={igUsernameDraft}
              onChange={(e) => setIgUsernameDraft(e.target.value)}
              placeholder="@your_instagram"
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-pink-300 font-mono"
            />
            <input
              type="text"
              required
              value={igTokenDraft}
              onChange={(e) => setIgTokenDraft(e.target.value)}
              placeholder="Paste Instagram Token..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-cyan-300 font-mono"
            />
            {igError && <p className="text-xs text-rose-400 font-bold">{igError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Save & Connect Instagram
            </button>
          </form>
        </div>
      )}

      {isThumbnailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/50 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsThumbnailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-300" />
              <h3 className="text-base font-extrabold text-white">9:16 Shorts Thumbnail Generator</h3>
            </div>

            <form onSubmit={handleGenerateThumbnails} className="flex gap-2">
              <input
                type="text"
                value={thumbTopicInput}
                onChange={(e) => setThumbTopicInput(e.target.value)}
                placeholder="Enter topic (e.g. GTA 6, Free Fire)..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#06040c] border border-cyan-500/40 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Generate
              </button>
            </form>

            <div className="grid grid-cols-3 gap-2.5">
              {thumbConcepts.map((item) => {
                const isSelected = selectedThumbConcept?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedThumbConcept(item)}
                    className={`aspect-[9/16] rounded-2xl bg-gradient-to-b ${item.gradient} p-2.5 flex flex-col justify-between border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 scale-[1.02] shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                        : 'border-white/15 opacity-85'
                    }`}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-[7px] font-extrabold text-white self-start">
                      {item.badge}
                    </span>
                    <div className="text-center space-y-1 my-auto">
                      <div className="text-xs font-black text-white leading-tight drop-shadow">
                        {item.hookText}
                      </div>
                      <div className={`text-[8.5px] font-extrabold ${item.accentText} truncate`}>
                        {item.subText}
                      </div>
                    </div>
                    <div className="text-[7.5px] font-extrabold text-emerald-300 bg-black/50 rounded px-1.5 py-0.5 text-center">
                      {item.ctrScore}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsThumbnailModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Apply Selected 9:16 Thumbnail ({selectedThumbConcept?.hookText})
            </button>
          </div>
        </div>
      )}

      {isSplitterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-pink-500/50 p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsSplitterModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-extrabold text-white">AI Engaging Clips Auto-Splitter</h3>
            </div>
            <p className="text-xs text-slate-300">
              Select how many viral clips you want AI to cut from your full-length video:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setClipSplitCount(count)}
                  className={`py-3 rounded-2xl border text-xs font-extrabold cursor-pointer ${
                    clipSplitCount === count
                      ? 'bg-pink-600 border-pink-400 text-white shadow-lg'
                      : 'bg-[#130c26] border-slate-700 text-slate-300'
                  }`}
                >
                  {count} {count === 1 ? 'Clip' : 'Clips'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customVideoTopic}
              onChange={(e) => setCustomVideoTopic(e.target.value)}
              placeholder="Topic / game (e.g. GTA 6, Free Fire)..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-purple-500/40 text-xs text-white"
            />
            <button
              type="button"
              onClick={() => splitterInputRef.current?.click()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Select Full Video & Cut {clipSplitCount} {clipSplitCount === 1 ? 'Clip' : 'Clips'}
            </button>
          </div>
        </div>
      )}

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsPricingOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold">
                LIMITED TIME LAUNCH OFFER
              </span>
              <h3 className="text-base font-extrabold text-white">
                Choose Your ShortsPilot Offer Plan
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedBilling('monthly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer ${
                  selectedBilling === 'monthly'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-[#120d24] border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-extrabold text-cyan-300">MONTHLY PRO</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-extrabold text-white">
                    ₹{globalConfig.monthlyPrice || '99'}
                  </span>
                  <span className="text-xs line-through text-slate-500">₹499</span>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-bold mt-1">
                  50K+ Views Guarantee
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBilling('yearly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer ${
                  selectedBilling === 'yearly'
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-[#120d24] border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-extrabold text-amber-300">YEARLY VIP</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-extrabold text-amber-400">
                    ₹{globalConfig.yearlyPrice || '3999'}
                  </span>
                  <span className="text-xs line-through text-slate-500">₹6999</span>
                </div>
                <div className="text-[9.5px] text-amber-200 font-bold mt-1">
                  100K+ Views Guarantee
                </div>
              </button>
            </div>

            {upgradeReason && <p className="text-xs text-amber-200">{upgradeReason}</p>}

            <form onSubmit={handleVerifyPayment} className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#120d24] border border-emerald-500/30 text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Pay UPI: <b className="text-emerald-400 font-mono">{globalConfig.receiverUpi}</b>
                </span>
                <span className="font-extrabold text-white">
                  ₹
                  {selectedBilling === 'yearly'
                    ? globalConfig.yearlyPrice || '3999'
                    : globalConfig.monthlyPrice || '99'}
                </span>
              </div>
              <input
                type="email"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder="Enter Your Email ID"
                className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
              />
              <input
                type="tel"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-Digit Payment UTR Number"
                className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white font-mono"
              />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-xs cursor-pointer shadow-lg"
              >
                Submit UTR & Unlock ₹
                {selectedBilling === 'yearly'
                  ? globalConfig.yearlyPrice || '3999'
                  : globalConfig.monthlyPrice || '99'}{' '}
                Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 lg:hidden">
          <div className="w-68 bg-[#0b0818] border-r border-purple-500/30 h-full p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-extrabold text-sm text-white">ShortsPilot AI</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('home');
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-slate-200 cursor-pointer"
                >
                  Home Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsIgModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-pink-300 flex items-center justify-between cursor-pointer"
                >
                  <span>📸 Instagram</span>
                  <span className="text-[10px] text-amber-300">
                    {igData.connected ? 'Connected ✅' : 'Pending ⏳'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSplitterModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-pink-300 cursor-pointer"
                >
                  ✂️ AI Engaging Clips (1, 3, 5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsThumbnailModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-cyan-300 cursor-pointer"
                >
                  🎨 9:16 Shorts Thumbnail Gen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPricingOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-amber-300 cursor-pointer"
                >
                  🔥 Offer Plans (₹99 / ₹3,999)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-slate-300 cursor-pointer"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-rose-400 cursor-pointer"
                >
                  🔐 Owner Admin Console
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">Developed by shortspilot.in</div>
          </div>
          <div className="flex-1" onClick={() => setIsSettingsDrawerOpen(false)} />
        </div>
      )}

      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
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

      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[420px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-xs font-extrabold text-white">ShortsPilot AI Support</span>
              <button
                type="button"
                onClick={() => setShowAiSupport(false)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
              {supportMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white ml-6'
                      : 'bg-[#140e28] text-slate-200 mr-6'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendSupport} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-4 space-y-3 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPreviewClip(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900 text-white cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs font-extrabold text-white text-center pr-6 truncate">
              {previewClip.title}
            </div>

            <div className="relative w-full max-w-[230px] mx-auto rounded-2xl overflow-hidden border border-purple-500/40">
              <video
                src={sanitizeMediaUrl(previewClip.croppedUrl)}
                controls
                autoPlay
                playsInline
                className="w-full aspect-[9/16] bg-black"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/65 border border-white/15 text-[8.5px] font-extrabold text-cyan-300 pointer-events-none">
                {previewClip.watermarkText || 'Developed by shortspilot.in'}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="text-[10px] font-extrabold text-pink-300">Description & #Tags:</div>
              <pre className="text-[10px] text-slate-200 whitespace-pre-wrap font-sans bg-[#06040c] p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                {previewClip.description}
              </pre>
            </div>
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/50 p-6 space-y-3 max-h-[88vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white">🔐 Owner Admin Console</h3>

            {!adminUnlocked ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPinInput.trim() === (globalConfig.adminPin || '9767905729')) {
                    setAdminUnlocked(true);
                    setAdminError('');
                    fetchFirebaseData();
                  } else {
                    setAdminError('Invalid Admin PIN.');
                  }
                }}
                className="space-y-2.5"
              >
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="Enter Admin PIN"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
                />
                {adminError && <p className="text-xs text-rose-400">{adminError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  Unlock Admin
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#120d24] border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-300">Pricing & UPI</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={globalConfig.monthlyPrice}
                      onChange={(e) =>
                        setGlobalConfig((prev) => ({ ...prev, monthlyPrice: e.target.value }))
                      }
                      placeholder="Monthly Price"
                      className="px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      value={globalConfig.yearlyPrice}
                      onChange={(e) =>
                        setGlobalConfig((prev) => ({ ...prev, yearlyPrice: e.target.value }))
                      }
                      placeholder="Yearly Price"
                      className="px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={globalConfig.receiverUpi}
                    onChange={(e) =>
                      setGlobalConfig((prev) => ({ ...prev, receiverUpi: e.target.value }))
                    }
                    placeholder="Receiver UPI"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white font-mono"
                  />
                  <input
                    type="text"
                    value={liveDbUrl}
                    onChange={(e) => setLiveDbUrl(e.target.value)}
                    placeholder="Firebase RTDB URL"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
                      localStorage.setItem('sp_firebase_url', liveDbUrl);
                      setTier('pro');
                      if (dbBase) {
                        try {
                          await fetch(`${dbBase}/siteConfig.json`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(globalConfig)
                          });
                        } catch {}
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold cursor-pointer"
                  >
                    Save Config
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-amber-300">
                    Transactions ({transactions.length})
                  </div>
                  {transactions.slice(0, 8).map((t, idx) => (
                    <div
                      key={t.firebaseKey || t.id || idx}
                      className="p-2.5 rounded-xl bg-[#120d24] border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div className="truncate">
                        <b>{t.user}</b> • {t.amount} • UTR: <span className="font-mono">{t.utr}</span>
                      </div>
                      <span className="text-amber-300 font-bold ml-2">{t.status || 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
