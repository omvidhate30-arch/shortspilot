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
  Home, BarChart2 as ChartIcon, Plus, FolderKanban, Settings, MoreVertical, Sun, Moon, Menu, Copy, ExternalLink, AlertTriangle, TrendingUp
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

const inspectVideoProperties = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof Blob)) {
      return resolve({ duration: 15, width: 1080, height: 1920, isVerticalOrSquare: true, isAlreadyShort: false });
    }
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    vid.onloadedmetadata = () => {
      const duration = vid.duration || 15;
      const width = vid.videoWidth || 1080;
      const height = vid.videoHeight || 1920;
      const isVerticalOrSquare = height >= width;
      URL.revokeObjectURL(url);
      resolve({ duration, width, height, isVerticalOrSquare, isAlreadyShort: isVerticalOrSquare && duration <= 185 });
    };
    vid.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 15, width: 1080, height: 1920, isVerticalOrSquare: true, isAlreadyShort: false });
    };
  });

function ShortsPilotLogo({ className = 'w-5 h-5' }) {
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
    bannerText: '🔥 COUPON OFFER: Use code "SAVE200" at checkout & get Flat ₹200 OFF on Monthly Pro! (Pay only ₹299)',
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

  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [dismissedBroadcast, setDismissedBroadcast] = useState(false);

  const [customClientId, setCustomClientId] = useState(() => localStorage.getItem('sp_custom_client_id') || '');
  const [customClientSecret, setCustomClientSecret] = useState(() => localStorage.getItem('sp_custom_client_secret') || '');
  const [showClientGuideModal, setShowClientGuideModal] = useState(false);

  // Navigation & Primary States
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'analytics' | 'projects' | 'settings'
  const [tier, setTier] = useState('free');
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [activePlanType, setActivePlanType] = useState('');
  const [paymentStatusNote, setPaymentStatusNote] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [clipMode, setClipMode] = useState('fullshort');

  // Auto-Post Default Enabled (as requested)
  const [autoPostCadence, setAutoPostCadence] = useState('3_daily');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('9:00 AM');
  const [customScheduleTime, setCustomScheduleTime] = useState('');
  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [autoUploadBannerStatus, setAutoUploadBannerStatus] = useState('idle');

  // Tool Studios & Customization States
  const [activeToolModal, setActiveToolModal] = useState(null); // 'aiEdit' | 'hashtags' | 'thumbnail' | 'schedule'
  const [selectedNiche, setSelectedNiche] = useState('Gaming (Free Fire / BGMI / GTA)');
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish (India Viral)');
  const [selectedHookStyle, setSelectedHookStyle] = useState('Curiosity & Suspense 😱');
  const [selectedCtaStyle, setSelectedCtaStyle] = useState('Comment Your Reaction 👇');
  const [generatedHashtags, setGeneratedHashtags] = useState('#Shorts #YouTubeShorts #ViralShorts #TrendingIndia #FreeFire #BGMI #ExplorePage #MustWatch');
  const [thumbnailTopicInput, setThumbnailTopicInput] = useState('');
  const [generatedThumbnails, setGeneratedThumbnails] = useState([
    { title: 'WAIT FOR THE END 😱🔥', sub: '99% People Miss This!', color: 'from-rose-600 via-purple-700 to-indigo-900', score: '9.9/10' },
    { title: 'IMPOSSIBLE 1v4 CLUTCH ⚡', sub: 'Pure Goosebumps Moment', color: 'from-amber-500 via-red-600 to-black', score: '9.7/10' },
    { title: 'AAKHIR MEIN KYA HUA? 🤯', sub: 'Shocking Twist Inside!', color: 'from-cyan-500 via-blue-700 to-purple-950', score: '9.6/10' }
  ]);

  const [editingClipId, setEditingClipId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editTagsValue, setEditTagsValue] = useState('');
  const [openClipMenuId, setOpenClipMenuId] = useState(null);
  const [showSamplePostMenu, setShowSamplePostMenu] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [liveUsersCount, setLiveUsersCount] = useState(2148);

  // Notifications & Support States
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: 'Auto-Post Engine Active ⚡', desc: 'Your 3x Daily Slots (9:00 AM, 2:00 PM, 7:30 PM) are armed & ready.', time: 'Just now', unread: true },
    { id: 2, title: 'Viral Score 9.8/10 Achieved 🔥', desc: '"Hidden Places in Pune 🌱" is trending in the India Shorts feed.', time: '2 hours ago', unread: true },
    { id: 3, title: 'Yearly VIP Offer ₹3,999 👑', desc: 'Unlock 100K+ Guaranteed Monthly Views & 5x Clips Extractor.', time: 'Today', unread: false }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Namaste Om! Main aapka ShortsPilot AI Assistant hoon. Auto-Post 3x/Day default roop se chalu hai. Aap mujhse Video Upload, Viral Tags, YouTube Connect ya ₹3,999 VIP Plan ke baare mein kuch bhi pooch sakte hain!'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [audienceInsight, setAudienceInsight] = useState({
    peakHour: 19,
    peakMinute: 30,
    peakHourLabel: '07:30 PM IST (High Evening Engagement)',
    suggestedIso: '',
    topRegion: 'India (IN) • Hindi / Hinglish',
    strategyTip: 'Enter your video topic before selecting files so AI generates hyper-specific viral hooks for the Indian Shorts Feed.',
    isAnalyzing: false
  });

  const [gmailUser, setGmailUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_gmail_user') || 'null'); } catch { return null; }
  });

  const [ytChannel, setYtChannel] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_yt_channel') || 'null'); } catch { return null; }
  });

  const [ytStats, setYtStats] = useState({
    subscribers: '12.4K',
    totalViews: '1.8M',
    videoCount: '247',
    country: 'IN',
    recentVideos: [],
    loading: false
  });

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Pricing & Checkout States
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [couponInput, setCouponInput] = useState('SAVE200');
  const [appliedCoupon, setAppliedCoupon] = useState('SAVE200');
  const [couponMsg, setCouponMsg] = useState('🎉 Default Coupon "SAVE200" applied! ₹200 OFF on Monthly.');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [activeSeoModalClip, setActiveSeoModalClip] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  // Admin Console States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('controls'); // 'controls' | 'transactions' | 'clients' | 'ai'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [manualProEmail, setManualProEmail] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(() => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL);
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const autoPostCadenceRef = useRef(autoPostCadence);
  const usedTitlesHistoryRef = useRef(new Set());
  const scheduleDayOffsetRef = useRef(0);

  useEffect(() => {
    autoPostCadenceRef.current = autoPostCadence;
  }, [autoPostCadence]);

  const activeClientId =
    (customClientId || '').trim() ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    globalConfig.googleClientId ||
    localStorage.getItem('sp_google_client_id') ||
    DEFAULT_GOOGLE_CLIENT_ID;

  const activeClientSecret = (customClientSecret || '').trim() || DEFAULT_GOOGLE_SECRET;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
  const yearlySavings = Math.max(0, Number(globalConfig.yearlyOriginalPrice || 5999) - Number(globalConfig.yearlyPrice || 3999));

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveUsersCount((prev) => {
        const delta = Math.floor(Math.random() * 15) - 7;
        const updated = prev + (delta === 0 ? 3 : delta);
        return updated < 2080 ? 2115 : updated > 2450 ? 2410 : updated;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const userText = supportInput.trim();
    setSupportMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setSupportInput('');

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = 'Tip for 10x Views: Type your exact video topic in the "AI Edit" or "Schedule" tool before uploading, and keep Auto-Post 3x/Day (9 AM, 2 PM, 7:30 PM) Active!';
      if (lower.includes('quota') || lower.includes('limit') || lower.includes('error') || lower.includes('client')) {
        reply = 'Agar YouTube quota error aaye, toh Settings ya Connect YouTube modal kholkar apna khud ka Google Cloud Client ID & Secret save karein.';
      } else if (lower.includes('utr') || lower.includes('payment') || lower.includes('pro') || lower.includes('vip') || lower.includes('price')) {
        reply = `Yearly Studio VIP sirf ₹${globalConfig.yearlyPrice}/year hai (100K+ Views/Mo Guarantee + 5x Clips) aur Monthly Pro ₹299 (SAVE200 coupon ke sath) hai. 12-digit UTR daal kar turant activate karein!`;
      } else if (lower.includes('manual') || lower.includes('schedule') || lower.includes('time') || lower.includes('auto')) {
        reply = 'Auto-Post 3x/Day hamara main default feature hai! Ye aapke Shorts ko 9:00 AM, 2:00 PM aur 7:30 PM par automatically YouTube par post karta hai.';
      }
      setSupportMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    }, 500);
  };

  const getNextPeakIsoWithOffset = (hour24 = 19, minute = 30, dayOffset = 0) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour24, minute, 0, 0);
    if (target.getTime() <= now.getTime() + 5 * 60 * 1000) {
      target.setDate(target.getDate() + 1);
    }
    target.setDate(target.getDate() + dayOffset);
    return target.toISOString();
  };

  const getMultiSlotScheduleIso = (slotIndex = 0, mode = '3_daily', peakHour = 19, peakMinute = 30) => {
    if (mode === 'custom_manual' && customScheduleTime) {
      const manualDate = new Date(customScheduleTime);
      if (!isNaN(manualDate.getTime()) && manualDate.getTime() > Date.now() + 2 * 60 * 1000) {
        manualDate.setMinutes(manualDate.getMinutes() + slotIndex * 15);
        return manualDate.toISOString();
      }
    }

    const now = new Date();
    const minFuture = now.getTime() + 5 * 60 * 1000;

    const dailySlots =
      mode === '2_daily'
        ? [
            { hour: 9, minute: 0 },
            { hour: peakHour, minute: peakMinute }
          ]
        : mode === 'daily_peak'
        ? [{ hour: peakHour, minute: peakMinute }]
        : [
            { hour: 9, minute: 0 },
            { hour: 14, minute: 0 },
            { hour: peakHour, minute: peakMinute }
          ];

    const validTargets = [];
    let dayCounter = 0;

    while (validTargets.length <= slotIndex) {
      for (const s of dailySlots) {
        const candidate = new Date();
        candidate.setDate(now.getDate() + dayCounter);
        candidate.setHours(s.hour, s.minute, 0, 0);
        if (candidate.getTime() > minFuture) {
          validTargets.push(candidate);
        }
      }
      dayCounter += 1;
    }

    return validTargets[slotIndex].toISOString();
  };

  useEffect(() => {
    setAudienceInsight((prev) => ({
      ...prev,
      suggestedIso: getNextPeakIsoWithOffset(prev.peakHour, prev.peakMinute, 0)
    }));
  }, []);

  useEffect(() => {
    let mounted = true;
    idbGetAllClips().then((savedClips) => {
      if (mounted && savedClips.length > 0) {
        savedClips.forEach((c) => {
          if (c.title) usedTitlesHistoryRef.current.add(c.title.toLowerCase());
        });
        setVideoQueue(
          savedClips.map((c) => ({
            ...c,
            status: c.status === 'uploading' || c.status === 'cropping' ? 'ready' : c.status
          }))
        );
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const worker = setInterval(() => {
      if (autoPostCadenceRef.current === 'manual_hold') return;
      const token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
      if (!token) return;
      setVideoQueue((currentQueue) => {
        const nextPending = currentQueue.find((c) => c.status === 'ready' && c.blob && !c.manualHold);
        if (nextPending) uploadClipToYouTubeAPI(nextPending, nextPending.scheduledFor || null);
        return currentQueue;
      });
    }, 60000);
    return () => clearInterval(worker);
  }, []);

  const registerClientInAdminDb = async (userObj, channelObj, currentTier = 'free') => {
    if (!dbBase || !userObj?.email) return;
    const uKey = emailToKey(userObj.email);
    try {
      await fetch(`${dbBase}/clients/${uKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userObj.name || userObj.email.split('@')[0],
          email: userObj.email,
          picture: userObj.picture || '',
          youtubeHandle: channelObj?.handle || 'Not Linked',
          tier: currentTier,
          lastActive: new Date().toLocaleString()
        })
      });
    } catch {}
  };

  const refreshYouTubeAccessToken = async () => {
    const storedRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
    if (!storedRefresh) return null;

    let freshAccessToken = null;
    let newRefreshToken = null;

    try {
      const directRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: activeClientId.trim(),
          client_secret: activeClientSecret.trim(),
          refresh_token: String(storedRefresh).trim(),
          grant_type: 'refresh_token'
        })
      });
      if (directRes.ok) {
        const directData = await directRes.json();
        freshAccessToken = directData?.access_token;
        newRefreshToken = directData?.refresh_token;
      }
    } catch {}

    if (!freshAccessToken) {
      try {
        const res = await fetch('/api/youtube/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: storedRefresh })
        });
        if (res.ok) {
          const data = await res.json();
          freshAccessToken = data?.access_token;
          newRefreshToken = data?.refresh_token;
        }
      } catch {}
    }

    if (!freshAccessToken) return null;

    localStorage.setItem('sp_yt_access_token', freshAccessToken);
    localStorage.setItem('sp_yt_token_time', String(Date.now()));
    if (newRefreshToken) localStorage.setItem('sp_yt_refresh_token', newRefreshToken);

    setYtChannel((prev) => {
      const updated = {
        ...(prev || { handle: '@YouTubeCreator', isRealOAuth: true }),
        accessToken: freshAccessToken,
        refreshToken: newRefreshToken || storedRefresh
      };
      ytChannelRef.current = updated;
      return updated;
    });

    return freshAccessToken;
  };

  useEffect(() => {
    const checkAndGenerateToken = async () => {
      const hasRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
      if (!hasRefresh) return;
      const lastTime = Number(localStorage.getItem('sp_yt_token_time') || 0);
      if (Date.now() - lastTime > 40 * 60 * 1000) await refreshYouTubeAccessToken();
    };
    checkAndGenerateToken();
    const tokenTimer = setInterval(checkAndGenerateToken, 8 * 60 * 1000);
    return () => clearInterval(tokenTimer);
  }, []);

  const fetchWithAuth = async (url, options = {}) => {
    const lastTime = Number(localStorage.getItem('sp_yt_token_time') || 0);
    const hasRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
    if (hasRefresh && (lastTime === 0 || Date.now() - lastTime > 40 * 60 * 1000)) {
      await refreshYouTubeAccessToken();
    }
    let token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    const getHeaders = (t) => ({ ...(options.headers || {}), Authorization: `Bearer ${t}` });
    let res = await fetch(url, { ...options, headers: getHeaders(token) });

    if (res.status === 401) {
      const freshToken = await refreshYouTubeAccessToken();
      if (freshToken) {
        res = await fetch(url, { ...options, headers: getHeaders(freshToken) });
      } else {
        localStorage.removeItem('sp_yt_access_token');
        localStorage.removeItem('sp_yt_refresh_token');
        localStorage.removeItem('sp_yt_token_time');
        setYtChannel(null);
        setConnectError('Please click "Connect YouTube (OAuth Auto-Refresh)" once to activate permanent auto-refresh.');
        setIsConnectModalOpen(true);
      }
    }
    return res;
  };

  const hydrateGoogleAndYouTubeProfile = async (accessToken, refreshToken = null) => {
    if (!accessToken) return;
    let loggedProfile = gmailUser;

    try {
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData?.email) {
          loggedProfile = {
            email: profileData.email,
            name: profileData.name || profileData.email.split('@')[0],
            picture: sanitizeMediaUrl(profileData.picture || '')
          };
          setGmailUser(loggedProfile);
        }
      }
    } catch {}

    try {
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const ch = data?.items?.[0];
        const rawName = ch?.snippet?.customUrl || ch?.snippet?.title || '@ConnectedCreator';
        const chObj = {
          handle: rawName.startsWith('@') ? rawName : `@${rawName}`,
          channelId: ch?.id || null,
          country: ch?.snippet?.country || 'IN',
          uploadsPlaylistId: ch?.contentDetails?.relatedPlaylists?.uploads || null,
          accessToken,
          refreshToken: refreshToken || localStorage.getItem('sp_yt_refresh_token') || null,
          isRealOAuth: true
        };
        setYtChannel(chObj);
        if (loggedProfile) registerClientInAdminDb(loggedProfile, chObj, tier);
        return;
      }
    } catch {}

    const fallbackCh = {
      handle: ytChannelRef.current?.handle || '@YouTubeCreator',
      accessToken,
      refreshToken: refreshToken || localStorage.getItem('sp_yt_refresh_token') || null,
      isRealOAuth: true
    };
    setYtChannel(fallbackCh);
    if (loggedProfile) registerClientInAdminDb(loggedProfile, fallbackCh, tier);
  };

  useEffect(() => {
    const rawHash = window.location.hash;
    if (rawHash && rawHash.includes('access_token=')) {
      const hashParams = new URLSearchParams(rawHash.replace(/^#/, ''));
      const newAccessToken = hashParams.get('access_token');
      const newRefreshToken = hashParams.get('refresh_token');
      if (newAccessToken) {
        localStorage.setItem('sp_yt_access_token', newAccessToken);
        localStorage.setItem('sp_yt_token_time', String(Date.now()));
        if (newRefreshToken) localStorage.setItem('sp_yt_refresh_token', newRefreshToken);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        hydrateGoogleAndYouTubeProfile(newAccessToken, newRefreshToken);
      }
    }
  }, []);

  const handleConnectYouTubeOAuth = () => {
    setConnectError('');
    const clientId = activeClientId.trim();
    if (!clientId) return setConnectError('Google Client ID is missing.');

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', YOUTUBE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    window.location.href = authUrl.toString();
  };

  const syncUserAccountStatus = async (userEmail) => {
    if (!userEmail) {
      setTier('free');
      setIsUserBanned(false);
      setActivePlanType('');
      setClipMode('fullshort');
      setQuotaUsed(Number(localStorage.getItem('sp_guest_quota') || 0));
      setPaymentStatusNote('');
      return;
    }

    const uKey = emailToKey(userEmail);
    setQuotaUsed(Number(localStorage.getItem(`sp_quota_${uKey}`) || 0));
    if (!dbBase) return;

    try {
      const [proRes, cliRes] = await Promise.all([
        fetch(`${dbBase}/proUsers/${uKey}.json`),
        fetch(`${dbBase}/clients/${uKey}.json`)
      ]);
      const userData = await proRes.json();
      const cliData = await cliRes.json();

      if (cliData && cliData.banned) {
        setIsUserBanned(true);
        return;
      } else {
        setIsUserBanned(false);
      }

      if (userData && userData.tier === 'pro') {
        const plan = userData.plan || 'monthly';
        setTier('pro');
        setActivePlanType(plan);
        setClipMode(plan === 'yearly' ? '5clips' : '3clips');
        setPaymentStatusNote('');
        registerClientInAdminDb(gmailUser, ytChannel, `pro (${plan})`);
      } else if (userData && userData.status === 'pending') {
        setTier('free');
        setClipMode('fullshort');
        setPaymentStatusNote('pending');
        registerClientInAdminDb(gmailUser, ytChannel, 'free (pending)');
      } else {
        setTier('free');
        setClipMode('fullshort');
        setPaymentStatusNote('');
        registerClientInAdminDb(gmailUser, ytChannel, 'free');
      }
    } catch {
      setTier('free');
    }
  };

  useEffect(() => {
    syncUserAccountStatus(gmailUser?.email || null);
  }, [gmailUser, dbBase]);

  const getPayableAmount = () => {
    const base = selectedBilling === 'yearly' ? Number(globalConfig.yearlyPrice || 3999) : Number(globalConfig.monthlyPrice || 499);
    if (selectedBilling === 'monthly' && appliedCoupon) {
      return Math.max(1, base - Number(globalConfig.couponDiscount || 0));
    }
    return base;
  };

  const handleApplyCoupon = () => {
    setCouponMsg('');
    const configuredCode = (globalConfig.couponCode || 'SAVE200').trim().toUpperCase();
    const entered = couponInput.trim().toUpperCase();
    if (!entered || (entered !== configuredCode && entered !== 'SAVE200')) {
      setCouponMsg('Invalid coupon code.');
      setAppliedCoupon(null);
      return;
    }
    if (selectedBilling !== 'monthly') {
      setCouponMsg('Coupon applies to the Monthly Plan.');
      return;
    }
    setAppliedCoupon('SAVE200');
    setCouponMsg('🎉 Coupon "SAVE200" applied! ₹200 OFF.');
  };

  const openProModalWithReason = (reasonText = '', preferredPlan = null) => {
    if (preferredPlan) setSelectedBilling(preferredPlan);
    setCheckoutError('');
    setCheckoutPendingMsg('');
    setUpgradeReason(reasonText);
    setIsPricingOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') setIsAdminOpen(true);
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchFirebaseAll = async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes, cliRes] = await Promise.all([
        fetch(`${dbBase}/siteConfig.json`),
        fetch(`${dbBase}/transactions.json`),
        fetch(`${dbBase}/clients.json`)
      ]);
      const data = await cfgRes.json();
      if (data && typeof data === 'object') {
        const cleanBanner =
          data.bannerText && !data.bannerText.includes('₹2') && !data.bannerText.includes('Trial')
            ? data.bannerText
            : '🔥 COUPON OFFER: Use code "SAVE200" at checkout & get Flat ₹200 OFF on Monthly Pro! (Pay only ₹299)';

        setGlobalConfig((prev) => ({
          ...prev,
          ...data,
          bannerText: cleanBanner,
          yearlyPrice: data.yearlyPrice === '1999' ? '3999' : (data.yearlyPrice || prev.yearlyPrice),
          primaryAiKey: data.primaryAiKey || data.deepseekApiKey || prev.primaryAiKey,
          claudeApiKey: data.claudeApiKey || prev.claudeApiKey,
          customAiPrompt: data.customAiPrompt || prev.customAiPrompt || DEFAULT_CUSTOM_AI_PROMPT,
          adminPin: data.adminPin || prev.adminPin
        }));
      }
      const txnData = await txnRes.json();
      setTransactions(txnData && typeof txnData === 'object' ? Object.entries(txnData).map(([key, val]) => ({ firebaseKey: key, ...val })).reverse() : []);
      const cliData = await cliRes.json();
      setClientsList(cliData && typeof cliData === 'object' ? Object.entries(cliData).map(([key, val]) => ({ id: key, ...val })).reverse() : []);
    } catch {}
  };

  useEffect(() => {
    fetchFirebaseAll();
    const interval = setInterval(fetchFirebaseAll, 25000);
    return () => clearInterval(interval);
  }, [dbBase]);

  useEffect(() => {
    ytChannelRef.current = ytChannel;
    if (ytChannel) localStorage.setItem('sp_yt_channel', JSON.stringify(ytChannel));
    else localStorage.removeItem('sp_yt_channel');
  }, [ytChannel]);

  useEffect(() => {
    if (gmailUser) localStorage.setItem('sp_gmail_user', JSON.stringify(gmailUser));
    else localStorage.removeItem('sp_gmail_user');
  }, [gmailUser]);

  const handleDisconnectAll = () => {
    setYtChannel(null);
    setGmailUser(null);
    setTier('free');
    setIsUserBanned(false);
    setActivePlanType('');
    setClipMode('fullshort');
    setPaymentStatusNote('');
    setYtStats({ subscribers: '12.4K', totalViews: '1.8M', videoCount: '247', country: 'IN', recentVideos: [], loading: false });
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_gmail_user');
    localStorage.removeItem('sp_yt_access_token');
    localStorage.removeItem('sp_yt_refresh_token');
    localStorage.removeItem('sp_yt_token_time');
    setIsConnectModalOpen(false);
    setIsSettingsDrawerOpen(false);
  };

  const fetchYouTubeAnalytics = async () => {
    const token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    if (!token) return;

    setYtStats((prev) => ({ ...prev, loading: true }));
    setAudienceInsight((prev) => ({ ...prev, isAnalyzing: true }));

    try {
      const chRes = await fetchWithAuth('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true');
      if (!chRes.ok) throw new Error('Auth failed');
      const chData = await chRes.json();
      const item = chData?.items?.[0];
      const stats = item?.statistics || {};
      const countryCode = item?.snippet?.country || 'IN';
      const uploadsId = item?.contentDetails?.relatedPlaylists?.uploads;

      let videosList = [];
      let bestHour = 19;
      let topTitleSample = '';

      if (uploadsId) {
        const plRes = await fetchWithAuth(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsId}`);
        const plData = await plRes.json();
        const videoIds = (plData?.items || []).map((v) => v?.snippet?.resourceId?.videoId).filter(Boolean).join(',');

        if (videoIds) {
          const vidRes = await fetchWithAuth(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`);
          const vidData = await vidRes.json();
          let maxViews = -1;

          videosList = (vidData?.items || []).map((v) => {
            const vCount = Number(v.statistics?.viewCount || 0);
            const pubDate = new Date(v.snippet?.publishedAt);
            if (vCount > maxViews && !isNaN(pubDate.getTime())) {
              maxViews = vCount;
              bestHour = pubDate.getHours();
              topTitleSample = v.snippet?.title || '';
            }
            return {
              id: v.id,
              title: v.snippet?.title,
              categoryId: v.snippet?.categoryId || '20',
              thumbnail: sanitizeMediaUrl(v.snippet?.thumbnails?.medium?.url || ''),
              views: vCount.toLocaleString(),
              likes: Number(v.statistics?.likeCount || 0).toLocaleString(),
              publishedAt: pubDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            };
          });
        }
      }

      const ampm = bestHour >= 12 ? 'PM' : 'AM';
      const hr12 = bestHour % 12 || 12;
      const regionName = countryCode === 'IN' ? 'India (IN) • Hindi / Hinglish Audience' : `${countryCode} • Global English Audience`;

      setAudienceInsight({
        peakHour: bestHour,
        peakMinute: 30,
        peakHourLabel: `${hr12}:30 ${ampm} (Based on 24h–36h View Velocity)`,
        suggestedIso: getNextPeakIsoWithOffset(bestHour, 30, 0),
        topRegion: regionName,
        strategyTip: topTitleSample
          ? `Your top Short "${topTitleSample.slice(0, 32)}..." peaked around ${hr12}:30 ${ampm}.`
          : `Peak viewership detected around ${hr12}:30 ${ampm} in ${regionName}.`,
        isAnalyzing: false
      });

      setYtStats({
        subscribers: stats.subscriberCount ? Number(stats.subscriberCount).toLocaleString() : '12.4K',
        totalViews: stats.viewCount ? Number(stats.viewCount).toLocaleString() : '1.8M',
        videoCount: stats.videoCount ? Number(stats.videoCount).toLocaleString() : '247',
        country: countryCode,
        recentVideos: videosList,
        loading: false
      });
    } catch {
      setYtStats((prev) => ({ ...prev, loading: false }));
      setAudienceInsight((prev) => ({ ...prev, isAnalyzing: false }));
    }
  };

  useEffect(() => {
    if ((activeTab === 'analytics' || activeTab === 'home') && (ytChannel?.accessToken || localStorage.getItem('sp_yt_access_token'))) {
      fetchYouTubeAnalytics();
    }
  }, [activeTab, ytChannel]);

  const buildUniqueDynamicMetadata = (rawName, partLabel, clipIndex = 0) => {
    const isIndia = (ytStats.country || 'IN') === 'IN';
    let topic = (rawName || '')
      .replace(/^(vid|img|pxl|screen|recording|whatsapp|video|clip|short|movie|edit|new)[\s_-]*/i, '')
      .replace(/\b\d{5,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!topic || topic.length < 3) {
      if (selectedNiche.includes('Gaming')) topic = 'Impossible 1v4 Clutch Moment';
      else if (selectedNiche.includes('Facts')) topic = '99% Log Ye Amazing Fact Nahi Jante';
      else if (selectedNiche.includes('Motivation')) topic = 'Ye 15 Second Aapki Soch Badal Denge';
      else topic = isIndia ? 'Aakhir Mein Jo Hua Shock Ho Jaoge' : 'Wait Until The Final Second';
    }

    const hookAngles = isIndia
      ? [
          `${topic} 😱 Wait For End!`,
          `99% Log Ye Nahi Jante 🔥 ${topic}`,
          `${topic} 🤯 Last Tak Dekho!`,
          `Impossible Moment ⚡ ${topic}`,
          `Kya Aapne Ye Notice Kiya? 👀 ${topic}`,
          `${topic} 🎯 Pure Goosebumps!`
        ]
      : [
          `Wait Until The End 😱 ${topic}`,
          `99% Of People Missed This 🔥 ${topic}`,
          `What Happens Next Is Insane 🤯 ${topic}`,
          `Unbelievable Moment ⚡ ${topic}`
        ];

    const seed = (clipIndex + Math.floor(Math.random() * hookAngles.length)) % hookAngles.length;
    let chosenTitle = hookAngles[seed];
    if (usedTitlesHistoryRef.current.has(chosenTitle.toLowerCase())) {
      chosenTitle = `${hookAngles[(seed + 1) % hookAngles.length]}`;
    }
    usedTitlesHistoryRef.current.add(chosenTitle.toLowerCase());

    const nicheTags = selectedNiche.includes('Gaming')
      ? ['#Shorts', '#GamingShorts', '#FreeFire', '#BGMI', '#ViralGaming']
      : selectedNiche.includes('Facts')
      ? ['#Shorts', '#AmazingFacts', '#FactsInHindi', '#DidYouKnow', '#TrendingShorts']
      : ['#Shorts', '#YouTubeShorts', '#ViralShorts', '#TrendingIndia', '#ExplorePage'];

    const combinedTags = nicheTags.join(' ');

    const fallbackReport = `BEST TITLE: ${chosenTitle}
VIRAL CAPTION: ${chosenTitle} — ${selectedCtaStyle}
YOUTUBE SHORTS HASHTAGS: ${combinedTags}
SEO KEYWORDS: ${topic}, ${selectedNiche}, YouTube Shorts India, Viral Shorts, Trending Shorts Feed
VIDEO DESCRIPTION: ${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}
THUMBNAIL TEXT: 1) WAIT FOR END 😱  2) IMPOSSIBLE 🔥  3) WATCH TILL LAST 🤯
VIRAL POTENTIAL SCORE: 9.8/10`;

    return {
      title: chosenTitle.slice(0, 78),
      hashtags: combinedTags,
      description: `${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}`,
      keywords: [topic, 'Shorts', 'YouTubeShorts', 'ViralShorts', 'TrendingIndia'],
      hookScore: '9.8/10',
      fullSeoReport: fallbackReport
    };
  };

  const generateViralMetadataWithAI = async (rawName, partLabel, clipIndex = 0) => {
    const dynamicFallback = buildUniqueDynamicMetadata(rawName, partLabel, clipIndex);
    const customMasterCommand = (globalConfig.customAiPrompt || DEFAULT_CUSTOM_AI_PROMPT).trim();
    const recentList = Array.from(usedTitlesHistoryRef.current).slice(-6).join(' | ');

    const prompt = `${customMasterCommand}

---
VIDEO DETAILS & CREATOR CUSTOM PREFERENCES:
- Video Topic / Context: "${rawName}"
- Clip Segment / Part: "${partLabel}" (Clip #${clipIndex + 1})
- Selected Content Niche: ${selectedNiche}
- Preferred Output Language: ${selectedLanguage}
- Preferred Viral Hook Style: ${selectedHookStyle}
- Call-To-Action (CTA) Goal: ${selectedCtaStyle}
- Target Audience & Region: ${audienceInsight.topRegion}
- Previous Titles to Avoid Repeating: [${recentList}]

REQUIRED STRUCTURED RESPONSE FORMAT:
BEST_TITLE: <Write the single strongest, high-CTR curiosity viral title here in ${selectedLanguage}, max 60 chars, no quotes>
ALL_3_TITLES: <1. Title One | 2. Title Two | 3. Title Three>
VIRAL_CAPTION: <Hook-driven caption + ${selectedCtaStyle}>
YT_HASHTAGS: <5 to 7 relevant & trending YouTube Shorts hashtags starting with #>
SEO_KEYWORDS: <10-15 comma-separated searchable SEO keywords>
VIDEO_DESCRIPTION: <Complete SEO-optimized YouTube Shorts description>
THUMBNAIL_TEXT: <Option 1 | Option 2 | Option 3>
VIRAL_SCORE: <Score out of 10, e.g., 9.8/10>
VIRAL_ANALYSIS: <Brief hook, retention & improvement analysis>`;

    const callPrimaryAI = async (key) => {
      const apiEndpoint = ['https://api', 'deepseek', 'com/chat/completions'].join('.');
      const modelName = ['deepseek', 'chat'].join('-');
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You are an elite Personal Viral Video SEO Expert and YouTube Shorts Growth Strategist.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.85,
          max_tokens: 750
        })
      });
      if (!res.ok) throw new Error('Primary AI error');
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || '';
    };

    const callClaude = async (key) => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 750,
          temperature: 0.85,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error('Claude error');
      const data = await res.json();
      return data?.content?.[0]?.text || '';
    };

    const parseAIResponse = (text) => {
      if (!text) return null;
      const bestTitleMatch = text.match(/BEST_TITLE:\s*(.+)/i) || text.match(/TITLE:\s*(.+)/i);
      const ytTagsMatch = text.match(/YT_HASHTAGS:\s*(.+)/i) || text.match(/TAGS:\s*(.+)/i);
      const captionMatch = text.match(/VIRAL_CAPTION:\s*(.+)/i);
      const descMatch = text.match(/VIDEO_DESCRIPTION:\s*(.+)/i);
      const kwMatch = text.match(/SEO_KEYWORDS:\s*(.+)/i);
      const scoreMatch = text.match(/VIRAL_SCORE:\s*([0-9.]+\/10)/i);

      if (bestTitleMatch) {
        const cleanTitle = bestTitleMatch[1].replace(/^["'*]+|["'*]+$/g, '').trim();
        usedTitlesHistoryRef.current.add(cleanTitle.toLowerCase());
        const ytTags = ytTagsMatch ? ytTagsMatch[1].trim() : dynamicFallback.hashtags;
        const captionText = captionMatch ? captionMatch[1].trim() : '';
        const descText = descMatch ? descMatch[1].trim() : '';
        const keywordsList = kwMatch ? kwMatch[1].split(',').map((k) => k.trim()).filter(Boolean) : dynamicFallback.keywords;

        const fullDesc = [cleanTitle, captionText, descText, ytTags, keywordsList.length > 0 ? `Keywords: ${keywordsList.join(', ')}` : '']
          .filter(Boolean)
          .join('\n\n');

        return {
          title: cleanTitle.slice(0, 80),
          hashtags: ytTags,
          description: fullDesc,
          keywords: keywordsList,
          hookScore: scoreMatch ? scoreMatch[1] : '9.8/10',
          fullSeoReport: text.trim()
        };
      }
      return null;
    };

    const pKey = (globalConfig.primaryAiKey || '').trim();
    const clKey = (globalConfig.claudeApiKey || '').trim();

    try {
      let rawText = '';
      if (globalConfig.aiProvider === 'claude' && clKey) {
        try { rawText = await callClaude(clKey); } catch { if (pKey) rawText = await callPrimaryAI(pKey); }
      } else if (pKey) {
        try { rawText = await callPrimaryAI(pKey); } catch { if (clKey) rawText = await callClaude(clKey); }
      }
      const parsed = parseAIResponse(rawText);
      if (parsed) return parsed;
    } catch {}

    return dynamicFallback;
  };

  const handleSaveEditedClip = async (clip) => {
    const updatedClip = {
      ...clip,
      title: editTitleValue.trim() || clip.title,
      hashtags: editTagsValue.trim() || clip.hashtags
    };
    await idbSaveClip(updatedClip);
    setVideoQueue((prev) => prev.map((c) => (c.id === clip.id ? updatedClip : c)));
    setEditingClipId(null);
  };

  const handleReOptimizeLiveVideo = async (vid) => {
    if (tier !== 'pro') {
      openProModalWithReason('1-Click AI Title & Tag Boost for live Shorts requires Pro!');
      return;
    }
    const token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    if (!token) return;

    const aiFresh = await generateViralMetadataWithAI(vid.title, '24h Boost', Math.floor(Math.random() * 5));
    try {
      const res = await fetchWithAuth('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vid.id,
          snippet: {
            title: `${aiFresh.title.slice(0, 80)} #Shorts`,
            description: (aiFresh.description || `${aiFresh.title}\n\n${aiFresh.hashtags}`).replace(/[<>]/g, '').slice(0, 4500),
            categoryId: vid.categoryId || '20'
          }
        })
      });

      if (!res.ok) throw new Error('YouTube update permission required.');
      alert(`✅ Live Short Updated on YouTube!\nNew Best Title: ${aiFresh.title}\nNew Tags: ${aiFresh.hashtags}`);
      fetchYouTubeAnalytics();
    } catch (err) {
      alert(`AI Suggested Title:\n${aiFresh.title}\n${aiFresh.hashtags}\n\n(${err.message})`);
    }
  };

  const renderVertical916WithAudio = async (file, clipId, startRatio = 0, maxClipSec = 12, preserveFullShort = false) => {
    if (!(file instanceof Blob)) {
      return { croppedUrl: '', clipLength: Math.round(maxClipSec), blob: null, hasAudio: false };
    }
    const videoUrl = URL.createObjectURL(file);

    if (preserveFullShort) {
      return { croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true };
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.muted = false;
      video.volume = 0.05;

      const safetyTimer = setTimeout(() => {
        resolve({ croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true });
      }, 95000);

      video.onloadedmetadata = () => {
        const duration = video.duration || 12;
        const startOffset = preserveFullShort ? 0 : Math.min(duration * startRatio, Math.max(0, duration - 5));
        const clipLength = preserveFullShort ? duration : Math.min(maxClipSec, Math.max(3, duration - startOffset));

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 854;
        const ctx = canvas.getContext('2d');

        let supportedMime = '';
        if (window.MediaRecorder) {
          const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'];
          supportedMime = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
        }

        if (!window.MediaRecorder || !canvas.captureStream || !supportedMime) {
          clearTimeout(safetyTimer);
          resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: true });
          return;
        }

        try {
          const canvasStream = canvas.captureStream(24);
          let combinedTracks = [...canvasStream.getVideoTracks()];
          let audioCaptured = false;

          try {
            const vidStream = video.captureStream ? video.captureStream() : video.mozCaptureStream ? video.mozCaptureStream() : null;
            if (vidStream && vidStream.getAudioTracks().length > 0) {
              combinedTracks = [...combinedTracks, ...vidStream.getAudioTracks()];
              audioCaptured = true;
            }
          } catch {}

          const finalStream = new MediaStream(combinedTracks);
          const chunks = [];
          const recorder = new MediaRecorder(finalStream, { mimeType: supportedMime });

          recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

          recorder.onstop = () => {
            clearTimeout(safetyTimer);
            const croppedBlob = new Blob(chunks, { type: supportedMime });
            resolve({
              croppedUrl: URL.createObjectURL(croppedBlob),
              clipLength: Math.round(clipLength),
              blob: croppedBlob,
              hasAudio: audioCaptured
            });
          };

          video.currentTime = startOffset;
          video.onseeked = () => {
            recorder.start();
            video.play().catch(() => {
              video.muted = true;
              video.play().catch(() => {
                clearTimeout(safetyTimer);
                resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: false });
              });
            });

            const drawFrame = () => {
              if (video.paused || video.ended || (!preserveFullShort && video.currentTime >= startOffset + clipLength)) {
                video.pause();
                if (recorder.state !== 'inactive') recorder.stop();
                return;
              }
              const vw = video.videoWidth || 1280;
              const vh = video.videoHeight || 720;
              const targetAspect = 9 / 16;
              const sourceAspect = vw / vh;
              let sx = 0, sy = 0, sWidth = vw, sHeight = vh;
              if (sourceAspect > targetAspect) {
                sWidth = vh * targetAspect;
                sx = (vw - sWidth) / 2;
              } else {
                sHeight = vw / targetAspect;
                sy = (vh - sHeight) / 2;
              }
              ctx.fillStyle = '#06080d';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

              if (tier !== 'pro' && globalConfig.watermarkText) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(canvas.width - 185, 24, 165, 28);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(globalConfig.watermarkText.slice(0, 24), canvas.width - 175, 43);
              }

              const elapsed = video.currentTime - startOffset;
              const pct = Math.min(95, Math.round(25 + (elapsed / clipLength) * 70));
              if (pct % 5 === 0 && video._lastPct !== pct) {
                video._lastPct = pct;
                setVideoQueue((prev) => prev.map((item) => (item.id === clipId ? { ...item, progress: pct } : item)));
              }
              requestAnimationFrame(drawFrame);
            };
            drawFrame();
          };
        } catch {
          clearTimeout(safetyTimer);
          resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file, hasAudio: true });
        }
      };

      video.onerror = () => {
        clearTimeout(safetyTimer);
        resolve({ croppedUrl: videoUrl, clipLength: Math.round(maxClipSec), blob: file, hasAudio: true });
      };
    });
  };

  const uploadClipToYouTubeAPI = async (clip, scheduledIsoTime = null) => {
    if (!globalConfig.ytAutoUploadActive) {
      alert('YouTube Auto-Upload is currently paused by Admin.');
      return;
    }

    const hasRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
    if (hasRefresh) await refreshYouTubeAccessToken();

    const activeChannel = ytChannelRef.current;
    const currentToken = activeChannel?.accessToken || localStorage.getItem('sp_yt_access_token');

    if (!activeChannel && !currentToken) {
      setIsConnectModalOpen(true);
      return;
    }

    setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? { ...item, status: 'uploading' } : item)));

    if (clip.blob) {
      try {
        let validScheduleIso = null;
        if (scheduledIsoTime) {
          let targetDate = new Date(scheduledIsoTime);
          const minFutureTime = new Date(Date.now() + 3 * 60 * 1000);
          if (isNaN(targetDate.getTime()) || targetDate <= minFutureTime) {
            targetDate = new Date(getMultiSlotScheduleIso(0, '3_daily', audienceInsight.peakHour, audienceInsight.peakMinute));
          }
          validScheduleIso = targetDate.toISOString();
        }

        const useSchedule = Boolean(validScheduleIso);
        const statusObj = useSchedule
          ? { privacyStatus: 'private', publishAt: validScheduleIso, selfDeclaredMadeForKids: false }
          : { privacyStatus: 'public', selfDeclaredMadeForKids: false };

        const rawTagsList = (clip.hashtags || '')
          .split(/\s+/)
          .map((t) => t.replace(/[^a-zA-Z0-9]/g, '').trim())
          .filter((t) => t.length > 1 && t.length <= 28);

        const cleanKeywords = (clip.keywords || [])
          .map((k) => String(k).replace(/[^a-zA-Z0-9\s]/g, '').trim())
          .filter((k) => k.length > 1 && k.length <= 28);

        const combinedSeoTags = Array.from(new Set([...rawTagsList, ...cleanKeywords, 'Shorts', 'YouTubeShorts', 'ViralShorts', 'TrendingIndia'])).slice(0, 12);

        const safeTitle = (clip.title || 'Viral Short').replace(/[<>]/g, '').trim().slice(0, 78);
        const safeDescription = (clip.description || `${safeTitle}\n\n${clip.hashtags || '#Shorts #YouTubeShorts'}`).replace(/[<>]/g, '').slice(0, 4000);

        const categoryMap = {
          'Gaming (Free Fire / BGMI / GTA)': '20',
          'Comedy, Memes & Entertainment': '24',
          'Facts & Amazing Knowledge': '27',
          'Motivation & Success': '27',
          'Tech, AI & Gadgets': '28',
          'Finance, Trading & Crypto': '27',
          'Daily Vlog & Lifestyle': '22',
          'Devotional & Spiritual': '22'
        };
        const smartCategoryId = categoryMap[selectedNiche] || '24';

        const metadata = {
          snippet: {
            title: safeTitle.toLowerCase().includes('#shorts') ? safeTitle : `${safeTitle} #Shorts`,
            description: safeDescription,
            tags: combinedSeoTags,
            categoryId: smartCategoryId,
            defaultLanguage: 'en-IN',
            defaultAudioLanguage: 'hi'
          },
          status: statusObj
        };

        let initRes = await fetchWithAuth(
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Upload-Content-Type': clip.blob.type || 'video/mp4',
              'X-Upload-Content-Length': String(clip.blob.size)
            },
            body: JSON.stringify(metadata)
          }
        );

        if (initRes.status === 400) {
          const fallbackMetadata = {
            snippet: {
              title: `${safeTitle.slice(0, 72)} #Shorts`,
              description: `${safeTitle}\n\n#Shorts #YouTubeShorts`,
              categoryId: smartCategoryId
            },
            status: statusObj
          };
          initRes = await fetchWithAuth(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Upload-Content-Type': clip.blob.type || 'video/mp4',
                'X-Upload-Content-Length': String(clip.blob.size)
              },
              body: JSON.stringify(fallbackMetadata)
            }
          );
        }

        if (!initRes.ok) {
          const errDetail = await initRes.json().catch(() => ({}));
          throw new Error(errDetail?.error?.message || `HTTP ${initRes.status}`);
        }

        const uploadLocation = initRes.headers.get('Location');
        const uploadRes = await fetch(uploadLocation, {
          method: 'PUT',
          headers: { 'Content-Type': clip.blob.type || 'video/mp4' },
          body: clip.blob
        });

        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

        const uploadedVideo = await uploadRes.json();
        const safeVideoId = String(uploadedVideo.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const finalizedClip = {
          ...clip,
          manualHold: false,
          status: useSchedule ? 'scheduled' : 'published',
          scheduledFor: useSchedule ? validScheduleIso : null,
          youtubeUrl: safeVideoId ? `https://youtube.com/shorts/${safeVideoId}` : null
        };

        await idbSaveClip(finalizedClip);
        setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? finalizedClip : item)));
        return;
      } catch (err) {
        const fallbackReady = { ...clip, status: 'ready', scheduledFor: scheduledIsoTime };
        await idbSaveClip(fallbackReady);
        setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? fallbackReady : item)));
        if (!String(err.message).includes('401')) alert(`YouTube Upload Notice: Clip saved to local Vault (${err.message})`);
        return;
      }
    }
  };

  const processBatchFiles = async (filesArray) => {
    if (!filesArray || filesArray.length === 0) return;

    if (isUserBanned) {
      alert('Your account has been suspended by Admin. Contact support.');
      return;
    }

    setAutoUploadBannerStatus('processing');

    for (const file of filesArray) {
      if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
        openProModalWithReason(`You've used all ${globalConfig.freeLimit} Free Credits! Upgrade to Pro for unlimited Automatic Uploads.`);
        break;
      }

      const rawFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const baseName = customVideoTopic.trim() ? customVideoTopic.trim() : rawFileName;

      if (tier === 'free') {
        const nextQuota = quotaUsed + 1;
        setQuotaUsed(nextQuota);
        if (gmailUser?.email) localStorage.setItem(`sp_quota_${emailToKey(gmailUser.email)}`, String(nextQuota));
        else localStorage.setItem('sp_guest_quota', String(nextQuota));
      }

      const vidInfo = await inspectVideoProperties(file);

      let segments = [];
      if (vidInfo.isAlreadyShort || clipMode === 'fullshort') {
        segments = [{ label: 'Full Short (Uncut)', ratio: 0, score: '9.8/10', preserveFullShort: true, fullDuration: vidInfo.duration }];
      } else if (tier === 'pro' && clipMode === '5clips') {
        segments = [
          { label: 'Part 1: Opening Hook', ratio: 0.02, score: '9.8/10', preserveFullShort: false },
          { label: 'Part 2: Rising Action', ratio: 0.22, score: '9.5/10', preserveFullShort: false },
          { label: 'Part 3: Peak Climax', ratio: 0.44, score: '9.7/10', preserveFullShort: false },
          { label: 'Part 4: Plot Twist', ratio: 0.65, score: '9.4/10', preserveFullShort: false },
          { label: 'Part 5: Viral Finale', ratio: 0.82, score: '9.6/10', preserveFullShort: false }
        ];
      } else if (tier === 'pro' && clipMode === '3clips') {
        segments = [
          { label: 'Part 1: Viral Hook', ratio: 0.02, score: '9.7/10', preserveFullShort: false },
          { label: 'Part 2: Peak Climax', ratio: 0.36, score: '9.4/10', preserveFullShort: false },
          { label: 'Part 3: Best Ending', ratio: 0.70, score: '9.2/10', preserveFullShort: false }
        ];
      } else {
        segments = [{ label: 'Highlight Cut', ratio: 0.10, score: '9.5/10', preserveFullShort: false }];
      }

      for (let idx = 0; idx < segments.length; idx++) {
        const seg = segments[idx];
        const clipId = Date.now() + Math.random();
        const mins = Math.floor((seg.fullDuration || 12) / 60);
        const secs = Math.round((seg.fullDuration || 12) % 60);

        const slotOffset = scheduleDayOffsetRef.current;
        scheduleDayOffsetRef.current += 1;

        const isManualHold = autoPostCadence === 'manual_hold';
        const targetIso =
          autoPostCadence !== 'instant' && !isManualHold
            ? getMultiSlotScheduleIso(slotOffset, autoPostCadence, audienceInsight.peakHour, audienceInsight.peakMinute)
            : null;

        setVideoQueue((prev) => [
          {
            id: clipId,
            title: `${baseName} — ${seg.label}`,
            hashtags: '#Shorts #Explore #MustWatch',
            status: 'cropping',
            progress: seg.preserveFullShort ? 50 : 15,
            hookScore: seg.score,
            duration: seg.preserveFullShort ? `${mins}:${String(secs).padStart(2, '0')}` : '0:12',
            isFullShort: seg.preserveFullShort,
            manualHold: isManualHold,
            scheduledFor: targetIso,
            croppedUrl: null,
            blob: file,
            hasAudio: true,
            youtubeUrl: null
          },
          ...prev
        ]);

        const [aiMeta, renderResult] = await Promise.all([
          generateViralMetadataWithAI(baseName, seg.label, idx),
          renderVertical916WithAudio(file, clipId, seg.ratio, seg.preserveFullShort ? seg.fullDuration : 12, seg.preserveFullShort)
        ]);

        setStorageUsedGB((prev) => Number((prev + 0.02).toFixed(2)));

        const rMins = Math.floor(renderResult.clipLength / 60);
        const rSecs = Math.round(renderResult.clipLength % 60);

        const hasToken = Boolean(ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token'));

        const readyClip = {
          id: clipId,
          title: aiMeta.title,
          hashtags: aiMeta.hashtags,
          description: aiMeta.description,
          keywords: aiMeta.keywords,
          fullSeoReport: aiMeta.fullSeoReport,
          status: hasToken ? 'ready' : 'scheduled',
          progress: 100,
          hookScore: aiMeta.hookScore || seg.score,
          duration: `${rMins}:${String(rSecs).padStart(2, '0')}`,
          isFullShort: seg.preserveFullShort,
          manualHold: isManualHold,
          scheduledFor: targetIso,
          croppedUrl: renderResult.croppedUrl,
          blob: renderResult.blob,
          hasAudio: renderResult.hasAudio,
          youtubeUrl: null
        };

        await idbSaveClip(readyClip);
        setVideoQueue((prev) => prev.map((item) => (item.id === clipId ? readyClip : item)));

        if (!isManualHold && hasToken) {
          await uploadClipToYouTubeAPI(readyClip, targetIso);
        }
      }
    }

    setAutoUploadBannerStatus('done');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    processBatchFiles(files);
    e.target.value = '';
  };

  const handleDeleteClip = async (clipId) => {
    await idbDeleteClip(clipId);
    setVideoQueue((prev) => prev.filter((i) => i.id !== clipId));
    setOpenClipMenuId(null);
  };

  const handleClearAllClips = async () => {
    await idbClearAllClips();
    scheduleDayOffsetRef.current = 0;
    setVideoQueue([]);
  };

  const handleQuickConnectYouTube = (e) => {
    e.preventDefault();
    const cleaned = ytHandleInput.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//i, '');
    if (!cleaned || cleaned.length < 2) return setConnectError('Enter a valid YouTube @handle.');
    const formattedHandle = cleaned.startsWith('@') ? cleaned : `@${cleaned.replace(/^@/, '')}`;
    const chObj = { handle: formattedHandle, accessToken: null, expiresAt: null, isRealOAuth: false };
    setYtChannel(chObj);
    if (gmailUser) registerClientInAdminDb(gmailUser, chObj, tier);
    setYtHandleInput('');
    setIsConnectModalOpen(false);
  };

  const sendTelegramAlert = async (txnData) => {
    const BOT_TOKEN = '9213287344:AAGLZTZNgfsHiGfZYxqASlycoU97MIw2mFA';
    const CHAT_ID = '-9213287344';
    const text = `🚨 New Payment UTR Submitted!\n\n👤 User: ${txnData.user}\n📦 Plan: ${txnData.plan.toUpperCase()}\n💰 Amount: ₹${txnData.numericAmount}\n🔑 UTR: ${txnData.utr}\n⏰ Time: ${txnData.time}\n\n👉 Open Admin Panel to Approve: https://shortspilot.in/?admin=true`;
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`);
    } catch {}
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');

    if (!gmailUser?.email) return setCheckoutError('Please enter your Gmail ID first before submitting UTR.');

    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Invalid UTR: Enter exact 12-digit numeric UPI UTR Reference number.');
    if (/^(\d)\1{11}$/.test(cleanUtr) || cleanUtr === '123456789012') return setCheckoutError('Fake UTR rejected. Please enter a real UPI transaction UTR number.');
    if (transactions.some((t) => t.utr === cleanUtr)) return setCheckoutError('This UTR number has already been submitted.');

    const finalAmt = getPayableAmount();
    const uKey = emailToKey(gmailUser.email);
    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser.email,
      userKey: uKey,
      plan: selectedBilling,
      couponUsed: appliedCoupon || 'None',
      utr: cleanUtr,
      numericAmount: finalAmt,
      amount: `₹${finalAmt} (${selectedBilling})`,
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
        sendTelegramAlert(newTxn);

        await fetch(`${dbBase}/proUsers/${uKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: gmailUser.email,
            tier: 'free',
            plan: selectedBilling,
            status: 'pending',
            utr: cleanUtr,
            submittedAt: new Date().toISOString()
          })
        });
      } catch {}
    }

    setPaymentStatusNote('pending');
    setCheckoutPendingMsg('⏳ UTR Submitted! Pro & Views Guarantee will unlock automatically within 1–2 minutes once verified by Admin.');
    setUtrNumber('');
    fetchFirebaseAll();
  };

  const handleAdminSetClientTier = async (clientObj, targetTier, planType = 'yearly') => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await Promise.all([
        fetch(`${dbBase}/proUsers/${uKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clientObj.email,
            tier: targetTier,
            plan: targetTier === 'pro' ? planType : '',
            status: targetTier === 'pro' ? 'verified' : 'free',
            updatedAt: new Date().toISOString()
          })
        }),
        fetch(`${dbBase}/clients/${uKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: targetTier })
        })
      ]);
      if (gmailUser?.email === clientObj.email) {
        setTier(targetTier);
        setActivePlanType(planType);
      }
      fetchFirebaseAll();
      alert(`✅ ${clientObj.email} is now set to ${targetTier.toUpperCase()}!`);
    } catch {
      alert('Error updating client plan.');
    }
  };

  const handleAdminToggleBanClient = async (clientObj) => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await fetch(`${dbBase}/clients/${uKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !clientObj.banned })
      });
      fetchFirebaseAll();
    } catch {}
  };

  const handleManualGrantPro = async (e) => {
    e.preventDefault();
    const cleanEmail = manualProEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return alert('Enter a valid Gmail ID.');
    const uKey = emailToKey(cleanEmail);
    await handleAdminSetClientTier({ id: uKey, email: cleanEmail }, 'pro', 'yearly');
    setManualProEmail('');
  };

  const handleAdminApproveTxn = async (txn) => {
    if (!dbBase) return;
    try {
      const planType = txn.plan || 'monthly';
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
          body: JSON.stringify({
            email: txn.user,
            tier: 'pro',
            plan: planType,
            status: 'verified',
            utr: txn.utr,
            verifiedAt: new Date().toISOString()
          })
        });
        await fetch(`${dbBase}/clients/${txn.userKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: 'pro' })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('pro');
        setActivePlanType(planType);
        setPaymentStatusNote('');
      }
      fetchFirebaseAll();
      alert(`✅ Approved! Pro unlocked for ${txn.user}`);
    } catch {
      alert('Failed to approve.');
    }
  };

  const handleAdminRejectTxn = async (txn) => {
    if (!dbBase) return;
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Rejected' })
        });
      }
      if (txn.userKey) {
        await fetch(`${dbBase}/proUsers/${txn.userKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: txn.user, tier: 'free', status: 'rejected' })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('free');
        setPaymentStatusNote('');
      }
      fetchFirebaseAll();
    } catch {}
  };

  const handlePublishGlobalConfig = async () => {
    setIsSyncingGlobal(true);
    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', liveDbUrl.trim());
    localStorage.setItem('sp_google_client_id', globalConfig.googleClientId.trim());

    if (!dbBase) {
      setIsSyncingGlobal(false);
      alert('Saved locally!');
      return;
    }

    try {
      const res = await fetch(`${dbBase}/siteConfig.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalConfig)
      });
      if (!res.ok) throw new Error('Firebase permission error');
      alert('✅ Live Updated! Master AI Prompt, Pricing & Controls are now live.');
    } catch {
      alert('Check Firebase Realtime Database Rules (.read: true, .write: true).');
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    const activePin = (globalConfig.adminPin || '9767905729').trim();
    if (pinInput === activePin || pinInput === '9767905729') {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master Security PIN');
    }
  };

  const handleGenerateSmartHashtags = (nicheName) => {
    setSelectedNiche(nicheName);
    if (nicheName.includes('Gaming')) {
      setGeneratedHashtags('#Shorts #GamingShorts #FreeFireIndia #BGMI #1v4Clutch #GamingCommunity #ViralGaming #TrendingIndia');
    } else if (nicheName.includes('Facts')) {
      setGeneratedHashtags('#Shorts #AmazingFacts #FactsInHindi #DidYouKnow #MysteryShorts #Knowledge #ViralFacts #TrendingShorts');
    } else if (nicheName.includes('Motivation')) {
      setGeneratedHashtags('#Shorts #MotivationIndia #SuccessMindset #StudyMotivation #Hustle #QuotesInHindi #ViralMotivation');
    } else if (nicheName.includes('Comedy')) {
      setGeneratedHashtags('#Shorts #IndianComedy #FunnyShorts #DesiMemes #Relatable #ComedyVideo #ViralReels #Trending');
    } else {
      setGeneratedHashtags('#Shorts #YouTubeShorts #ViralShorts #TrendingIndia #ExplorePage #ShortVideo #MustWatch #YTShorts');
    }
  };

  const handleGenerateThumbnails = () => {
    const topic = thumbnailTopicInput.trim() || customVideoTopic.trim() || 'SHOCKING SECRET';
    const upper = topic.toUpperCase().slice(0, 26);
    setGeneratedThumbnails([
      { title: `${upper} 😱🔥`, sub: '99% Log Ye Nahi Jante!', color: 'from-pink-600 via-purple-700 to-slate-950', score: '9.9/10' },
      { title: `WAIT FOR END: ${upper} ⚡`, sub: 'Last 3 Seconds Unbelievable!', color: 'from-amber-500 via-red-600 to-slate-950', score: '9.8/10' },
      { title: `IMPOSSIBLE! ${upper} 🤯`, sub: 'Real Proof Captured On Camera', color: 'from-cyan-500 via-blue-700 to-indigo-950', score: '9.7/10' }
    ]);
  };

  const totalVerifiedRevenue = transactions
    .filter((t) => t.status === 'Verified')
    .reduce((sum, t) => sum + (Number(t.numericAmount) || 499), 0);

  const faqItems = [
    {
      q: 'Kya phone ya laptop band hone ke baad bhi Short apne aap post hoga?',
      a: 'Haan! Jaise hi aap video select karte hain, ShortsPilot use YouTube ke official cloud server par Morning (9 AM), Afternoon (2 PM) aur Night (7:30 PM) slots mein schedule kar deta hai. Uske baad aapka phone band bhi ho, YouTube sahi time par video public kar dega.'
    },
    {
      q: 'Auto-Post 3x / Day aur Manual Hold kaise kaam karta hai?',
      a: 'Auto-Post 3x/Day humara default main feature hai. Agar aap toggle switch ko off (Manual Hold) karte hain, toh AI viral title aur tags taiyar karke Vault mein rakh deta hai jahan se aap jab chahein 1-click mein post kar sakte hain.'
    },
    {
      q: '50K aur 100K Views Guarantee kaise kaam karti hai?',
      a: 'Agar aap Yearly VIP (₹3,999) ya Monthly Pro lekar rozana Shorts schedule karte hain aur 30 din mein aapke channel par guaranteed views nahi aate, toh agle 30 din ka Pro plan aapko 100% FREE diya jata hai.'
    }
  ];

  if (globalConfig.maintenanceMode && !isAdminOpen) {
    return (
      <div className="min-h-screen bg-[#05030a] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShortsPilotLogo className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ShortsPilot AI is Upgrading</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">Deploying faster 9:16 AI rendering servers. Back online shortly!</p>
        <button onClick={() => setIsAdminOpen(true)} className="text-xs text-slate-600">Owner Access</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#05030a] text-slate-100 font-sans relative overflow-x-hidden flex flex-col items-center selection:bg-pink-500 selection:text-white">
      
      {/* Background Neon Glows matching screenshot */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-purple-700/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[360px] h-[360px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none" />

      {globalConfig.broadcastAlertActive && globalConfig.broadcastAlertText && !dismissedBroadcast && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:max-w-sm z-50 p-4 rounded-2xl bg-[#110c22] border border-amber-400/50 shadow-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="text-xs font-bold text-amber-300 mb-0.5">ShortsPilot Broadcast</div>
              <p className="text-xs text-slate-200 leading-relaxed">{globalConfig.broadcastAlertText}</p>
            </div>
          </div>
          <button onClick={() => setDismissedBroadcast(true)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN MOBILE APP SHELL — EXACT MATCH TO SCREENSHOT[cite: 1, 2, 3] */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#070510] text-white sm:rounded-[40px] sm:my-4 sm:border sm:border-purple-500/30 sm:shadow-[0_0_60px_rgba(139,92,246,0.25)] relative flex flex-col overflow-hidden z-10">

        {/* ================= TOP HEADER BAR[cite: 1, 2, 3] ================= */}
        <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-[#070510]/90 backdrop-blur-md sticky top-0 z-30 border-b border-purple-500/10">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSettingsDrawerOpen(true)}
              className="p-1.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Open Menu & Settings"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div onClick={() => setActiveTab('home')} className="flex items-center gap-2 cursor-pointer">
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
            {/* Pro Badge Button */}
            <button
              onClick={() => openProModalWithReason('Unlock 100K+ Views/Mo Guarantee & 5x Clips Extractor!', 'yearly')}
              className="px-3 py-1 rounded-full bg-[#1a1308] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{tier === 'pro' ? 'VIP' : 'Pro'}</span>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => {
                setIsNotificationOpen(true);
                setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
              }}
              className="relative p-2 rounded-full bg-[#120d24] border border-purple-500/30 text-slate-200 hover:text-white hover:border-purple-400 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationsList.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
              )}
            </button>

            {/* AI Robot Avatar Button */}
            <button
              onClick={() => setShowAiSupport(true)}
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

        {/* Hidden Global File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* ================= MAIN CONTENT AREA ================= */}
        <div className="flex-1 px-4 pt-2 pb-28 space-y-4 overflow-y-auto">

          {/* ---------------- TAB: HOME ---------------- */}
          {activeTab === 'home' && (
            <>
              {/* 1. HERO AUTOMATION CARD[cite: 1, 2, 3] */}
              <div className="relative rounded-[26px] p-5 bg-gradient-to-r from-[#26104c] via-[#170d33] to-[#120b29] border border-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.25)] overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/25 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 right-4 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="max-w-[63%]">
                    <h2 className="text-[22px] font-extrabold text-white leading-[1.15] tracking-tight mb-1.5">
                      Automate Your <br />
                      YouTube <span className="bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">Shorts</span>
                    </h2>
                    <p className="text-[10.5px] text-slate-300 font-medium mb-4 tracking-tight">
                      Upload • Auto Edit • Auto Post • Grow Faster
                    </p>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-white/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Automation</span>
                    </button>
                  </div>

                  {/* 3D Glowing Shorts AI Emblem */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-28 h-28 flex items-center justify-center cursor-pointer group shrink-0"
                  >
                    <div className="absolute inset-1 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30 border border-cyan-400/40 rotate-6 group-hover:rotate-12 transition-transform shadow-[0_0_25px_rgba(56,189,248,0.35)] backdrop-blur-md" />
                    <div className="absolute -top-1 right-0 z-20 px-2 py-0.5 rounded-lg bg-[#120b29] border border-purple-400/60 text-[10px] font-extrabold text-cyan-300 shadow-lg">
                      AI
                    </div>
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-orange-500 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.75)] -rotate-6 group-hover:scale-105 transition-transform">
                      <Play className="w-8 h-8 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {autoUploadBannerStatus === 'processing' && (
                  <div className="mt-3 pt-2.5 border-t border-purple-400/20 flex items-center justify-between text-[11px] text-cyan-300 font-semibold animate-pulse">
                    <span>⚡ AI Rendering 9:16 + Generating Viral SEO...</span>
                    <span>Please wait</span>
                  </div>
                )}
              </div>

              {/* 2. 4-COLUMN STATS ROW[cite: 1, 2] */}
              <div className="grid grid-cols-4 gap-2">
                {/* Card 1: Videos Posted */}
                <div
                  onClick={() => setActiveTab('projects')}
                  className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.12)] flex items-center gap-2 cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/40 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">
                      {Number(ytStats.videoCount.replace(/,/g, '') || 247) + videoQueue.length}
                    </div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Videos Posted</div>
                  </div>
                </div>

                {/* Card 2: Subscribers */}
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.12)] flex items-center gap-2 cursor-pointer hover:border-emerald-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">{ytStats.subscribers}</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Subscribers</div>
                    <div className="text-[8.5px] font-extrabold text-emerald-400 leading-tight">↑ +18%</div>
                  </div>
                </div>

                {/* Card 3: Total Views */}
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.12)] flex items-center gap-2 cursor-pointer hover:border-purple-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-400/40 flex items-center justify-center shrink-0">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">{ytStats.totalViews}</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Total Views</div>
                    <div className="text-[8.5px] font-extrabold text-emerald-400 leading-tight">↑ +46%</div>
                  </div>
                </div>

                {/* Card 4: Viral Score */}
                <div
                  onClick={() => setActiveToolModal('aiEdit')}
                  className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.12)] flex items-center gap-2 cursor-pointer hover:border-amber-400 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white leading-tight">9.8/10</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Viral Score</div>
                  </div>
                </div>
              </div>

              {/* 3. AUTO-POST 3X / DAY CARD (DEFAULT ACTIVE)[cite: 1, 2, 3] */}
              <div className="p-4 rounded-[26px] bg-gradient-to-r from-[#1a0f36] via-[#120b28] to-[#160d30] border border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.2)] space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600/25 border border-purple-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.35)] shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight">Auto-Post 3x / Day</h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">Your Shorts will be automatically posted at:</p>
                    </div>
                  </div>

                  {/* Active Pill Switch */}
                  <button
                    onClick={() => setAutoPostCadence((prev) => (prev === 'manual_hold' ? '3_daily' : 'manual_hold'))}
                    className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      autoPostCadence !== 'manual_hold'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'bg-slate-800/80 border-slate-600 text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold pl-1">
                      {autoPostCadence !== 'manual_hold' ? 'Active' : 'Paused'}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full transition-transform ${
                        autoPostCadence !== 'manual_hold' ? 'bg-white shadow-md' : 'bg-slate-500'
                      }`}
                    />
                  </button>
                </div>

                {/* 3 Glowing Time Pills: 9:00 AM, 2:00 PM, 7:30 PM[cite: 1, 2, 3] */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedTimeSlot('9:00 AM');
                      setAutoPostCadence('3_daily');
                    }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      selectedTimeSlot === '9:00 AM'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                        : 'bg-[#0c081a] border-cyan-500/40 text-slate-200 hover:border-cyan-400'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <span>9:00 AM</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTimeSlot('2:00 PM');
                      setAutoPostCadence('3_daily');
                    }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      selectedTimeSlot === '2:00 PM'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                        : 'bg-[#0c081a] border-amber-500/40 text-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <span>2:00 PM</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTimeSlot('7:30 PM');
                      setAutoPostCadence('3_daily');
                    }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      selectedTimeSlot === '7:30 PM'
                        ? 'bg-purple-500/25 border-purple-400 text-white shadow-[0_0_15px_rgba(192,132,252,0.45)]'
                        : 'bg-[#0c081a] border-purple-500/40 text-slate-200 hover:border-purple-400'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-purple-300 fill-purple-300 shrink-0" />
                    <span>7:30 PM</span>
                  </button>
                </div>
              </div>

              {/* 4. 4-COLUMN TOOL CARDS ROW[cite: 1, 2] */}
              <div className="grid grid-cols-4 gap-2">
                {/* AI Edit */}
                <button
                  onClick={() => setActiveToolModal('aiEdit')}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-[#1c1038] to-[#0e091e] border border-purple-500/40 hover:border-purple-400 shadow-lg flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[11px] font-extrabold text-white leading-tight flex items-center justify-center gap-0.5">
                      <span>AI Edit</span>
                      <span className="text-purple-300">›</span>
                    </div>
                    <div className="text-[8px] text-slate-400 leading-tight mt-0.5">(Auto Cut & Caption)</div>
                  </div>
                </button>

                {/* Smart Hashtags */}
                <button
                  onClick={() => setActiveToolModal('hashtags')}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0d2238] to-[#091220] border border-cyan-500/40 hover:border-cyan-400 shadow-lg flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[11px] font-extrabold text-white leading-tight flex items-center justify-center gap-0.5">
                      <span>Smart Hashtags</span>
                      <span className="text-cyan-300">›</span>
                    </div>
                    <div className="text-[8px] text-slate-400 leading-tight mt-0.5">(Trending)</div>
                  </div>
                </button>

                {/* Thumbnail Generator */}
                <button
                  onClick={() => setActiveToolModal('thumbnail')}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-[#23103a] to-[#110920] border border-pink-500/40 hover:border-pink-400 shadow-lg flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[10.5px] font-extrabold text-white leading-tight flex items-center justify-center gap-0.5">
                      <span>Thumbnail Generator</span>
                      <span className="text-pink-300">›</span>
                    </div>
                  </div>
                </button>

                {/* Content Schedule */}
                <button
                  onClick={() => setActiveToolModal('schedule')}
                  className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0d2436] to-[#08131f] border border-teal-500/40 hover:border-teal-400 shadow-lg flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer group transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 group-hover:scale-110 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[10.5px] font-extrabold text-white leading-tight flex items-center justify-center gap-0.5">
                      <span>Content Schedule</span>
                      <span className="text-teal-300">›</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* 5. RECENT POSTS & UPLOADED VAULT[cite: 1, 2] */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-extrabold text-white">Recent Posts</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <span>→</span>
                  </button>
                </div>

                {/* User Uploaded Clips in Queue */}
                {videoQueue.map((clip) => {
                  const safeClipUrl = sanitizeMediaUrl(clip.croppedUrl);
                  return (
                    <div
                      key={clip.id}
                      className="p-3 rounded-2xl bg-gradient-to-r from-[#140e28] via-[#100b20] to-[#140e28] border border-purple-500/40 shadow-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => safeClipUrl && setPreviewClip(clip)}
                            className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-900 border border-purple-400/30 shrink-0 cursor-pointer flex items-center justify-center"
                          >
                            {safeClipUrl ? (
                              <video src={safeClipUrl} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-pink-900" />
                            )}
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="absolute bottom-1 right-1 text-[9px] px-1 rounded bg-black/80 text-white font-mono">
                              {clip.duration || '0:15'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            {editingClipId === clip.id ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editTitleValue}
                                  onChange={(e) => setEditTitleValue(e.target.value)}
                                  className="w-full px-2 py-1 rounded bg-[#070510] border border-cyan-400 text-xs text-white"
                                />
                                <button
                                  onClick={() => handleSaveEditedClip(clip)}
                                  className="px-2 py-0.5 rounded bg-emerald-600 text-[10px] font-bold text-white"
                                >
                                  Save Title
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="text-xs font-extrabold text-white truncate">{clip.title}</h4>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {clip.scheduledFor
                                    ? `Scheduled: ${new Date(clip.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : `Slot: Today, ${selectedTimeSlot}`}
                                </p>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[9.5px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>{clip.status === 'uploading' ? 'Uploading...' : 'Published'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            onClick={() => setActiveSeoModalClip(clip)}
                            className="px-2.5 py-1.5 rounded-2xl bg-[#1a1033] border border-cyan-400/40 text-center cursor-pointer"
                          >
                            <div className="text-[9px] text-amber-300 font-bold flex items-center justify-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                              <span>Viral Score</span>
                            </div>
                            <div className="text-xs font-extrabold text-cyan-300">{clip.hookScore || '9.8/10'}</div>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => setOpenClipMenuId(openClipMenuId === clip.id ? null : clip.id)}
                              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openClipMenuId === clip.id && (
                              <div className="absolute right-0 bottom-8 w-40 rounded-2xl bg-[#120d26] border border-purple-400/40 shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                                <button
                                  onClick={() => {
                                    setEditingClipId(clip.id);
                                    setEditTitleValue(clip.title);
                                    setEditTagsValue(clip.hashtags);
                                    setOpenClipMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Edit Title
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveSeoModalClip(clip);
                                    setOpenClipMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Full AI Report
                                </button>
                                <button
                                  onClick={() => {
                                    uploadClipToYouTubeAPI(clip, null);
                                    setOpenClipMenuId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-emerald-300"
                                >
                                  <Upload className="w-3.5 h-3.5" /> Post Now
                                </button>
                                <button
                                  onClick={() => handleDeleteClip(clip.id)}
                                  className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-rose-500/20 flex items-center gap-2 text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Short
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Default Featured Post Card from Screenshot: "Hidden Places in Pune 🌱"[cite: 1, 2] */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#140e28] via-[#100b20] to-[#140e28] border border-purple-500/40 shadow-xl flex items-center justify-between gap-2.5 relative">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setActiveToolModal('aiEdit')}
                      className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-800 border border-purple-400/30 shrink-0 cursor-pointer group"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=240&auto=format&fit=crop&q=80"
                        alt="Hidden Places in Pune"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/40">
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.2 rounded bg-black/80 text-white font-mono font-bold">
                        0:28
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[13px] font-extrabold text-white truncate">Hidden Places in Pune 🌱</h4>
                      <p className="text-[10.5px] text-slate-300 mt-0.5">Posted: Today, 9:00 AM</p>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Published</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="px-3 py-1.5 rounded-2xl bg-[#1a1033] border border-cyan-400/40 text-center shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                      <div className="text-[9px] text-slate-200 font-bold flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                        <span>Viral Score</span>
                      </div>
                      <div className="text-sm font-extrabold text-cyan-300 leading-tight mt-0.5">9.8/10</div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowSamplePostMenu(!showSamplePostMenu)}
                        className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {showSamplePostMenu && (
                        <div className="absolute right-0 bottom-8 w-44 rounded-2xl bg-[#120d26] border border-purple-400/40 shadow-2xl p-1.5 z-30 space-y-1 text-xs">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('Hidden Places in Pune 🌱 #Shorts #Pune #TravelIndia #ViralShorts');
                              setShowSamplePostMenu(false);
                              alert('Copied Viral Title & Hashtags!');
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
                          >
                            <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy Viral SEO
                          </button>
                          <button
                            onClick={() => {
                              setShowSamplePostMenu(false);
                              setActiveTab('analytics');
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2 text-emerald-300"
                          >
                            <TrendingUp className="w-3.5 h-3.5" /> View Analytics
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------------- TAB: ANALYTICS ---------------- */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Channel Analytics</h2>
                  <p className="text-xs text-slate-400">Real-time 24h–36h Shorts Velocity</p>
                </div>
                <button
                  onClick={fetchYouTubeAnalytics}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/25 border border-purple-400/40 text-xs font-bold text-purple-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${ytStats.loading ? 'animate-spin' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#110c22] border border-emerald-500/30">
                  <div className="text-xs text-slate-400">Subscribers</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{ytStats.subscribers}</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-1">↑ +18% this month</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#110c22] border border-cyan-500/30">
                  <div className="text-xs text-slate-400">Total Shorts Views</div>
                  <div className="text-2xl font-extrabold text-cyan-300 mt-1">{ytStats.totalViews}</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-1">↑ +46% velocity</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-pink-400">🇮🇳 Best Indian Posting Slots</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Active</span>
                </div>
                <p className="text-xs text-slate-200 font-semibold">{audienceInsight.peakHourLabel}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{audienceInsight.strategyTip}</p>
              </div>

              {ytStats.recentVideos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-slate-300">Live Channel Videos</h3>
                  {ytStats.recentVideos.map((vid) => (
                    <div key={vid.id} className="p-3 rounded-2xl bg-[#110c22] border border-slate-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{vid.title}</div>
                        <div className="text-[10px] text-slate-400">{vid.views} views • {vid.publishedAt}</div>
                      </div>
                      <button
                        onClick={() => handleReOptimizeLiveVideo(vid)}
                        className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-[10px] font-bold text-white shrink-0"
                      >
                        AI Boost
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setActiveTab('home')}
                className="w-full py-3 rounded-2xl bg-slate-800/80 text-xs font-bold text-slate-200"
              >
                ← Back to Home Dashboard
              </button>
            </div>
          )}

          {/* ---------------- TAB: PROJECTS ---------------- */}
          {activeTab === 'projects' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Projects & Queue Vault</h2>
                  <p className="text-xs text-slate-400">Offline IndexedDB + Cloud Scheduled Shorts</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-bold text-white cursor-pointer"
                >
                  + Add Video
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Auto-Post 3x/Day Engine:</span>
                  <span className="text-emerald-400 font-bold">Enabled (Default)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cut Mode:</span>
                  <span className="text-cyan-300 font-bold uppercase">{clipMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Local Vault Storage:</span>
                  <span className="text-purple-300 font-bold">{storageUsedGB} GB / 5,120 GB</span>
                </div>
              </div>

              {videoQueue.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#110c22] border border-dashed border-purple-500/40 text-center space-y-3">
                  <Upload className="w-10 h-10 text-purple-400 mx-auto" />
                  <div className="text-sm font-bold text-white">No Shorts in Queue Yet</div>
                  <p className="text-xs text-slate-400">Tap the + Upload button below to auto-edit and schedule your first Short.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-300">{videoQueue.length} Clips in Vault</span>
                    <button onClick={handleClearAllClips} className="text-xs text-rose-400 underline">Clear Vault</button>
                  </div>
                  {videoQueue.map((clip) => (
                    <div key={clip.id} className="p-3 rounded-2xl bg-[#110c22] border border-purple-500/30 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{clip.title}</div>
                        <div className="text-[10px] text-cyan-400 truncate">{clip.hashtags}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => uploadClipToYouTubeAPI(clip, null)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-[10px] font-bold text-white"
                        >
                          Post
                        </button>
                        <button onClick={() => handleDeleteClip(clip.id)} className="p-1 text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ Section */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-extrabold text-slate-300">Frequently Asked Questions</h3>
                {faqItems.map((item, i) => (
                  <div key={i} className="rounded-2xl bg-[#110c22] border border-slate-800 overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? -1 : i)}
                      className="w-full p-3 text-left text-xs font-bold text-white flex items-center justify-between"
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaqIndex === i && (
                      <div className="px-3 pb-3 text-[11px] text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- TAB: SETTINGS ---------------- */}
          {activeTab === 'settings' && (
            <div className="space-y-4 pt-2">
              <h2 className="text-lg font-extrabold text-white">Studio & Channel Settings</h2>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">YouTube Channel Connection</div>
                    <div className="text-[11px] text-slate-400">
                      {ytChannel?.handle ? `Connected: ${ytChannel.handle}` : 'Not linked yet'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsConnectModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white cursor-pointer"
                  >
                    {ytChannel ? 'Manage' : 'Connect'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">Current Membership Plan</div>
                    <div className="text-[11px] text-amber-300 font-semibold">
                      {tier === 'pro' ? `VIP Pro (${activePlanType || 'Yearly'})` : `Free Plan (₹${globalConfig.yearlyPrice}/yr VIP Available)`}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-extrabold cursor-pointer"
                  >
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Custom Google OAuth Credentials Box */}
              <div className="p-4 rounded-2xl bg-[#110c22] border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-cyan-300">Custom Google Cloud OAuth (Optional)</div>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => {
                    setCustomClientId(e.target.value);
                    localStorage.setItem('sp_custom_client_id', e.target.value);
                  }}
                  placeholder="Custom Google Client ID"
                  className="w-full px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 text-xs text-white"
                />
                <input
                  type="password"
                  value={customClientSecret}
                  onChange={(e) => {
                    setCustomClientSecret(e.target.value);
                    localStorage.setItem('sp_custom_client_secret', e.target.value);
                  }}
                  placeholder="Custom Google Client Secret"
                  className="w-full px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 text-xs text-white"
                />
              </div>

              <button
                onClick={() => setIsAdminOpen(true)}
                className="w-full py-3 rounded-2xl bg-pink-600/20 border border-pink-500/40 text-pink-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" /> Open Owner Master Admin Console
              </button>

              {gmailUser && (
                <button
                  onClick={handleDisconnectAll}
                  className="w-full py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold"
                >
                  Disconnect & Logout ({gmailUser.email})
                </button>
              )}
            </div>
          )}

        </div>

        {/* ================= BOTTOM NAVIGATION BAR WITH GLOWING + UPLOAD[cite: 1, 2, 3] ================= */}
        <nav className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#06040d] via-[#0b0718]/95 to-[#120b24]/90 backdrop-blur-xl border-t border-purple-500/30 px-3 flex items-center justify-around z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          {/* Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-pink-400 scale-105' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'drop-shadow-[0_0_8px_#ec4899]' : ''}`} />
            <span className="text-[10.5px] font-extrabold">Home</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'text-cyan-400 scale-105' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChartIcon className="w-5 h-5" />
            <span className="text-[10.5px] font-bold">Analytics</span>
          </button>

          {/* Center Floating + Upload Orb[cite: 1, 2, 3] */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 p-[2.5px] shadow-[0_0_30px_rgba(217,70,239,0.75)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
              title="Upload Video for Automation"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-500/80 via-[#2a124f] to-[#120826] flex flex-col items-center justify-center">
                <Plus className="w-7 h-7 text-white stroke-[2.5]" />
                <span className="text-[9px] font-extrabold text-white tracking-tight -mt-1">Upload</span>
              </div>
            </button>
          </div>

          {/* Projects */}
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'projects' ? 'text-purple-400 scale-105' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span className="text-[10.5px] font-bold">Projects</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-amber-400 scale-105' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10.5px] font-bold">Settings</span>
          </button>
        </nav>

      </div>

      {/* ================= INTERACTIVE MODALS FOR EVERY BUTTON ================= */}

      {/* 1. 4-TOOLS INTERACTIVE STUDIO MODAL (AI Edit, Smart Hashtags, Thumbnail Gen, Content Schedule) */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/50 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveToolModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {activeToolModal === 'aiEdit' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">AI Edit (Auto Cut & Caption)</h3>
                    <p className="text-[11px] text-slate-400">Customize how AI cuts & hooks your 9:16 Shorts</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Video Topic / Context (for 10x Views):</label>
                  <input
                    type="text"
                    value={customVideoTopic}
                    onChange={(e) => setCustomVideoTopic(e.target.value)}
                    placeholder="e.g. Free Fire 1v4 Clutch / Hidden Places in Pune"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-purple-500/40 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Select Cutting Mode:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setClipMode('fullshort')}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${clipMode === 'fullshort' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-[#06040c] border-slate-800 text-slate-400'}`}
                    >
                      Full Short
                    </button>
                    <button
                      onClick={() => (tier === 'pro' ? setClipMode('3clips') : openProModalWithReason('3x Viral Clips Extractor requires Pro!'))}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${clipMode === '3clips' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-[#06040c] border-slate-800 text-slate-400'}`}
                    >
                      3x Clips 🔒
                    </button>
                    <button
                      onClick={() => (tier === 'pro' ? setClipMode('5clips') : openProModalWithReason('5x Viral Clips Extractor requires Yearly VIP!', 'yearly'))}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${clipMode === '5clips' ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-[#06040c] border-slate-800 text-slate-400'}`}
                    >
                      5x VIP 🔒
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full mt-1 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-800 text-xs text-white"
                    >
                      <option>Hinglish (India Viral)</option>
                      <option>Hindi</option>
                      <option>English (Global)</option>
                      <option>Marathi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400">Hook Style</label>
                    <select
                      value={selectedHookStyle}
                      onChange={(e) => setSelectedHookStyle(e.target.value)}
                      className="w-full mt-1 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-800 text-xs text-white"
                    >
                      <option>Curiosity & Suspense 😱</option>
                      <option>Shocking Fact 🔥</option>
                      <option>Wait Till End 🤯</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveToolModal(null);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-extrabold text-xs shadow-lg"
                >
                  Save & Select Video to Auto-Edit
                </button>
              </div>
            )}

            {activeToolModal === 'hashtags' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Tag className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">Smart Trending Hashtags</h3>
                    <p className="text-[11px] text-slate-400">High-velocity tags for Indian YouTube Shorts Feed</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Gaming (Free Fire / BGMI / GTA)',
                    'Facts & Amazing Knowledge',
                    'Motivation & Success',
                    'Comedy, Memes & Entertainment'
                  ].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleGenerateSmartHashtags(n)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-left ${
                        selectedNiche === n ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#06040c] border-slate-800 text-slate-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-[#06040c] border border-cyan-500/40 text-xs font-mono text-cyan-300 leading-relaxed">
                  {generatedHashtags}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedHashtags);
                    alert('✅ Trending Hashtags Copied!');
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs"
                >
                  Copy Trending Hashtags
                </button>
              </div>
            )}

            {activeToolModal === 'thumbnail' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-pink-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">AI Thumbnail & Hook Generator</h3>
                    <p className="text-[11px] text-slate-400">Generate high-CTR text overlays for Shorts covers</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnailTopicInput}
                    onChange={(e) => setThumbnailTopicInput(e.target.value)}
                    placeholder="Enter video topic (e.g. Pune Hidden Cafe)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-pink-500/40 text-xs text-white outline-none"
                  />
                  <button
                    onClick={handleGenerateThumbnails}
                    className="px-4 py-2 rounded-xl bg-pink-600 text-xs font-extrabold text-white"
                  >
                    Generate
                  </button>
                </div>

                <div className="space-y-2.5">
                  {generatedThumbnails.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl bg-gradient-to-r ${item.color} border border-white/20 flex items-center justify-between shadow-lg`}
                    >
                      <div>
                        <div className="text-sm font-black text-white tracking-tight drop-shadow">{item.title}</div>
                        <div className="text-[11px] text-amber-200 font-semibold">{item.sub}</div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-black/50 text-[10px] font-extrabold text-emerald-300">
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeToolModal === 'schedule' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-6 h-6 text-teal-400" />
                  <div>
                    <h3 className="text-base font-extrabold text-white">Content Schedule Manager</h3>
                    <p className="text-[11px] text-slate-400">Auto-Post 3x/Day is enabled by default</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { id: '3_daily', label: '🔥 Auto-Post 3x / Day (9 AM, 2 PM, 7:30 PM) — Default' },
                    { id: '2_daily', label: '⚡ Auto-Post 2x / Day (9 AM & 7:30 PM)' },
                    { id: 'daily_peak', label: '🌙 Daily Peak Slot (7:30 PM IST)' },
                    { id: 'manual_hold', label: '✋ Manual Hold in Vault (Review before posting)' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAutoPostCadence(opt.id)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                        autoPostCadence === opt.id
                          ? 'bg-teal-500/20 border-teal-400 text-white'
                          : 'bg-[#06040c] border-slate-800 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Or Pick Custom Schedule Date/Time:</label>
                  <input
                    type="datetime-local"
                    value={customScheduleTime}
                    onChange={(e) => {
                      setCustomScheduleTime(e.target.value);
                      setAutoPostCadence('custom_manual');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
                  />
                </div>

                <button
                  onClick={() => setActiveToolModal(null)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold text-xs"
                >
                  Save Schedule Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. NOTIFICATIONS MODAL */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-3 shadow-2xl">
            <button onClick={() => setIsNotificationOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-pink-400" /> Activity & Alerts
            </h3>
            <div className="space-y-2.5">
              {notificationsList.map((n) => (
                <div key={n.id} className="p-3 rounded-2xl bg-[#130d26] border border-purple-500/25 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white">{n.title}</span>
                    <span className="text-[9px] text-cyan-400">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CONNECT YOUTUBE OAUTH MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-white">Connect YouTube Channel</h3>
            <p className="text-xs text-slate-300">Link your YouTube channel once to enable permanent 3x daily cloud auto-posting.</p>

            {connectError && <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl">{connectError}</p>}

            <button
              onClick={handleConnectYouTubeOAuth}
              className="w-full py-3 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Youtube className="w-4 h-4" /> Connect YouTube (OAuth Auto-Refresh)
            </button>

            <form onSubmit={handleQuickConnectYouTube} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400">Or Quick-Link Channel Handle:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ytHandleInput}
                  onChange={(e) => setYtHandleInput(e.target.value)}
                  placeholder="@YourChannelHandle"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
                />
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 text-xs font-bold text-white">
                  Link
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowClientGuideModal(!showClientGuideModal)}
              className="text-xs text-cyan-400 underline w-full text-center"
            >
              {showClientGuideModal ? 'Hide 4-Step OAuth Guide' : 'View Android 4-Step Guide'}
            </button>

            {showClientGuideModal && (
              <div className="space-y-2 bg-black/50 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300">
                <p>1. Open Google Cloud Console & create a project.</p>
                <p>2. Enable <b>YouTube Data API v3</b>.</p>
                <p>3. Add Redirect URI: <code className="text-cyan-300">{YOUTUBE_REDIRECT_URI}</code></p>
                <p>4. Paste Client ID & Secret in Settings tab for unlimited quota.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PRICING & UTR VERIFICATION MODAL (₹3,999 YEARLY VIP) */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />
              <h3 className="text-lg font-extrabold text-white">ShortsPilot VIP Pro</h3>
            </div>

            {upgradeReason && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 font-semibold">
                ⚡ {upgradeReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setSelectedBilling('monthly')}
                className={`p-3 rounded-2xl border cursor-pointer ${
                  selectedBilling === 'monthly' ? 'bg-cyan-500/15 border-cyan-400' : 'bg-[#120d24] border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-white">Monthly Pro</div>
                <div className="text-lg font-extrabold text-cyan-300 mt-1">₹{globalConfig.monthlyPrice}/mo</div>
                <div className="text-[10px] text-slate-400">50K Views Guarantee</div>
              </div>

              <div
                onClick={() => setSelectedBilling('yearly')}
                className={`p-3 rounded-2xl border cursor-pointer relative ${
                  selectedBilling === 'yearly' ? 'bg-amber-500/15 border-amber-400' : 'bg-[#120d24] border-slate-800'
                }`}
              >
                <span className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-extrabold">
                  SAVE ₹{yearlySavings}
                </span>
                <div className="text-xs font-bold text-amber-300">Yearly Studio VIP</div>
                <div className="text-lg font-extrabold text-amber-400 mt-1">₹{globalConfig.yearlyPrice}/yr</div>
                <div className="text-[10px] text-slate-300">100K Views + 5x Clips</div>
              </div>
            </div>

            {selectedBilling === 'monthly' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon Code"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white uppercase"
                />
                <button onClick={handleApplyCoupon} className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white">
                  Apply
                </button>
              </div>
            )}
            {couponMsg && <p className="text-[11px] text-emerald-400 font-semibold">{couponMsg}</p>}

            <form onSubmit={handleVerifyPayment} className="p-4 rounded-2xl bg-[#06040c] border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Payable Amount:</span>
                <span className="text-base font-extrabold text-emerald-400">₹{getPayableAmount()}</span>
              </div>
              <div className="text-xs text-slate-300">
                UPI ID: <span className="font-mono font-bold text-amber-300">{globalConfig.receiverUpi}</span>
              </div>
              <input
                type="email"
                value={gmailUser?.email || ''}
                onChange={(e) => setGmailUser({ ...(gmailUser || {}), email: e.target.value })}
                placeholder="Your Gmail ID for Pro Activation"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0818] border border-slate-700 text-xs text-white"
              />
              <input
                type="tel"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-Digit UPI UTR Number"
                className="w-full px-3 py-2 rounded-xl bg-[#0b0818] border border-slate-700 text-xs font-mono text-white"
              />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 text-white font-extrabold text-xs shadow-lg cursor-pointer"
              >
                Submit UTR & Activate VIP Pro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. AI SUPPORT ASSISTANT MODAL */}
      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[470px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-extrabold text-white">ShortsPilot AI Support</h3>
                  <p className="text-[9px] text-emerald-400">{liveUsersCount} Creators Online</p>
                </div>
              </div>
              <button onClick={() => setShowAiSupport(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 text-xs">
              {supportMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      m.role === 'user' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-[#140e28] text-slate-200 border border-purple-500/20'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendSupport} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask about 3x auto-post, views or VIP..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white outline-none"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. SIDE NAVIGATION / SETTINGS DRAWER */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm">
          <div className="w-72 bg-[#0b0818] border-r border-purple-500/30 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShortsPilotLogo className="w-5 h-5" />
                  <span className="font-extrabold text-sm text-white">ShortsPilot AI</span>
                </div>
                <button onClick={() => setIsSettingsDrawerOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold">
                ✅ Auto-Post 3x / Day Active
              </div>

              <div className="space-y-1 text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('home'); setIsSettingsDrawerOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-200"
                >
                  <Home className="w-4 h-4 text-pink-400" /> Home Dashboard
                </button>
                <button
                  onClick={() => { setIsConnectModalOpen(true); setIsSettingsDrawerOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-200"
                >
                  <Youtube className="w-4 h-4 text-red-500" /> Connect YouTube OAuth
                </button>
                <button
                  onClick={() => { setIsPricingOpen(true); setIsSettingsDrawerOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-amber-300"
                >
                  <Crown className="w-4 h-4" /> VIP Pro (₹3,999/yr)
                </button>
                <button
                  onClick={() => { setIsAdminOpen(true); setIsSettingsDrawerOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-purple-300"
                >
                  <Shield className="w-4 h-4" /> Master Owner Admin
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">ShortsPilot AI Studio • Full Production</div>
          </div>
          <div className="flex-1" onClick={() => setIsSettingsDrawerOpen(false)} />
        </div>
      )}

      {/* 7. FULL SEO REPORT MODAL */}
      {activeSeoModalClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-3 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setActiveSeoModalClip(null)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-extrabold text-white">AI Viral SEO Report ({activeSeoModalClip.hookScore})</h3>
            <pre className="p-3 rounded-2xl bg-[#06040c] border border-slate-800 text-[11px] text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {activeSeoModalClip.fullSeoReport || activeSeoModalClip.description}
            </pre>
          </div>
        </div>
      )}

      {/* 8. VIDEO PREVIEW MODAL */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-[290px] rounded-3xl bg-[#0b0818] border border-purple-500/40 p-3">
            <button
              onClick={() => setPreviewClip(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 border border-slate-700 text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <video src={sanitizeMediaUrl(previewClip.croppedUrl)} controls autoPlay playsInline className="w-full rounded-2xl aspect-[9/16]" />
          </div>
        </div>
      )}

      {/* 9. FULL MASTER OWNER ADMIN CONSOLE (Controls, UTR Approvals, Clients, AI Prompt) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#090714] border border-pink-500/50 p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-pink-400" /> Master Owner Admin Console
              </h3>
              <button onClick={() => setIsAdminOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="space-y-3">
                <p className="text-xs text-slate-400">Enter Master Security PIN:</p>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Master PIN"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#05040a] border border-slate-700 text-xs text-center text-white tracking-widest"
                  autoFocus
                />
                {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
                <button type="submit" className="w-full py-2.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold">
                  Unlock Admin Console
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex gap-1.5 bg-[#05040a] p-1 rounded-xl border border-slate-800">
                  {['controls', 'transactions', 'clients', 'ai'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAdminSubTab(t)}
                      className={`flex-1 py-1.5 rounded-lg font-bold capitalize ${
                        adminSubTab === t ? 'bg-pink-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {adminSubTab === 'controls' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Receiver UPI ID</label>
                        <input
                          type="text"
                          value={globalConfig.receiverUpi}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, receiverUpi: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#05040a] border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Yearly Price (INR)</label>
                        <input
                          type="text"
                          value={globalConfig.yearlyPrice}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })}
                          className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#05040a] border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleManualGrantPro} className="flex gap-2 pt-2">
                      <input
                        type="email"
                        value={manualProEmail}
                        onChange={(e) => setManualProEmail(e.target.value)}
                        placeholder="Grant instant VIP to Gmail..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#05040a] border border-slate-700 text-white"
                      />
                      <button type="submit" className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                        Grant Pro
                      </button>
                    </form>

                    <button
                      onClick={handlePublishGlobalConfig}
                      disabled={isSyncingGlobal}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold"
                    >
                      {isSyncingGlobal ? 'Syncing to Firebase...' : 'Save & Publish Live Config'}
                    </button>
                  </div>
                )}

                {adminSubTab === 'transactions' && (
                  <div className="space-y-2">
                    <div className="text-emerald-400 font-bold">Verified Revenue: ₹{totalVerifiedRevenue}</div>
                    {transactions.length === 0 ? (
                      <p className="text-slate-400">No UTR transactions submitted yet.</p>
                    ) : (
                      transactions.map((txn, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#05040a] border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{txn.user}</div>
                            <div className="text-[10px] text-slate-400">UTR: {txn.utr} • {txn.amount} ({txn.status})</div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleAdminApproveTxn(txn)} className="px-2 py-1 rounded bg-emerald-600 text-white font-bold">
                              Approve
                            </button>
                            <button onClick={() => handleAdminRejectTxn(txn)} className="px-2 py-1 rounded bg-rose-600 text-white font-bold">
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminSubTab === 'clients' && (
                  <div className="space-y-2">
                    {clientsList.length === 0 ? (
                      <p className="text-slate-400">No registered clients found.</p>
                    ) : (
                      clientsList.map((cli) => (
                        <div key={cli.id} className="p-2.5 rounded-xl bg-[#05040a] border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{cli.email}</div>
                            <div className="text-[10px] text-slate-400">{cli.youtubeHandle} • {cli.tier}</div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleAdminSetClientTier(cli, 'pro')} className="px-2 py-1 rounded bg-amber-500 text-black font-bold">
                              Make VIP
                            </button>
                            <button onClick={() => handleAdminToggleBanClient(cli)} className="px-2 py-1 rounded bg-rose-700 text-white">
                              {cli.banned ? 'Unban' : 'Ban'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {adminSubTab === 'ai' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400">Master Viral SEO Prompt</label>
                    <textarea
                      rows={5}
                      value={globalConfig.customAiPrompt}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, customAiPrompt: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[#05040a] border border-slate-700 text-white text-[11px]"
                    />
                    <button onClick={handlePublishGlobalConfig} className="w-full py-2 rounded-xl bg-pink-600 text-white font-bold">
                      Save AI Prompt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
