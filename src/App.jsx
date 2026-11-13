import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Sliders, X, Trash2, Download, CreditCard,
  RefreshCw, Link2, Radio, Send, Scissors, HardDrive,
  Megaphone, Wrench, IndianRupee, BarChart3, Calendar,
  Clock, Eye, ThumbsUp, Users, Bot, Volume2, ExternalLink,
  Crown, Flame, TrendingUp, Award, Check, Hourglass, Tag,
  FileText, Mail, Globe, Sparkle
} from 'lucide-react';

const DEFAULT_GOOGLE_CLIENT_ID = '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';
const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';

// GitHub Secret Scanning से बचने के लिए इन्हें खाली रखें (Admin Panel ?admin=true से डालें)
const DEFAULT_DEEPSEEK_KEY = '';
const DEFAULT_CLAUDE_KEY = '';

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
      <path
        d="M20 12H36C44.8366 12 52 19.1634 52 28C52 36.8366 44.8366 44 36 44H25L20 54V36"
        stroke="url(#spGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 28H26M26 21L38 28L26 35V21Z"
        stroke="url(#spGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const emailToKey = (email) => (email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

export default function App() {
  const [globalConfig, setGlobalConfig] = useState({
    cashfreeLinkMonthly: '',
    cashfreeLinkYearly: '',
    receiverUpi: '9767905729@paytm',
    monthlyPrice: '499',
    yearlyPrice: '3999',
    couponCode: '', // आप बाद में Admin Panel से डाल सकते हैं (जैसे SAVE200)
    couponDiscount: '200', // ₹ छूट
    freeLimit: 3,
    bannerText: '🚀 ShortsPilot v7.0: 24h AI Peak-Time Auto-Scheduler & 1-to-3 Viral Clipper Live!',
    bannerActive: true,
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    aiProvider: 'deepseek',
    deepseekApiKey: DEFAULT_DEEPSEEK_KEY,
    claudeApiKey: DEFAULT_CLAUDE_KEY,
    supportEmail: 'support@shortspilot.in'
  });
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  const [activeTab, setActiveTab] = useState('studio');
  const [tier, setTier] = useState('free');
  const [activePlanType, setActivePlanType] = useState(''); // 'monthly' | 'yearly'
  const [paymentStatusNote, setPaymentStatusNote] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [clipMode, setClipMode] = useState('1clip');

  // 24h-36h AI Audience & Peak-Time Insight State
  const [audienceInsight, setAudienceInsight] = useState({
    peakHourLabel: '07:30 PM IST (High Evening Engagement)',
    suggestedIso: '',
    topRegion: 'India (IN) • Hindi / Hinglish',
    strategyTip: 'Upload 15–25s high-hook Shorts between 7:00 PM – 9:00 PM for 2.4x faster initial velocity.',
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
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Pricing & Coupon Checkout State
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('monthly'); // 'monthly' | 'yearly'
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');

  // Legal / Info Pages Modal ('about' | 'privacy' | 'terms' | 'refund' | null)
  const [activeInfoPage, setActiveInfoPage] = useState(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [scheduleTimes, setScheduleTimes] = useState({});

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  // Owner Control Center State + Client Directory
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('controls'); // 'controls' | 'clients' | 'payments'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL
  );
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);
  const MASTER_PIN = '9767905729';

  const activeClientId =
    globalConfig.googleClientId || localStorage.getItem('sp_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

  // Compute Default Next Peak Schedule ISO String
  const getNextPeakIso = (hour24 = 19, minute = 30) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour24, minute, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    const pad = (n) => String(n).padStart(2, '0');
    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(
      target.getHours()
    )}:${pad(target.getMinutes())}`;
  };

  useEffect(() => {
    setAudienceInsight((prev) => ({ ...prev, suggestedIso: getNextPeakIso(19, 30) }));
  }, []);

  // Save/Update Client Data in Firebase Owner Directory whenever a user logs in
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

  // Sync Account-Bound Quota & Pro Status
  const syncUserAccountStatus = async (userEmail) => {
    if (!userEmail) {
      setTier('free');
      setActivePlanType('');
      setClipMode('1clip');
      setQuotaUsed(Number(localStorage.getItem('sp_guest_quota') || 0));
      setPaymentStatusNote('');
      return;
    }

    const uKey = emailToKey(userEmail);
    setQuotaUsed(Number(localStorage.getItem(`sp_quota_${uKey}`) || 0));

    if (!dbBase) return;
    try {
      const res = await fetch(`${dbBase}/proUsers/${uKey}.json`);
      const userData = await res.json();
      if (userData && userData.tier === 'pro') {
        setTier('pro');
        setActivePlanType(userData.plan || 'monthly');
        setClipMode('3clips');
        setPaymentStatusNote('');
        registerClientInAdminDb(gmailUser, ytChannel, 'pro');
      } else if (userData && userData.status === 'pending') {
        setTier('free');
        setClipMode('1clip');
        setPaymentStatusNote('pending');
        registerClientInAdminDb(gmailUser, ytChannel, 'free (pending)');
      } else {
        setTier('free');
        setClipMode('1clip');
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

  // Calculate Final Price with Coupon (499 Monthly / 3999 Yearly)
  const getPayableAmount = () => {
    const base =
      selectedBilling === 'yearly'
        ? Number(globalConfig.yearlyPrice || 3999)
        : Number(globalConfig.monthlyPrice || 499);
    if (selectedBilling === 'monthly' && appliedCoupon) {
      const disc = Number(globalConfig.couponDiscount || 0);
      return Math.max(1, base - disc);
    }
    return base;
  };

  const handleApplyCoupon = () => {
    setCouponMsg('');
    const configuredCode = (globalConfig.couponCode || '').trim().toUpperCase();
    const entered = couponInput.trim().toUpperCase();

    if (!configuredCode) {
      setCouponMsg('No active coupon code available right now.');
      setAppliedCoupon(null);
      return;
    }
    if (!entered || entered !== configuredCode) {
      setCouponMsg('Invalid or expired coupon code.');
      setAppliedCoupon(null);
      return;
    }
    if (selectedBilling !== 'monthly') {
      setCouponMsg('Coupon applies to the ₹499 Monthly Plan.');
      return;
    }
    setAppliedCoupon(configuredCode);
    setCouponMsg(`🎉 Coupon "${configuredCode}" applied! ₹${globalConfig.couponDiscount} OFF.`);
  };

  const openProModalWithReason = (reasonText = '') => {
    if (!gmailUser?.email) {
      setConnectError('Please sign in with Google first so your Pro plan saves to your Gmail account.');
      setIsConnectModalOpen(true);
      return;
    }
    setCheckoutError('');
    setCheckoutPendingMsg('');
    setUpgradeReason(reasonText);
    setIsPricingOpen(true);
  };

  // URL Params (?admin=true & ?payment=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') setIsAdminOpen(true);

    if (params.get('payment') === 'success' || params.get('order_status') === 'PAID') {
      const savedUser = JSON.parse(localStorage.getItem('sp_gmail_user') || 'null');
      const planParam = params.get('plan') || 'monthly';
      if (savedUser?.email && dbBase) {
        const uKey = emailToKey(savedUser.email);
        fetch(`${dbBase}/proUsers/${uKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: savedUser.email,
            tier: 'pro',
            plan: planParam,
            status: 'verified',
            method: 'Cashfree',
            updatedAt: new Date().toISOString()
          })
        }).then(() => {
          setTier('pro');
          setClipMode('3clips');
          alert(`🎉 Cashfree Payment Confirmed! ShortsPilot Pro unlocked for ${savedUser.email}.`);
        });
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dbBase]);

  // Fetch Global Config, Transactions & Client Data from Firebase
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
        setGlobalConfig((prev) => ({
          ...prev,
          ...data,
          deepseekApiKey: data.deepseekApiKey || prev.deepseekApiKey,
          claudeApiKey: data.claudeApiKey || prev.claudeApiKey
        }));
      }
      const txnData = await txnRes.json();
      if (txnData && typeof txnData === 'object') {
        setTransactions(
          Object.entries(txnData)
            .map(([key, val]) => ({ firebaseKey: key, ...val }))
            .reverse()
        );
      } else {
        setTransactions([]);
      }
      const cliData = await cliRes.json();
      if (cliData && typeof cliData === 'object') {
        setClientsList(
          Object.entries(cliData)
            .map(([key, val]) => ({ id: key, ...val }))
            .reverse()
        );
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

  // Google OAuth Setup
  useEffect(() => {
    if (!activeClientId) return;

    const initGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId.trim(),
          scope:
            'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              const expiresAt = Date.now() + (Number(tokenResponse.expires_in) || 3500) * 1000;
              let loggedProfile = null;

              try {
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profileData = await profileRes.json();
                if (profileData?.email) {
                  loggedProfile = {
                    email: profileData.email,
                    name: profileData.name || profileData.email.split('@')[0],
                    picture: profileData.picture || ''
                  };
                  setGmailUser(loggedProfile);
                }
              } catch {}

              try {
                const res = await fetch(
                  'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
                  { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );
                const data = await res.json();
                const ch = data?.items?.[0];
                const rawName = ch?.snippet?.customUrl || ch?.snippet?.title || '@ConnectedCreator';
                const chObj = {
                  handle: rawName.startsWith('@') ? rawName : `@${rawName}`,
                  channelId: ch?.id || null,
                  country: ch?.snippet?.country || 'IN',
                  uploadsPlaylistId: ch?.contentDetails?.relatedPlaylists?.uploads || null,
                  accessToken: tokenResponse.access_token,
                  expiresAt,
                  isRealOAuth: true
                };
                setYtChannel(chObj);
                if (loggedProfile) registerClientInAdminDb(loggedProfile, chObj, 'free');
                setIsConnectModalOpen(false);
              } catch {
                const fallbackCh = {
                  handle: '@YouTubeCreator',
                  accessToken: tokenResponse.access_token,
                  expiresAt,
                  isRealOAuth: true
                };
                setYtChannel(fallbackCh);
                if (loggedProfile) registerClientInAdminDb(loggedProfile, fallbackCh, 'free');
                setIsConnectModalOpen(false);
              }
            }
          }
        });
      }
    };

    if (window.google && window.google.accounts) {
      initGoogleAuth();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleAuth;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [activeClientId]);

  const handleDisconnectAll = () => {
    setYtChannel(null);
    setGmailUser(null);
    setTier('free');
    setActivePlanType('');
    setClipMode('1clip');
    setPaymentStatusNote('');
    setYtStats({ subscribers: '—', totalViews: '—', videoCount: '—', country: 'IN', recentVideos: [], loading: false });
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_gmail_user');
    setIsConnectModalOpen(false);
    setIsSettingsOpen(false);
  };

  // 24h-36h YouTube Analytics & Peak Audience Time Analyzer
  const fetchYouTubeAnalytics = async () => {
    if (!ytChannel?.accessToken) return;
    setYtStats((prev) => ({ ...prev, loading: true }));
    setAudienceInsight((prev) => ({ ...prev, isAnalyzing: true }));

    try {
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${ytChannel.accessToken}` } }
      );
      const chData = await chRes.json();
      const item = chData?.items?.[0];
      const stats = item?.statistics || {};
      const countryCode = item?.snippet?.country || 'IN';
      const uploadsId = item?.contentDetails?.relatedPlaylists?.uploads;

      let videosList = [];
      let bestHour = 19;
      let topTitleSample = '';

      if (uploadsId) {
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsId}`,
          { headers: { Authorization: `Bearer ${ytChannel.accessToken}` } }
        );
        const plData = await plRes.json();
        const videoIds = (plData?.items || [])
          .map((v) => v?.snippet?.resourceId?.videoId)
          .filter(Boolean)
          .join(',');

        if (videoIds) {
          const vidRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
            { headers: { Authorization: `Bearer ${ytChannel.accessToken}` } }
          );
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
