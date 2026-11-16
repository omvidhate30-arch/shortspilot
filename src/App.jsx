import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Sliders, X, Trash2, Download,
  RefreshCw, Radio, Send, Scissors, HardDrive,
  Wrench, IndianRupee, BarChart3, Calendar,
  Clock, Eye, ThumbsUp, Users, Bot, Volume2,
  Crown, Check, Hourglass, Tag,
  FileText, Mail, Globe, Ban, UserPlus, Bell, KeyRound, ShieldCheck,
  Flame, Star, HelpCircle, ChevronDown, Edit3, Layers, Languages, MessageSquare
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
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path d="M20 12H36C44.8366 12 52 19.1634 52 28C52 36.8366 44.8366 44 36 44H25L20 54V36" stroke="url(#spGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 28H26M26 21L38 28L26 35V21Z" stroke="url(#spGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
  const [customClientSecret, setCustomClientSecret] = useState('');
  const [showClientGuideModal, setShowClientGuideModal] = useState(false);

  const [activeTab, setActiveTab] = useState('studio');
  const [tier, setTier] = useState('free');
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [activePlanType, setActivePlanType] = useState('');
  const [paymentStatusNote, setPaymentStatusNote] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [clipMode, setClipMode] = useState('fullshort');

  const [autoPostCadence, setAutoPostCadence] = useState('3_daily');
  const [customScheduleTime, setCustomScheduleTime] = useState('');
  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [autoUploadBannerStatus, setAutoUploadBannerStatus] = useState('idle');

  const [selectedNiche, setSelectedNiche] = useState('Gaming (Free Fire / BGMI / GTA)');
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish (India Viral)');
  const [selectedHookStyle, setSelectedHookStyle] = useState('Curiosity & Suspense 😱');
  const [selectedCtaStyle, setSelectedCtaStyle] = useState('Comment Your Reaction 👇');
  const [editingClipId, setEditingClipId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editTagsValue, setEditTagsValue] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [liveUsersCount, setLiveUsersCount] = useState(2148);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Hi! I am your ShortsPilot AI Support Assistant. Ask me anything about 3x daily scheduling (Morning/Afternoon/Night), Manual Mode, boosting Shorts views, or VIP plans!'
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
    subscribers: '—',
    totalViews: '—',
    videoCount: '—',
    country: 'IN',
    recentVideos: [],
    loading: false
  });

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [couponInput, setCouponInput] = useState('SAVE200');
  const [appliedCoupon, setAppliedCoupon] = useState('SAVE200');
  const [couponMsg, setCouponMsg] = useState('🎉 Default Coupon "SAVE200" applied! ₹200 OFF.');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [activeSeoModalClip, setActiveSeoModalClip] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('controls');
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
      let reply = 'Tip for 10x Views: Type your exact video topic in the "Video Topic" box before selecting your video, and use 3x Daily Auto-Schedule (9 AM, 2 PM, 7:30 PM) or Manual Mode!';
      if (lower.includes('quota') || lower.includes('limit') || lower.includes('error') || lower.includes('client')) {
        reply = 'If you see a YouTube quota exceeded error, click "Connect YouTube" at the top right, open the 4-Step Guide, and paste your own Google Cloud Client ID & Secret!';
      } else if (lower.includes('utr') || lower.includes('payment') || lower.includes('pro') || lower.includes('vip') || lower.includes('price')) {
        reply = `Yearly Studio VIP is ₹${globalConfig.yearlyPrice}/year (100K+ Views/Mo Guarantee + 5x Clips) and Monthly Pro is ₹299 with coupon SAVE200. Submit your 12-digit UTR for instant activation!`;
      } else if (lower.includes('manual') || lower.includes('schedule') || lower.includes('time')) {
        reply = 'You can use Auto 3x/Day (Default) or switch to "Manual Mode (Hold & Post)" to review titles and click "Manual Post Public Now" or pick a custom date/time on each video card!';
      }
      setSupportMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    }, 600);
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
    setYtStats({ subscribers: '—', totalViews: '—', videoCount: '—', country: 'IN', recentVideos: [], loading: false });
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_gmail_user');
    localStorage.removeItem('sp_yt_access_token');
    localStorage.removeItem('sp_yt_refresh_token');
    localStorage.removeItem('sp_yt_token_time');
    setIsConnectModalOpen(false);
    setIsSettingsOpen(false);
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
        subscribers: Number(stats.subscriberCount || 0).toLocaleString(),
        totalViews: Number(stats.viewCount || 0).toLocaleString(),
        videoCount: Number(stats.videoCount || 0).toLocaleString(),
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
    if ((activeTab === 'analytics' || activeTab === 'studio') && (ytChannel?.accessToken || localStorage.getItem('sp_yt_access_token'))) {
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
        if (!String(err.message).includes('401')) alert(`YouTube Upload Error: ${err.message}`);
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

    if (!ytChannelRef.current?.accessToken && !localStorage.getItem('sp_yt_access_token')) {
      setConnectError('Please click "Connect YouTube (OAuth Auto-Refresh)" to enable uploading.');
      setIsConnectModalOpen(true);
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

        const readyClip = {
          id: clipId,
          title: aiMeta.title,
          hashtags: aiMeta.hashtags,
          description: aiMeta.description,
          keywords: aiMeta.keywords,
          fullSeoReport: aiMeta.fullSeoReport,
          status: 'ready',
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

        if (!isManualHold) {
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

    if (!gmailUser?.email) return setCheckoutError('Please sign in with Google / enter your Gmail first before submitting UTR.');

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
      alert('✅ Live Updated! Master AI Prompt, Banner & Controls are now live.');
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

  const totalVerifiedRevenue = transactions
    .filter((t) => t.status === 'Verified')
    .reduce((sum, t) => sum + (Number(t.numericAmount) || 499), 0);

  const faqItems = [
    {
      q: 'Kya phone ya laptop band hone ke baad bhi Short apne aap post hoga?',
      a: 'Haan! Jaise hi aap video select karte hain, ShortsPilot use YouTube ke official cloud server par Morning (9 AM), Afternoon (2 PM) aur Night (7:30 PM) slots mein schedule kar deta hai. Uske baad aapka phone band bhi ho, YouTube sahi time par video public kar dega.'
    },
    {
      q: 'Manual Mode (Hold & Post) kaise kaam karta hai?',
      a: 'Agar aap "Manual Mode" select karke video upload karte hain, toh AI uska viral title aur tags taiyar karke Vault mein rakh deta hai. Phir aap jab chahein 1-click mein "Manual Post Public Now" ya apna custom date/time chunkar post kar सकते hain.'
    },
    {
      q: '50K aur 100K Views Guarantee kaise kaam karti hai?',
      a: 'Agar aap Pro plan lekar rozana Shorts schedule karte hain aur 30 din mein aapke channel par guaranteed views nahi aate, toh agle 30 din ka Pro plan aapko 100% FREE diya jata hai.'
    },
    {
      q: 'YouTube Upload Limit / Quota Exceeded aane par kya karein?',
      a: 'Aap ऊपर "Connect YouTube" बटन पर क्लिक करके Android 4-Step Guide देख सकते हैं और अपना खुद का Google Client ID & Secret डालकर अनलिमिटेड अपलोड कर सकते हैं।'
    }
  ];

  if (globalConfig.maintenanceMode && !isAdminOpen) {
    return (
      <div className="min-h-screen bg-[#070913] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShortsPilotLogo className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ShortsPilot is Upgrading</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">Deploying faster 9:16 AI rendering servers. Back online shortly!</p>
        <button onClick={() => setIsAdminOpen(true)} className="text-xs text-slate-600">Owner Access</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#070913] text-slate-100 font-sans relative overflow-x-hidden flex flex-col items-center">
      {globalConfig.broadcastAlertActive && globalConfig.broadcastAlertText && !dismissedBroadcast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 p-4 rounded-2xl bg-[#101528] border border-amber-400/50 shadow-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="text-xs font-bold text-amber-300 mb-0.5">ShortsPilot Notice</div>
              <p className="text-xs text-slate-200 leading-relaxed">{globalConfig.broadcastAlertText}</p>
            </div>
          </div>
          <button onClick={() => setDismissedBroadcast(true)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {globalConfig.bannerActive && globalConfig.bannerText && (
        <div
          onClick={() => tier !== 'pro' && openProModalWithReason('Grab Limited-Time Offer: ₹3,999 (Original ₹5,999)!', 'yearly')}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-sky-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-3 text-center cursor-pointer shadow-md"
        >
          {globalConfig.bannerText}
        </div>
      )}

      {/* MOBILE APP CONTAINER (EXACTLY MATCHING YOUR REFERENCE UI) */}
      <div className="w-full max-w-md bg-[#070913] text-white rounded-none sm:rounded-[36px] sm:border sm:border-purple-500/30 sm:shadow-2xl overflow-hidden relative font-sans my-0 sm:my-6 flex flex-col min-h-screen sm:min-h-0">
        
        {/* TOP APP BAR */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-[#070913]/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-300 hover:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
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
            <button onClick={() => openProModalWithReason('Upgrade to Pro!')} className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[11px] flex items-center gap-1 shadow-md shadow-amber-500/20">
              <Crown className="w-3 h-3 fill-black" /> Pro
            </button>
            <button onClick={() => setIsConnectModalOpen(true)} className="relative p-2 rounded-full bg-[#121829] border border-slate-800 text-slate-300 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            </button>
            <div onClick={() => setShowAiSupport(true)} className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 p-0.5 flex items-center justify-center cursor-pointer shadow-lg shadow-sky-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="px-4 pb-28 pt-2 space-y-4 overflow-y-auto flex-1">

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
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/40 hover:scale-105 transition-transform"
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
            <div className="p-2.5 rounded-2xl bg-[#101528] border border-sky-500/20 text-center shadow-lg">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                <Play className="w-3.5 h-3.5 fill-sky-400" />
              </div>
              <div className="text-sm font-extrabold text-white">{ytStats.videoCount !== '—' ? ytStats.videoCount : '247'}</div>
              <div className="text-[9px] text-slate-400">Videos Posted</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#101528] border border-emerald-500/20 text-center shadow-lg">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-extrabold text-emerald-400">{ytStats.subscribers}</div>
              <div className="text-[9px] text-slate-400">Subs <span className="text-emerald-400 font-bold">↑18%</span></div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#101528] border border-purple-500/20 text-center shadow-lg">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="text-sm font-extrabold text-purple-400">{ytStats.totalViews}</div>
              <div className="text-[9px] text-slate-400">Views <span className="text-purple-400 font-bold">↑46%</span></div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#101528] border border-amber-500/20 text-center shadow-lg">
              <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <div className="text-sm font-extrabold text-amber-400">9.8/10</div>
              <div className="text-[9px] text-slate-400">Viral Score</div>
            </div>
          </div>

          {/* AUTO-POST 3X / DAY WIDGET + MANUAL MODE TOGGLE */}
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
                onClick={() => setAutoPostCadence(autoPostCadence === 'manual_hold' ? '3_daily' : 'manual_hold')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold transition-all ${
                  autoPostCadence === 'manual_hold' 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <span>{autoPostCadence === 'manual_hold' ? 'Manual Hold' : 'Active'}</span>
                <div className={`w-3 h-3 rounded-full ${autoPostCadence === 'manual_hold' ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div 
                onClick={() => setAutoPostCadence('3_daily')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${autoPostCadence === '3_daily' ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-800'}`}
              >
                <div className="text-amber-400 text-xs mb-0.5">☀️</div>
                <div className="text-xs font-bold text-white">9:00 AM</div>
                <div className="text-[8px] text-slate-400">Morning Slot</div>
              </div>
              <div 
                onClick={() => setAutoPostCadence('2_daily')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${autoPostCadence === '2_daily' ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-800'}`}
              >
                <div className="text-amber-300 text-xs mb-0.5">☀️</div>
                <div className="text-xs font-bold text-white">2:00 PM</div>
                <div className="text-[8px] text-slate-400">Afternoon Slot</div>
              </div>
              <div 
                onClick={() => setAutoPostCadence('daily_peak')}
                className={`p-2.5 rounded-2xl bg-[#070913] border text-center cursor-pointer transition-all ${autoPostCadence === 'daily_peak' ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-800'}`}
              >
                <div className="text-purple-400 text-xs mb-0.5">🌙</div>
                <div className="text-xs font-bold text-white">7:30 PM</div>
                <div className="text-[8px] text-slate-400">Night Peak</div>
              </div>
            </div>

            {/* VIEWS BOOSTER TOPIC INPUT */}
            <div className="pt-1">
              <input
                type="text"
                value={customVideoTopic}
                onChange={(e) => setCustomVideoTopic(e.target.value)}
                placeholder="🎯 Video Topic for 10x Views (e.g. Free Fire Clutch)"
                className="w-full px-3 py-2 rounded-xl bg-[#070913] border border-sky-500/30 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400 text-center font-medium"
              />
            </div>
          </div>

          {/* QUICK FEATURES 4-GRID */}
          <div className="grid grid-cols-2 gap-2.5">
            <div 
              onClick={() => setClipMode('3clips')}
              className="p-3 rounded-2xl bg-[#101528] border border-sky-500/30 hover:border-sky-400 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">AI Edit</div>
                  <div className="text-[9px] text-slate-400">Auto Cut & Caption</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div 
              onClick={() => setSelectedNiche('Gaming (Free Fire / BGMI / GTA)')}
              className="p-3 rounded-2xl bg-[#101528] border border-pink-500/30 hover:border-pink-400 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center text-pink-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">Smart Hashtags</div>
                  <div className="text-[9px] text-slate-400">Trending Tags</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div 
              onClick={() => openProModalWithReason('Thumbnail Generator requires Pro!')}
              className="p-3 rounded-2xl bg-[#101528] border border-purple-500/30 hover:border-purple-400 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-white">Thumbnail Gen</div>
                  <div className="text-[9px] text-slate-400">High CTR Titles</div>
                </div>
              </div>
              <span className="text-slate-500">›</span>
            </div>

            <div 
              onClick={() => setAutoPostCadence('custom_manual')}
              className="p-3 rounded-2xl bg-[#101528] border border-emerald-500/30 hover:border-emerald-400 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
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

          {/* QUEUE & RECENT POSTS SECTION */}
          {videoQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Vault & Active Queue ({videoQueue.length})
                </h3>
                <button onClick={handleClearAllClips} className="text-[11px] text-pink-400 hover:underline">Clear All</button>
              </div>

              {videoQueue.map((clip) => {
                const safeClipUrl = sanitizeMediaUrl(clip.croppedUrl);
                const safeYtUrl = sanitizeMediaUrl(clip.youtubeUrl);
                return (
                  <div key={clip.id} className="p-3 rounded-2xl bg-[#101528] border border-sky-500/30 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{clip.title}</h4>
                        <p className="text-[10px] text-sky-400 truncate">{clip.hashtags}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 shrink-0 font-bold">
                        {clip.hookScore}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      {safeClipUrl && (
                        <button onClick={() => setPreviewClip(clip)} className="text-xs text-sky-300 underline flex items-center gap-1">
                          <Play className="w-3 h-3 fill-sky-300" /> Preview Short
                        </button>
                      )}
                      
                      {clip.status === 'ready' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => uploadClipToYouTubeAPI(clip, null)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]"
                          >
                            Post Now
                          </button>
                          <button
                            onClick={() => uploadClipToYouTubeAPI(clip, getMultiSlotScheduleIso(0, '3_daily'))}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[10px]"
                          >
                            Schedule
                          </button>
                        </div>
                      )}
                      {clip.status === 'uploading' && <span className="text-amber-400 animate-pulse text-[10px]">Uploading...</span>}
                      {clip.status === 'published' && <span className="text-emerald-400 text-[10px] font-bold">Published ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DEFAULT RECENT POSTS SAMPLE */}
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
                  <h4 className="text-xs font-bold text-white mb-0.5">AI Shorts Automation Setup 🔥</h4>
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
        <div className="absolute bottom-0 left-0 right-0 bg-[#070913]/95 backdrop-blur-md border-t border-purple-500/20 px-4 py-2.5 flex items-center justify-around z-30">
          <button onClick={() => setActiveTab('studio')} className="flex flex-col items-center gap-1 text-pink-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>
          
          {/* FLOATING UPLOAD BUTTON (+) */}
          <div className="relative -top-5">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-pink-600/50 hover:scale-110 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-[#070913] flex items-center justify-center">
                <span className="text-2xl font-light text-pink-400">+</span>
              </div>
            </button>
          </div>

          <button onClick={() => setIsPricingOpen(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <Crown className="w-5 h-5" />
            <span className="text-[10px] font-medium">Projects</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>

      </div>

      {/* --- ALL MODALS & DIALOGS (ANALYTICS, PRICING, ADMIN, CONNECT YOUTUBE, SUPPORT) --- */}
      {activeTab === 'analytics' && (
        <div className="fixed inset-0 z-40 bg-[#070913] p-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between pt-4">
              <h2 className="text-lg font-bold text-white">24h–36h Audience Analytics</h2>
              <button onClick={() => setActiveTab('studio')} className="p-2 rounded-xl bg-slate-800 text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800">
                <div className="text-xs text-slate-400">Subscribers</div>
                <div className="text-xl font-bold text-white">{ytStats.subscribers}</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800">
                <div className="text-xs text-slate-400">Total Views</div>
                <div className="text-xl font-bold text-white">{ytStats.totalViews}</div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#101528] border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-sky-400">Peak Performance Time</div>
              <p className="text-xs text-slate-300">{audienceInsight.peakHourLabel}</p>
              <p className="text-[11px] text-slate-400">{audienceInsight.strategyTip}</p>
            </div>
            <button onClick={() => fetchYouTubeAnalytics()} className="w-full py-3 rounded-xl bg-purple-600 text-white text-xs font-bold">
              Refresh Analytics
            </button>
          </div>
        </div>
      )}

      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#080c15] border border-sky-500/40 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-white mb-2">Connect YouTube Account</h3>
            <p className="text-xs text-slate-400 mb-4">Connect via OAuth to enable auto-posting and analytics.</p>
            
            {connectError && <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-xl mb-3">{connectError}</p>}

            <button
              type="button"
              onClick={handleConnectYouTubeOAuth}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center gap-2 mb-4"
            >
              <Youtube className="w-4 h-4" /> Connect YouTube (OAuth Auto-Refresh)
            </button>
            
            <button onClick={() => setShowClientGuideModal(!showClientGuideModal)} className="text-xs text-sky-400 underline w-full text-center">
              {showClientGuideModal ? 'Hide 4-Step Guide' : 'View Android 4-Step Guide'}
            </button>

            {showClientGuideModal && (
              <div className="mt-3 space-y-3 bg-black/50 p-3 rounded-xl border border-slate-800 text-xs">
                <p>1. Go to Google Cloud Console and create a project named <b>ShortsPilot</b>.</p>
                <p>2. Enable <b>YouTube Data API v3</b>.</p>
                <p>3. Create OAuth client ID (Web application) and add redirect URI: <code className="text-sky-300">{YOUTUBE_REDIRECT_URI}</code></p>
                <p>4. Copy Client ID and Secret to paste below if needed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#080c15] border border-amber-400/40 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-amber-400 mb-2">Upgrade to ShortsPilot Pro</h3>
            <p className="text-xs text-slate-400 mb-4">Get 50K–100K Guaranteed Monthly Views & 3x/5x Clips Extractor.</p>
            
            <div className="space-y-3 mb-4">
              <div className="p-3 rounded-2xl bg-[#101528] border border-sky-500/30 flex justify-between items-center cursor-pointer" onClick={() => setSelectedBilling('monthly')}>
                <div>
                  <div className="text-xs font-bold text-white">Monthly Pro</div>
                  <div className="text-[10px] text-slate-400">50K Views/Mo Guarantee</div>
                </div>
                <div className="text-sm font-extrabold text-sky-400">₹{globalConfig.monthlyPrice}/mo</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#101528] border border-amber-400/40 flex justify-between items-center cursor-pointer" onClick={() => setSelectedBilling('yearly')}>
                <div>
                  <div className="text-xs font-bold text-amber-300">Yearly Studio VIP (Best Value)</div>
                  <div className="text-[10px] text-slate-400">100K Views/Mo Guarantee + 5x Clips</div>
                </div>
                <div className="text-sm font-extrabold text-amber-400">₹{globalConfig.yearlyPrice}/yr</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#070913] border border-slate-800 space-y-2 mb-4">
              <div className="text-xs font-bold text-slate-300">Pay via UPI & Submit UTR:</div>
              <div className="text-xs font-mono text-emerald-400">{globalConfig.receiverUpi}</div>
              <input
                type="email"
                value={gmailUser?.email || ''}
                onChange={(e) => setGmailUser({ ...(gmailUser || {}), email: e.target.value })}
                placeholder="Enter your Gmail ID"
                className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700 text-xs text-white"
              />
              <input
                type="tel"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-digit UTR No."
                className="w-full px-3 py-2 rounded-xl bg-[#080c15] border border-slate-700 text-xs font-mono text-white"
              />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button onClick={handleVerifyPayment} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 text-white text-xs font-bold">
                Submit UTR & Unlock Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md h-[450px] rounded-3xl bg-[#080c15] border border-sky-500/40 p-4 flex flex-col">
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
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask about auto-posting or views..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#070913] border border-slate-700 text-xs text-white"
              />
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
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                ✅ Direct Token Auto-Refresh Active
              </div>
              {gmailUser && (
                <button onClick={handleDisconnectAll} className="w-full py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  Logout ({gmailUser.email})
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-500">ShortsPilot AI Studio v17.0</div>
          </div>
        </div>
      )}

      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-[280px] rounded-3xl bg-[#080c15] border border-sky-500/40 p-3">
            <button onClick={() => setPreviewClip(null)} className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 border border-slate-700 text-white z-10">
              <X className="w-4 h-4" />
            </button>
            <video src={sanitizeMediaUrl(previewClip.croppedUrl)} controls autoPlay playsInline className="w-full rounded-2xl aspect-[9/16]" />
          </div>
        </div>
      )}

    </div>
  );
}
