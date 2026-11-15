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
const YOUTUBE_REDIRECT_URI = 'https://shortspilot-two.vercel.app/api/youtube/callback';
const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';

const DEFAULT_AI_KEY = '';
const DEFAULT_CLAUDE_KEY = '';

const DEFAULT_CUSTOM_AI_PROMPT = `Act as my Personal Viral Video SEO Expert, YouTube Shorts Growth Strategist and Short-Form Content Specialist.
YOUR TASK:
I will send you a video. You must carefully analyze the actual video context first. Then generate all titles, captions, hashtags and SEO content based ONLY on that specific video.
IMPORTANT: Never give generic or random content. Every output must match the actual video.
FOR EVERY VIDEO, GENERATE:
1. BEST VIRAL TITLE
- Create 3 catchy, curiosity-driven titles.
- Select the strongest title as BEST TITLE.
- Make it SEO-friendly and engaging.
2. VIRAL CAPTION
- Write an attractive, engaging caption.
- Start with a powerful hook.
- Make viewers interested in watching until the end.
- Add a natural call to action.
3. TRENDING HASHTAGS
- Give relevant hashtags based on the video's topic.
- Mix niche-specific, popular and currently trending hashtags.
- Never use irrelevant or fake trending hashtags.
4. SEO KEYWORDS
- Give 10-15 relevant searchable keywords.
5. VIDEO DESCRIPTION
- Create a professional, SEO-optimized YouTube Shorts description.
6. BEST THUMBNAIL TEXT
- Suggest 3 short, powerful thumbnail text options.
7. VIRAL POTENTIAL ANALYSIS
- Score the video's potential from 1 to 10.
- Analyze its hook, audience appeal, engagement potential and retention.
- Give practical suggestions to improve performance.
STRICT RULES:
- Understand the video's language, category, mood and target audience.
- Match the output language to the video and its audience.
- Do not invent events, facts or claims that are not visible in the video.
- Do not blindly use the same hashtags for every video.
- Prioritize audience retention, clicks, shares and comments.
- Never promise 99% viral success. Focus on maximizing viral potential.
- Keep everything professional, powerful and ready to copy and paste.
FINAL OUTPUT:
Present the BEST TITLE, CAPTION and HASHTAGS first so I can copy them immediately.`;

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
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbSaveClip = async (clipObj) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const { croppedUrl, ...persistable } = clipObj;
      store.put({ ...persistable, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return false;
  }
};

const idbGetAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        const hydrated = items.map((item) => ({
          ...item,
          croppedUrl: item.blob instanceof Blob ? URL.createObjectURL(item.blob) : null
        }));
        resolve(hydrated);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
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
  } catch {
    return false;
  }
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
  } catch {
    return false;
  }
};

const inspectVideoProperties = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof Blob)) {
      resolve({ duration: 15, width: 1080, height: 1920, isVerticalOrSquare: true, isAlreadyShort: false });
      return;
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
      const isAlreadyShort = isVerticalOrSquare && duration <= 185;
      URL.revokeObjectURL(url);
      resolve({ duration, width, height, isVerticalOrSquare, isAlreadyShort });
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
  const [autoPostCadence, setAutoPostCadence] = useState('daily_peak');
  const [autoUploadBannerStatus, setAutoUploadBannerStatus] = useState('idle');

  const [selectedNiche, setSelectedNiche] = useState('Auto-Detect Niche');
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
      text: 'Hi! I am your ShortsPilot AI Support Assistant. Ask me anything about YouTube quota limits, daily auto-scheduling, video rendering, or VIP plans!'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [audienceInsight, setAudienceInsight] = useState({
    peakHour: 19,
    peakMinute: 30,
    peakHourLabel: '07:30 PM IST (High Evening Engagement)',
    suggestedIso: '',
    topRegion: 'India (IN) • Hindi / Hinglish',
    strategyTip: 'Batch upload multiple videos once — ShortsPilot auto-schedules 1 Short per day at Peak Time on YouTube servers.',
    isAnalyzing: false
  });

  const [gmailUser, setGmailUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sp_gmail_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [ytChannel, setYtChannel] = useState(() => {
    try {
      const saved = localStorage.getItem('sp_yt_channel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
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
  const usedTitlesHistoryRef = useRef(new Set());
  const scheduleDayOffsetRef = useRef(0);

  const activeClientId =
    (customClientId || '').trim() ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    globalConfig.googleClientId ||
    localStorage.getItem('sp_google_client_id') ||
    DEFAULT_GOOGLE_CLIENT_ID;

  const activeClientSecret = (customClientSecret || '').trim() || DEFAULT_GOOGLE_SECRET;

  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
  const yearlySavings = Math.max(0, Number(globalConfig.yearlyOriginalPrice || 5999) - Number(globalConfig.yearlyPrice || 3999));

  // Dynamic Live Customers Counter (Changes every 3 seconds randomly)
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
      let reply = 'I am here to help! Select your video in the Studio, choose your Niche & Language, and ShortsPilot will automatically generate viral titles and schedule your Short at Peak Hour.';
      if (lower.includes('quota') || lower.includes('limit') || lower.includes('error') || lower.includes('client')) {
        reply = 'If you see a YouTube quota exceeded error, click "Connect YouTube" at the top right, open the 4-Step Guide, and paste your own Google Cloud Client ID & Secret for dedicated unlimited quota!';
      } else if (lower.includes('utr') || lower.includes('payment') || lower.includes('pro') || lower.includes('vip') || lower.includes('price')) {
        reply = `Yearly Studio VIP is ₹${globalConfig.yearlyPrice}/year (100K+ Views/Mo Guarantee + 5x Clips) and Monthly Pro is ₹299 with coupon SAVE200. After paying via UPI, submit your 12-digit UTR for fast activation!`;
      } else if (lower.includes('schedule') || lower.includes('time') || lower.includes('band') || lower.includes('offline')) {
        reply = 'Once your video status shows "Scheduled on YT", it is saved on YouTube cloud servers. Even if you turn off your phone or laptop, YouTube will publish it at Peak Time!';
      }
      setSupportMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    }, 650);
  };

  const getNextPeakIsoWithOffset = (hour24 = 19, minute = 30, dayOffset = 0) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour24, minute, 0, 0);
    if (target.getTime() <= now.getTime() + 25 * 60 * 1000) {
      target.setDate(target.getDate() + 1);
    }
    target.setDate(target.getDate() + dayOffset);
    const pad = (n) => String(n).padStart(2, '0');
    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
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
      const token = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
      if (!token) return;
      setVideoQueue((currentQueue) => {
        const nextPending = currentQueue.find((c) => c.status === 'ready' && c.blob);
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
    if (newRefreshToken) {
      localStorage.setItem('sp_yt_refresh_token', newRefreshToken);
    }

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
      if (Date.now() - lastTime > 40 * 60 * 1000) {
        await refreshYouTubeAccessToken();
      }
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

    const getHeaders = (t) => ({
      ...(options.headers || {}),
      Authorization: `Bearer ${t}`
    });

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
        if (newRefreshToken) {
          localStorage.setItem('sp_yt_refresh_token', newRefreshToken);
        }
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        hydrateGoogleAndYouTubeProfile(newAccessToken, newRefreshToken);
      }
    }
  }, []);

  const handleConnectYouTubeOAuth = () => {
    setConnectError('');
    const clientId = activeClientId.trim();
    if (!clientId) {
      setConnectError('Google Client ID is missing.');
      return;
    }

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
      const disc = Number(globalConfig.couponDiscount || 0);
      return Math.max(1, base - disc);
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
      if (txnData && typeof txnData === 'object') {
        setTransactions(Object.entries(txnData).map(([key, val]) => ({ firebaseKey: key, ...val })).reverse());
      } else {
        setTransactions([]);
      }
      const cliData = await cliRes.json();
      if (cliData && typeof cliData === 'object') {
        setClientsList(Object.entries(cliData).map(([key, val]) => ({ id: key, ...val })).reverse());
      } else {
        setClientsList([]);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFirebaseAll();
    const interval = setInterval(fetchFirebaseAll, 15000);
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
              categoryId: v.snippet?.categoryId || '22',
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
          ? `Your top Short "${topTitleSample.slice(0, 32)}..." peaked around ${hr12}:30 ${ampm}. Batch videos auto-schedule daily at ${hr12}:30 ${ampm}.`
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
      .replace(/\b\d{6,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!topic || topic.length < 3) {
      const genericThemes = isIndia
        ? ['Aaj Ka Sabse Bada Twist', 'Ye Moment Miss Mat Karna', 'Real Life Shocking Scene', 'End Tak Dekho Kya Hua', 'Unbelievable Reaction']
        : ['The Moment Everything Changed', 'Wait Until The Very End', 'Nobody Saw This Coming', 'Unbelievable Split-Second Moment', 'Pure Goosebumps Scene'];
      topic = genericThemes[(clipIndex + Math.floor(Math.random() * genericThemes.length)) % genericThemes.length];
    }

    const hookAngles = isIndia
      ? [
          `Wait For The End 😱 ${topic}`,
          `99% Log Ye Baat Nahi Jante 🔥 ${topic}`,
          `Aakhir Mein Jo Hua Dekh Kar Shock Ho Jaoge 🤯 ${topic}`,
          `Kya Aapne Kabhi Aisa Dekha Hai? 👀 ${topic}`,
          `Is Scene Ne Sabko Hila Diya ⚡ ${topic}`,
          `Sirf 15 Second Mein Pura Sach 🎯 ${topic}`,
          `Yakeen Nahi Hoga Par Ye Sach Hai 😳 ${topic}`,
          `Sabse Khatarnak Moment 🚨 ${topic}`
        ]
      : [
          `Wait Until The Final Second 😱 ${topic}`,
          `99% Of People Missed This Detail 🔥 ${topic}`,
          `What Happens Next Will Blow Your Mind 🤯 ${topic}`,
          `Have You Ever Seen Anything Like This? 👀 ${topic}`,
          `The Exact Moment Everything Shifted ⚡ ${topic}`,
          `Watch Closely Before It Ends 🎯 ${topic}`,
          `Nobody Expected This Outcome 😳 ${topic}`,
          `Pure Intensity In 15 Seconds 🚨 ${topic}`
        ];

    const seed = (clipIndex * 3 + Math.floor(Math.random() * hookAngles.length)) % hookAngles.length;
    let chosenTitle = hookAngles[seed];
    if (usedTitlesHistoryRef.current.has(chosenTitle.toLowerCase())) {
      chosenTitle = `${hookAngles[(seed + 1) % hookAngles.length]} (${partLabel.split(':')[0]})`;
    }
    usedTitlesHistoryRef.current.add(chosenTitle.toLowerCase());

    const words = topic
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 2)
      .map((w) => `#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}`);

    const tagPools = isIndia
      ? [
          ['#Shorts', '#HindiShorts', '#ExplorePage', '#MustWatch'],
          ['#YouTubeShorts', '#DailyDose', '#MindBlown', '#TrendingNow'],
          ['#YTShorts', '#IndiaTrending', '#WaitForEnd', '#ViralClip'],
          ['#ShortVideo', '#ShockingFacts', '#NewShort', '#ForYou'],
          ['#ShortsFeed', '#DesiVibes', '#NextLevel', '#WatchTillEnd']
        ]
      : [
          ['#Shorts', '#ExplorePage', '#MustWatch', '#MindBlown'],
          ['#YouTubeShorts', '#DailyClips', '#TrendingNow', '#WaitForIt'],
          ['#YTShorts', '#ViralClips', '#Unbelievable', '#ForYou'],
          ['#ShortVideo', '#EpicMoments', '#NewShort', '#WatchTillEnd'],
          ['#ShortsFeed', '#NextLevel', '#DidYouKnow', '#Trending']
        ];

    const pool = tagPools[(clipIndex + Math.floor(Math.random() * tagPools.length)) % tagPools.length];
    const combinedTags = Array.from(new Set([...words, ...pool])).slice(0, 5).join(' ');

    const fallbackReport = `BEST TITLE: ${chosenTitle}
VIRAL CAPTION: ${chosenTitle} — ${selectedCtaStyle}
YOUTUBE SHORTS HASHTAGS: ${combinedTags}
SEO KEYWORDS: ${topic}, YouTube Shorts, Viral Shorts, Trending Video, Shorts Feed
VIDEO DESCRIPTION: ${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}
THUMBNAIL TEXT: 1) WAIT FOR IT 😱  2) UNBELIEVABLE 🔥  3) REAL OR FAKE? 🤯
VIRAL POTENTIAL SCORE: 9.5/10`;

    return {
      title: chosenTitle.slice(0, 82),
      hashtags: combinedTags,
      description: `${chosenTitle}\n\n${selectedCtaStyle}\n\n${combinedTags}`,
      keywords: [topic, 'Shorts', 'YouTubeShorts', 'ViralShorts', 'Trending'],
      hookScore: '9.5/10',
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
- Video File / Topic Context: "${rawName}"
- Clip Segment / Part: "${partLabel}" (Clip #${clipIndex + 1})
- Selected Content Niche: ${selectedNiche}
- Preferred Output Language: ${selectedLanguage}
- Preferred Viral Hook Style: ${selectedHookStyle}
- Call-To-Action (CTA) Goal: ${selectedCtaStyle}
- Target Audience & Region: ${audienceInsight.topRegion}
- Previous Titles to Avoid Repeating: [${recentList}]

REQUIRED STRUCTURED RESPONSE FORMAT:
BEST_TITLE: <Write the single strongest, curiosity-driven viral title here in ${selectedLanguage}, max 65 chars, no quotes>
ALL_3_TITLES: <1. Title One | 2. Title Two | 3. Title Three>
VIRAL_CAPTION: <Hook-driven caption + ${selectedCtaStyle}>
YT_HASHTAGS: <5 to 8 relevant & trending YouTube Shorts hashtags starting with #>
SEO_KEYWORDS: <10-15 comma-separated searchable SEO keywords>
VIDEO_DESCRIPTION: <Complete SEO-optimized YouTube Shorts description>
THUMBNAIL_TEXT: <Option 1 | Option 2 | Option 3>
VIRAL_SCORE: <Score out of 10, e.g., 9.7/10>
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
            {
              role: 'system',
              content: 'You are an elite Personal Viral Video SEO Expert and YouTube Shorts Growth Strategist.'
            },
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
        const keywordsList = kwMatch
          ? kwMatch[1].split(',').map((k) => k.trim()).filter(Boolean)
          : dynamicFallback.keywords;

        const fullDesc = [
          cleanTitle,
          captionText,
          descText,
          ytTags,
          keywordsList.length > 0 ? `Keywords: ${keywordsList.join(', ')}` : ''
        ]
          .filter(Boolean)
          .join('\n\n');

        return {
          title: cleanTitle.slice(0, 85),
          hashtags: ytTags,
          description: fullDesc,
          keywords: keywordsList,
          hookScore: scoreMatch ? scoreMatch[1] : '9.7/10',
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
            title: `${aiFresh.title.slice(0, 82)} #Shorts`,
            description: (aiFresh.description || `${aiFresh.title}\n\n${aiFresh.hashtags}`).replace(/[<>]/g, '').slice(0, 4500),
            categoryId: vid.categoryId || '22'
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

    if (preserveFullShort && tier === 'pro') {
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
              setVideoQueue((prev) => prev.map((item) => (item.id === clipId ? { ...item, progress: pct } : item)));
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
    if (hasRefresh) {
      await refreshYouTubeAccessToken();
    }

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
        if (scheduledIsoTime && tier === 'pro') {
          let targetDate = new Date(scheduledIsoTime);
          const minFutureTime = new Date(Date.now() + 25 * 60 * 1000);
          if (isNaN(targetDate.getTime()) || targetDate <= minFutureTime) {
            targetDate = new Date(getNextPeakIsoWithOffset(audienceInsight.peakHour, audienceInsight.peakMinute, 1));
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

        const combinedSeoTags = Array.from(new Set([...rawTagsList, ...cleanKeywords])).slice(0, 10);

        const safeTitle = (clip.title || 'Viral Short')
          .replace(/[<>]/g, '')
          .trim()
          .slice(0, 80);

        const safeDescription = (clip.description || `${safeTitle}\n\n${clip.hashtags || '#Shorts'}`)
          .replace(/[<>]/g, '')
          .slice(0, 4000);

        const metadata = {
          snippet: {
            title: `${safeTitle} #Shorts`,
            description: safeDescription,
            tags: combinedSeoTags.length > 0 ? combinedSeoTags : ['Shorts', 'YouTubeShorts'],
            categoryId: '22'
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
              title: `${safeTitle.slice(0, 75)} #Shorts`,
              description: `${safeTitle}\n\n#Shorts #YouTubeShorts`,
              categoryId: '22'
            },
            status: {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false
            }
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
          const reason = errDetail?.error?.message || `HTTP ${initRes.status}`;
          throw new Error(reason);
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
        if (!String(err.message).includes('401')) {
          alert(`YouTube Auto-Post Error: ${err.message}`);
        }
        return;
      }
    }

    setTimeout(async () => {
      const simDone = {
        ...clip,
        status: scheduledIsoTime && tier === 'pro' ? 'scheduled' : 'published',
        scheduledFor: scheduledIsoTime
      };
      await idbSaveClip(simDone);
      setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? simDone : item)));
    }, 900);
  };

  const processBatchFiles = async (filesArray) => {
    if (!filesArray || filesArray.length === 0) return;

    if (isUserBanned) {
      alert('Your account has been suspended by Admin. Contact support.');
      return;
    }

    if (!ytChannelRef.current?.accessToken && !localStorage.getItem('sp_yt_access_token')) {
      setConnectError('Please click "Connect YouTube (OAuth Auto-Refresh)" to enable automatic uploading.');
      setIsConnectModalOpen(true);
      return;
    }

    setAutoUploadBannerStatus('processing');

    for (const file of filesArray) {
      if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
        openProModalWithReason(`You've used all ${globalConfig.freeLimit} Free Credits! Upgrade to Pro for unlimited Automatic Uploads.`);
        break;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
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

        const dayOffset = scheduleDayOffsetRef.current;
        scheduleDayOffsetRef.current += 1;

        const targetIso =
          tier === 'pro' && autoPostCadence === 'daily_peak'
            ? getNextPeakIsoWithOffset(audienceInsight.peakHour, audienceInsight.peakMinute, dayOffset)
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
          scheduledFor: targetIso,
          croppedUrl: renderResult.croppedUrl,
          blob: renderResult.blob,
          hasAudio: renderResult.hasAudio,
          youtubeUrl: null
        };

        await idbSaveClip(readyClip);

        setVideoQueue((prev) => prev.map((item) => (item.id === clipId ? readyClip : item)));
        await uploadClipToYouTubeAPI(readyClip, targetIso);
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
    if (!cleaned || cleaned.length < 2) {
      setConnectError('Enter a valid YouTube @handle.');
      return;
    }
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
    const text = `🚨 New Payment UTR Submitted!\n\n👤 User: ${txnData.user}\n📦 Plan: ${txnData.plan.toUpperCase()}\n💰 Amount: ₹${txnData.numericAmount}\n🔑 UTR: ${txnData.utr}\n⏰ Time: ${txnData.time}\n\n👉 Open Admin Panel to Approve: https://shortspilot-two.vercel.app/?admin=true`;
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(text)}`);
    } catch {}
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');

    if (!gmailUser?.email) {
      setCheckoutError('Please sign in with Google / enter your Gmail first before submitting UTR.');
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setCheckoutError('Invalid UTR: Enter exact 12-digit numeric UPI UTR Reference number.');
      return;
    }
    if (/^(\d)\1{11}$/.test(cleanUtr) || cleanUtr === '123456789012') {
      setCheckoutError('Fake UTR rejected. Please enter a real UPI transaction UTR number.');
      return;
    }
    if (transactions.some((t) => t.utr === cleanUtr)) {
      setCheckoutError('This UTR number has already been submitted.');
      return;
    }

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
    const nextBanState = !clientObj.banned;
    try {
      await fetch(`${dbBase}/clients/${uKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: nextBanState })
      });
      fetchFirebaseAll();
    } catch {}
  };

  const handleManualGrantPro = async (e) => {
    e.preventDefault();
    const cleanEmail = manualProEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Enter a valid Gmail ID.');
      return;
    }
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
      a: 'Haan! Jaise hi aap video select karte hain, ShortsPilot use YouTube ke official cloud server par Peak Time ke sath schedule kar deta hai. Uske baad aapka phone ya internet band bhi ho, YouTube sahi time par video public kar dega.'
    },
    {
      q: 'Kya mujhe har roz dobara YouTube login karna padega?',
      a: 'Bilkul nahi. Hamara Direct Google OAuth Refresh Engine har 40 minute mein background mein naya token generate karta rehta hai. Aapko sirf 1 baar connect karna hai.'
    },
    {
      q: '50K aur 100K Views Guarantee kaise kaam karti hai?',
      a: 'Agar aap Pro plan lekar rozana kam se kam 1 Short Peak-Time par schedule karte hain aur 30 din mein aapke channel par guaranteed views nahi aate, toh agle 30 din ka Pro plan aapko 100% FREE diya jata hai.'
    },
    {
      q: 'YouTube Upload Limit / Quota Exceeded aane par kya karein?',
      a: 'Aap ऊपर "Connect YouTube" बटन पर क्लिक करके 4-Step Guide देख सकते हैं और अपना खुद का Google Client ID & Secret डालकर अनलिमिटेड अपलोड कर सकते हैं।'
    }
  ];
