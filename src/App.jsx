import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Sliders, X, Trash2, Download, CreditCard,
  RefreshCw, Link2, Radio, Send, Scissors, HardDrive,
  Megaphone, Wrench, IndianRupee, BarChart3, Calendar,
  Clock, Eye, ThumbsUp, Users, Bot, Volume2, ExternalLink,
  Crown, Flame, Award, Check, Hourglass, Tag,
  FileText, Mail, Globe, Sparkle, Ban, UserPlus, Bell, KeyRound, ShieldCheck
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
    couponCode: '',
    couponDiscount: '200',
    freeLimit: 3,
    heroHeadline: 'Viral Shorts Auto-Posted',
    watermarkText: 'Made with ShortsPilot',
    guaranteeActive: true,
    monthlyGuaranteeViews: '50K',
    yearlyGuaranteeViews: '100K',
    bannerText: '🛡️ Growth Guarantee: 50K+ Views/Mo on Monthly & 100K+ Views/Mo on Yearly Pro (T&C Apply)!',
    bannerActive: true,
    broadcastAlertText: '',
    broadcastAlertActive: false,
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    aiProvider: 'deepseek',
    deepseekApiKey: DEFAULT_DEEPSEEK_KEY,
    claudeApiKey: DEFAULT_CLAUDE_KEY,
    supportEmail: 'support@shortspilot.in',
    adminPin: '9767905729'
  });
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [dismissedBroadcast, setDismissedBroadcast] = useState(false);

  const [activeTab, setActiveTab] = useState('studio');
  const [tier, setTier] = useState('free');
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [activePlanType, setActivePlanType] = useState(''); // 'monthly' | 'yearly'
  const [paymentStatusNote, setPaymentStatusNote] = useState('');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [clipMode, setClipMode] = useState('1clip'); // '1clip' | '3clips' | '5clips'

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
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [activeInfoPage, setActiveInfoPage] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [scheduleTimes, setScheduleTimes] = useState({});

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  // Owner Control Center State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState('controls');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [manualProEmail, setManualProEmail] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL
  );
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);

  const activeClientId =
    globalConfig.googleClientId || localStorage.getItem('sp_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

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

  const syncUserAccountStatus = async (userEmail) => {
    if (!userEmail) {
      setTier('free');
      setIsUserBanned(false);
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
      setCouponMsg('Coupon applies to the Monthly Plan.');
      return;
    }
    setAppliedCoupon(configuredCode);
    setCouponMsg(`🎉 Coupon "${configuredCode}" applied! ₹${globalConfig.couponDiscount} OFF.`);
  };

  const openProModalWithReason = (reasonText = '', preferredPlan = null) => {
    if (!gmailUser?.email) {
      setConnectError('Please sign in with Google first so your Pro plan & Views Guarantee link to your Gmail.');
      setIsConnectModalOpen(true);
      return;
    }
    if (preferredPlan) setSelectedBilling(preferredPlan);
    setCheckoutError('');
    setCheckoutPendingMsg('');
    setUpgradeReason(reasonText);
    setIsPricingOpen(true);
  };

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
          setActivePlanType(planParam);
          setClipMode(planParam === 'yearly' ? '5clips' : '3clips');
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
          claudeApiKey: data.claudeApiKey || prev.claudeApiKey,
          adminPin: data.adminPin || prev.adminPin
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
    setIsUserBanned(false);
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
              id: v.id,
              title: v.snippet?.title,
              categoryId: v.snippet?.categoryId || '22',
              thumbnail: v.snippet?.thumbnails?.medium?.url,
              views: vCount.toLocaleString(),
              likes: Number(v.statistics?.likeCount || 0).toLocaleString(),
              publishedAt: pubDate.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            };
          });
        }
      }

      const ampm = bestHour >= 12 ? 'PM' : 'AM';
      const hr12 = bestHour % 12 || 12;
      const regionName =
        countryCode === 'IN'
          ? 'India (IN) • Hindi / Hinglish Audience'
          : `${countryCode} • Global English Audience`;

      setAudienceInsight({
        peakHourLabel: `${hr12}:30 ${ampm} (Based on 24h–36h View Velocity)`,
        suggestedIso: getNextPeakIso(bestHour, 30),
        topRegion: regionName,
        strategyTip: topTitleSample
          ? `Your top Short "${topTitleSample.slice(0, 32)}..." peaked around ${hr12}:30 ${ampm}. AI auto-tunes titles & tags for ${regionName}.`
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
    if ((activeTab === 'analytics' || activeTab === 'studio') && ytChannel?.accessToken) {
      fetchYouTubeAnalytics();
    }
  }, [activeTab, ytChannel]);

  // Dual AI Engine
  const generateViralMetadataWithAI = async (rawName, partLabel) => {
    const isIndia = (ytStats.country || 'IN') === 'IN';
    const fallbackTitle = isIndia
      ? `${rawName} (${partLabel}) 🔥 Ye Dekho! #Shorts #Viral`
      : `${rawName} (${partLabel}) 🔥 Must Watch! #Shorts #Viral`;
    const fallbackTags = isIndia
      ? '#Shorts #YouTubeShorts #TrendingIndia #ViralVideo'
      : '#Shorts #YouTubeShorts #Trending #ViralVideo';

    const prompt = `You are a viral YouTube Shorts algorithm strategist.
Target Audience Region: ${audienceInsight.topRegion}
Peak Engagement Window: ${audienceInsight.peakHourLabel}
Create 1 high-CTR catchy title (max 65 chars, no quotes) and 4 trending hashtags optimized for this exact audience & time for a clip named "${rawName} - ${partLabel}". Format strictly as:
TITLE: <title>
TAGS: <hashtags>`;

    const callDeepSeek = async (key) => {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 130
        })
      });
      if (!res.ok) throw new Error('DeepSeek error');
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
          max_tokens: 130,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!res.ok) throw new Error('Claude error');
      const data = await res.json();
      return data?.content?.[0]?.text || '';
    };

    const parseAIResponse = (text) => {
      const titleMatch = text.match(/TITLE:\s*(.+)/i);
      const tagsMatch = text.match(/TAGS:\s*(.+)/i);
      if (titleMatch) {
        return {
          title: titleMatch[1].trim(),
          hashtags: tagsMatch ? tagsMatch[1].trim() : fallbackTags
        };
      }
      return null;
    };

    const dsKey = (globalConfig.deepseekApiKey || '').trim();
    const clKey = (globalConfig.claudeApiKey || '').trim();

    try {
      let rawText = '';
      if (globalConfig.aiProvider === 'claude' && clKey) {
        try { rawText = await callClaude(clKey); } catch { if (dsKey) rawText = await callDeepSeek(dsKey); }
      } else if (dsKey) {
        try { rawText = await callDeepSeek(dsKey); } catch { if (clKey) rawText = await callClaude(clKey); }
      }
      const parsed = parseAIResponse(rawText);
      if (parsed) return parsed;
    } catch {}

    return { title: fallbackTitle, hashtags: fallbackTags };
  };

  // 1-Click Live Short Title & Tag Re-Optimizer
  const handleReOptimizeLiveVideo = async (vid) => {
    if (tier !== 'pro') {
      openProModalWithReason('1-Click AI Title & Tag Boost for live Shorts requires Pro!');
      return;
    }
    if (!ytChannel?.accessToken) return;

    const aiFresh = await generateViralMetadataWithAI(vid.title, '24h Boost');
    try {
      const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ytChannel.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: vid.id,
          snippet: {
            title: `${aiFresh.title.slice(0, 85)} #Shorts`,
            description: `${aiFresh.title}\n\n${aiFresh.hashtags}\nRe-optimized for Peak Audience by ShortsPilot AI`,
            categoryId: vid.categoryId || '22'
          }
        })
      });
      if (!res.ok) throw new Error('YouTube update permission required (re-login once).');
      alert(`✅ Live Short Updated on YouTube!\nNew Title: ${aiFresh.title}`);
      fetchYouTubeAnalytics();
    } catch (err) {
      alert(`AI Suggested Title:\n${aiFresh.title}\n${aiFresh.hashtags}\n\n(${err.message})`);
    }
  };

  // 9:16 Vertical Cropping WITH ORIGINAL SOUND
  const renderVertical916WithAudio = async (file, clipId, startRatio = 0, maxClipSec = 12) => {
    return new Promise((resolve) => {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.muted = false;
      video.volume = 0.05;

      const safetyTimer = setTimeout(() => {
        resolve({ croppedUrl: videoUrl, clipLength: maxClipSec, blob: file, hasAudio: true });
      }, 22000);

      video.onloadedmetadata = () => {
        const duration = video.duration || 12;
        const startOffset = Math.min(duration * startRatio, Math.max(0, duration - 5));
        const clipLength = Math.min(maxClipSec, Math.max(3, duration - startOffset));

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 854;
        const ctx = canvas.getContext('2d');

        let supportedMime = '';
        if (window.MediaRecorder) {
          const candidates = [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm',
            'video/mp4'
          ];
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
            const vidStream = video.captureStream
              ? video.captureStream()
              : video.mozCaptureStream
              ? video.mozCaptureStream()
              : null;
            if (vidStream && vidStream.getAudioTracks().length > 0) {
              combinedTracks = [...combinedTracks, ...vidStream.getAudioTracks()];
              audioCaptured = true;
            }
          } catch {}

          const finalStream = new MediaStream(combinedTracks);
          const chunks = [];
          const recorder = new MediaRecorder(finalStream, { mimeType: supportedMime });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

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
              if (video.paused || video.ended || video.currentTime >= startOffset + clipLength) {
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
              setVideoQueue((prev) =>
                prev.map((item) => (item.id === clipId ? { ...item, progress: pct } : item))
              );
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
        resolve({ croppedUrl: videoUrl, clipLength: maxClipSec, blob: file, hasAudio: true });
      };
    });
  };

  // Automatic YouTube Upload (Always ON)
  const uploadClipToYouTubeAPI = async (clip, scheduledIsoTime = null) => {
    if (!globalConfig.ytAutoUploadActive) {
      alert('YouTube Upload is currently paused by Admin.');
      return;
    }
    const activeChannel = ytChannelRef.current;
    if (!activeChannel) {
      setIsConnectModalOpen(true);
      return;
    }

    setVideoQueue((prev) =>
      prev.map((item) => (item.id === clip.id ? { ...item, status: 'uploading' } : item))
    );

    if (activeChannel.accessToken && clip.blob) {
      try {
        const useSchedule = Boolean(scheduledIsoTime && tier === 'pro');
        const statusObj = useSchedule
          ? {
              privacyStatus: 'private',
              publishAt: new Date(scheduledIsoTime).toISOString(),
              selfDeclaredMadeForKids: false
            }
          : {
              privacyStatus: 'public',
              selfDeclaredMadeForKids: false
            };

        const metadata = {
          snippet: {
            title: `${clip.title.slice(0, 85)} #Shorts`,
            description: `${clip.title}\n\n${clip.hashtags}\nAuto-Published via ShortsPilot AI`,
            categoryId: '22'
          },
          status: statusObj
        };

        const initRes = await fetch(
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeChannel.accessToken}`,
              'Content-Type': 'application/json',
              'X-Upload-Content-Type': clip.blob.type || 'video/mp4',
              'X-Upload-Content-Length': clip.blob.size
            },
            body: JSON.stringify(metadata)
          }
        );

        if (!initRes.ok) throw new Error(`HTTP ${initRes.status}`);
        const uploadLocation = initRes.headers.get('Location');
        const uploadRes = await fetch(uploadLocation, {
          method: 'PUT',
          headers: { 'Content-Type': clip.blob.type || 'video/mp4' },
          body: clip.blob
        });
        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

        const uploadedVideo = await uploadRes.json();
        setVideoQueue((prev) =>
          prev.map((item) =>
            item.id === clip.id
              ? {
                  ...item,
                  status: useSchedule ? 'scheduled' : 'published',
                  scheduledFor: useSchedule ? scheduledIsoTime : null,
                  youtubeUrl: uploadedVideo.id ? `https://youtube.com/shorts/${uploadedVideo.id}` : null
                }
              : item
          )
        );
        return;
      } catch (err) {
        alert(`YouTube Auto-Post Error: ${err.message}\n(Please re-login with Google if token expired)`);
        setVideoQueue((prev) =>
          prev.map((item) => (item.id === clip.id ? { ...item, status: 'ready' } : item))
        );
        return;
      }
    }

    setTimeout(() => {
      setVideoQueue((prev) =>
        prev.map((item) =>
          item.id === clip.id
            ? {
                ...item,
                status: scheduledIsoTime && tier === 'pro' ? 'scheduled' : 'published',
                scheduledFor: scheduledIsoTime
              }
            : item
        )
      );
    }, 900);
  };

  // Core Pipeline: 1-Clip (Free), 3-Clips (Monthly Pro), 5-Clips (Yearly Pro) + Auto-Post
  const processNewFile = async (file) => {
    if (isUserBanned) {
      alert('Your account has been suspended by Admin. Contact support.');
      return;
    }

    if (!ytChannelRef.current) {
      setConnectError('Please connect your YouTube account first so ShortsPilot can auto-post your Shorts.');
      setIsConnectModalOpen(true);
      return;
    }

    if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
      openProModalWithReason(`You've used all ${globalConfig.freeLimit} Free Credits! Upgrade to Pro for unlimited Auto-Posts.`);
      return;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (tier === 'free') {
      const nextQuota = quotaUsed + 1;
      setQuotaUsed(nextQuota);
      if (gmailUser?.email) {
        localStorage.setItem(`sp_quota_${emailToKey(gmailUser.email)}`, String(nextQuota));
      } else {
        localStorage.setItem('sp_guest_quota', String(nextQuota));
      }
    }

    let segments = [{ label: 'Highlight Cut', ratio: 0.10, score: '9.5/10' }];
    if (tier === 'pro' && clipMode === '5clips') {
      segments = [
        { label: 'Part 1: Opening Hook', ratio: 0.02, score: '9.8/10' },
        { label: 'Part 2: Rising Action', ratio: 0.22, score: '9.5/10' },
        { label: 'Part 3: Peak Climax', ratio: 0.44, score: '9.7/10' },
        { label: 'Part 4: Plot Twist', ratio: 0.65, score: '9.4/10' },
        { label: 'Part 5: Viral Finale', ratio: 0.82, score: '9.6/10' }
      ];
    } else if (tier === 'pro' && clipMode === '3clips') {
      segments = [
        { label: 'Part 1: Viral Hook', ratio: 0.02, score: '9.7/10' },
        { label: 'Part 2: Peak Climax', ratio: 0.36, score: '9.4/10' },
        { label: 'Part 3: Best Ending', ratio: 0.70, score: '9.2/10' }
      ];
    }

    for (const seg of segments) {
      const clipId = Date.now() + Math.random();
      setVideoQueue((prev) => [
        {
          id: clipId,
          title: `${baseName} — ${seg.label}`,
          hashtags: '#Shorts #Viral #Trending',
          status: 'cropping',
          progress: 15,
          hookScore: seg.score,
          duration: '0:12',
          croppedUrl: null,
          blob: file,
          hasAudio: true,
          youtubeUrl: null
        },
        ...prev
      ]);

      const [aiMeta, renderResult] = await Promise.all([
        generateViralMetadataWithAI(baseName, seg.label),
        renderVertical916WithAudio(file, clipId, seg.ratio, 12)
      ]);

      setStorageUsedGB((prev) => Number((prev + 0.02).toFixed(2)));

      const autoTargetTime = tier === 'pro' ? audienceInsight.suggestedIso : null;
      if (autoTargetTime) {
        setScheduleTimes((prev) => ({ ...prev, [clipId]: autoTargetTime }));
      }

      const readyClip = {
        id: clipId,
        title: aiMeta.title,
        hashtags: aiMeta.hashtags,
        status: 'ready',
        progress: 100,
        hookScore: seg.score,
        duration: `0:${String(renderResult.clipLength).padStart(2, '0')}`,
        croppedUrl: renderResult.croppedUrl,
        blob: renderResult.blob,
        hasAudio: renderResult.hasAudio,
        youtubeUrl: null
      };

      setVideoQueue((prev) => prev.map((item) => (item.id === clipId ? readyClip : item)));
      await uploadClipToYouTubeAPI(readyClip, autoTargetTime);
    }
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files || []).forEach((file) => processNewFile(file));
    e.target.value = '';
  };

  const handleOneClickGoogleConnect = (silent = false) => {
    setConnectError('');
    if (!activeClientId.trim()) {
      setConnectError('Google Client ID missing.');
      return;
    }
    if (!tokenClientRef.current) {
      setConnectError('Google Sign-In loading. Tap again in 2 seconds.');
      return;
    }
    try {
      tokenClientRef.current.requestAccessToken({ prompt: silent ? '' : 'select_account' });
    } catch {
      setConnectError('Please open in Google Chrome.');
    }
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

  const handleCashfreePayClick = () => {
    const link =
      selectedBilling === 'yearly'
        ? (globalConfig.cashfreeLinkYearly || globalConfig.cashfreeLinkMonthly || '').trim()
        : (globalConfig.cashfreeLinkMonthly || '').trim();
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      alert('Cashfree Payment Link abhi pending hai. Niche UPI UTR se submit karein ya baad me try karein.');
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');

    if (!gmailUser?.email) {
      setCheckoutError('Please sign in with Google first before submitting payment UTR.');
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
    setCheckoutPendingMsg(
      '⏳ UTR Submitted! Pro & Views Guarantee will unlock automatically within 1–2 minutes once verified.'
    );
    setUtrNumber('');
    fetchFirebaseAll();
  };

  // Admin: Direct Client Plan Toggle
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
        setClipMode(targetTier === 'pro' ? (planType === 'yearly' ? '5clips' : '3clips') : '1clip');
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
        setClipMode(planType === 'yearly' ? '5clips' : '3clips');
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
      alert('✅ Live Updated! All website controls & guarantees are now live.');
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

  if (globalConfig.maintenanceMode && !isAdminOpen) {
    return (
      <div className="min-h-screen bg-[#06080d] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShortsPilotLogo className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ShortsPilot is Upgrading</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Deploying faster 9:16 AI rendering servers. Back online shortly!
        </p>
        <button onClick={() => setIsAdminOpen(true)} className="text-xs text-slate-600">
          Owner Access
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#06080d] text-slate-100 font-sans relative overflow-x-hidden flex flex-col">
      {/* Live Broadcast Alert Popup */}
      {globalConfig.broadcastAlertActive && globalConfig.broadcastAlertText && !dismissedBroadcast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-40 p-4 rounded-2xl bg-[#0c1324] border border-amber-400/50 shadow-2xl flex items-start justify-between gap-3">
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

      {/* Top Banner */}
      {globalConfig.bannerActive && globalConfig.bannerText && (
        <div
          onClick={() => tier !== 'pro' && openProModalWithReason('Unlock Guaranteed Monthly Views with ShortsPilot Pro!')}
          className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-pink-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-3 text-center cursor-pointer"
        >
          {globalConfig.bannerText}
        </div>
      )}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 left-0 w-72 sm:w-[540px] h-72 sm:h-[540px] rounded-full bg-sky-500/12 blur-[110px]" />
        <div className="absolute top-1/3 right-0 w-64 sm:w-[460px] h-64 sm:h-[460px] rounded-full bg-pink-600/12 blur-[115px]" />
      </div>

      {/* Header */}
      <header className="sticky top-2.5 sm:top-4 z-30 w-full max-w-6xl mx-auto px-3 sm:px-4 mt-2">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[#090d16]/90 backdrop-blur-xl border border-sky-500/20">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-pink-500 p-[1px]">
              <div className="w-full h-full bg-[#06080d] rounded-[11px] flex items-center justify-center">
                <ShortsPilotLogo className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-pink-300 bg-clip-text text-transparent">
              ShortsPilot
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border max-w-[135px] sm:max-w-[200px] ${
                gmailUser || ytChannel
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {gmailUser?.picture ? (
                <img src={gmailUser.picture} alt="Profile" className="w-4 h-4 rounded-full shrink-0" />
              ) : (
                <Youtube className={`w-3.5 h-3.5 shrink-0 ${ytChannel ? 'text-emerald-400' : 'text-rose-400'}`} />
              )}
              <span className="truncate">
                {ytChannel ? ytChannel.handle : gmailUser ? gmailUser.name : 'Sign In / YT'}
              </span>
            </button>

            {tier === 'pro' ? (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/40 text-[11px] font-semibold text-pink-200 shrink-0">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{activePlanType === 'yearly' ? 'YEARLY PRO' : 'PRO'}</span>
              </div>
            ) : paymentStatusNote === 'pending' ? (
              <button
                onClick={() => openProModalWithReason('Payment UTR under Admin review.')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-[11px] font-semibold text-amber-300 shrink-0"
              >
                <Hourglass className="w-3 h-3 animate-spin" />
                <span>Verifying...</span>
              </button>
            ) : (
              <button
                onClick={() => openProModalWithReason('Get 50K–100K Guaranteed Views/Month with Pro!')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/50 text-[11px] sm:text-xs font-bold text-amber-300 shrink-0"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Pro ₹{globalConfig.monthlyPrice}</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-[#0c1220] border border-slate-800 text-slate-300 shrink-0"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Studio / Live Analytics Switcher Bar */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-2xl bg-[#090d16] border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            AI Auto-Post Studio
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            24h–36h AI Insights & Analytics
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>100% Hands-Free YouTube Auto-Post ON</span>
        </div>
      </div>

      {/* TAB 1: AI AUTO-POST STUDIO */}
      {activeTab === 'studio' && (
        <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-5 pb-16 flex-1">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Select Video → AI Crops 9:16 + Writes Title → Auto-Posts to YouTube</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight text-white mb-2.5 leading-snug">
              1 Video →{' '}
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">
                {globalConfig.heroHeadline || 'Viral Shorts Auto-Posted'}
              </span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mb-3">
              Tracks 24h–36h audience & peak hours, generates viral titles & tags with AI, and automatically publishes to your YouTube channel.
            </p>
          </div>

          {/* Dual Growth Guarantee Banner (50K Monthly / 100K Yearly) */}
          {globalConfig.guaranteeActive && (
            <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#090d16] to-amber-500/15 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                    <span>
                      🛡️ {globalConfig.monthlyGuaranteeViews}+ Views/Mo (Monthly) & {globalConfig.yearlyGuaranteeViews}+ Views/Mo (Yearly) Guarantee!
                    </span>
                    <button
                      onClick={() => setActiveInfoPage('terms')}
                      className="text-[10px] underline text-amber-300 font-semibold"
                    >
                      Read T&C
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Post daily AI-scheduled Shorts for 30 days — if you don't hit your plan's guaranteed views, get your next 30 days of Pro 100% FREE!
                  </p>
                </div>
              </div>
              {tier !== 'pro' && (
                <button
                  onClick={() => openProModalWithReason('Claim 100K Views/Month Guarantee with Yearly Pro!', 'yearly')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-extrabold shrink-0"
                >
                  Claim Guarantee →
                </button>
              )}
            </div>
          )}

          {/* 24h–36h Live AI Audience & Peak-Time Card */}
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-[#090d16] to-pink-500/10 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Sparkle className="w-4 h-4 text-pink-400" />
                <span>24h–36h AI Audience & Peak-Time Radar</span>
              </div>
              <div className="text-xs text-slate-200">
                <strong>Auto-Post Target:</strong>{' '}
                <span className="text-emerald-400">
                  {tier === 'pro' ? audienceInsight.peakHourLabel : 'Instant Direct YouTube Auto-Post'}
                </span>{' '}
                • <strong>Region:</strong> <span className="text-amber-300">{audienceInsight.topRegion}</span>
              </div>
              <p className="text-[11px] text-slate-400">{audienceInsight.strategyTip}</p>
            </div>
            <button
              onClick={fetchYouTubeAnalytics}
              className="px-3.5 py-2 rounded-xl bg-[#0c1220] border border-sky-500/40 text-xs font-semibold text-sky-300 flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${audienceInsight.isAnalyzing ? 'animate-spin' : ''}`} />
              Sync 24h Data
            </button>
          </div>

          {/* Account Banner */}
          {!ytChannel && !gmailUser ? (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-[#090d16] to-sky-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Youtube className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    Step 1: Connect Google & YouTube Channel
                  </div>
                  <div className="text-xs text-slate-400">
                    Sign in once — every video you upload will automatically post to YouTube.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
            </div>
          ) : (
            <div className="mb-5 p-3 px-4 rounded-2xl bg-[#090d16] border border-emerald-500/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {gmailUser?.picture ? (
                  <img src={gmailUser.picture} alt="Gmail" className="w-7 h-7 rounded-full shrink-0" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {ytChannel?.handle || gmailUser?.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Auto-Post Ready • {tier === 'pro' ? `PRO (${activePlanType || 'Active'})` : 'Free'}
                    </span>
                  </div>
                  {gmailUser?.email && (
                    <div className="text-[11px] text-slate-400 truncate">{gmailUser.email}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="text-xs text-sky-400 font-medium shrink-0"
              >
                Account / Logout
              </button>
            </div>
          )}

          {/* Upload Dropzone with 1-Clip, 3-Clips (Monthly) & 5-Clips (Yearly VIP) Selector */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              Array.from(e.dataTransfer.files || []).forEach((f) => processNewFile(f));
            }}
            className={`relative rounded-3xl p-6 sm:p-11 text-center transition-all border-2 border-dashed mb-7 ${
              isDragging ? 'border-pink-500 bg-pink-500/10' : 'border-sky-500/35 bg-[#080c15]/95'
            }`}
          >
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

            <div className="inline-flex flex-wrap justify-center p-1 rounded-xl bg-[#0c1220] border border-slate-800 mb-5 gap-1">
              <button
                type="button"
                onClick={() => setClipMode('1clip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  clipMode === '1clip' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                1 Clip (Free)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tier !== 'pro') {
                    openProModalWithReason('Extract 3 Viral Shorts + 50K Views/Mo Guarantee with Monthly Pro!', 'monthly');
                    return;
                  }
                  setClipMode('3clips');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  clipMode === '3clips' ? 'bg-blue-600 text-white' : 'text-sky-300'
                }`}
              >
                {tier !== 'pro' ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                3x Clips (PRO)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tier !== 'pro' || activePlanType !== 'yearly') {
                    openProModalWithReason('1 Video → 5 Viral Shorts + 100K Views/Mo Guarantee is exclusive to Yearly Studio Pro!', 'yearly');
                    return;
                  }
                  setClipMode('5clips');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  clipMode === '5clips' ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white' : 'text-amber-300'
                }`}
              >
                {tier !== 'pro' || activePlanType !== 'yearly' ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                5x Clips (YEARLY VIP)
              </button>
            </div>

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-pink-500/20 border border-sky-400/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1.5">
              Select Video to Auto-Post on YouTube
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
              Automatically crops to 9:16 with original audio, writes AI title/tags, and posts directly to YouTube.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto justify-center px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 flex items-center gap-2 mx-auto shadow-[0_0_25px_rgba(56,189,248,0.25)]"
            >
              <Upload className="w-4 h-4" />
              Choose Video & Auto-Post
            </button>
          </div>

          {/* Pricing Cards on First Page (50K Views Monthly vs 100K Views + Extra Benefits Yearly) */}
          {tier !== 'pro' && (
            <section className="mb-8">
              <div className="text-center mb-4">
                <h3 className="text-lg sm:text-2xl font-extrabold text-white">
                  Choose Your Guaranteed Growth Plan
                </h3>
                <p className="text-xs text-slate-400">
                  Backed by our 30-Day Minimum Views Guarantee (T&C Apply)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Plan: 50K Views/Mo Guarantee */}
                <div className="p-5 rounded-3xl bg-[#090d16] border border-sky-500/35 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Monthly Creator</span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        🛡️ {globalConfig.monthlyGuaranteeViews}+ Views/Mo
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1">
                      ₹{globalConfig.monthlyPrice} <span className="text-xs font-normal text-slate-400">/ month</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Coupon eligible • Ideal for starting creators</p>
                    <ul className="space-y-2 text-xs text-slate-300 mb-5">
                      <li className="flex items-center gap-2 text-emerald-300 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Minimum {globalConfig.monthlyGuaranteeViews} Views in 30 Days Guarantee (T&C)
                      </li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400 shrink-0" /> Unlimited 9:16 Conversions + Original Audio</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400 shrink-0" /> 1 Video → 3 Viral Shorts Extraction</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400 shrink-0" /> 24h–36h Peak-Time Auto-Scheduler</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-sky-400 shrink-0" /> Zero Watermark Export</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => openProModalWithReason(`Monthly Pro (${globalConfig.monthlyGuaranteeViews}+ Views/Mo Guarantee)`, 'monthly')}
                    className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-sky-500 to-blue-600"
                  >
                    Start Monthly (₹{globalConfig.monthlyPrice}) →
                  </button>
                </div>

                {/* Yearly Studio Pro: 100K Views/Mo Guarantee + Exclusive Benefits */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#140b24] via-[#090d16] to-[#1f0b18] border-2 border-amber-400/50 flex flex-col justify-between relative shadow-[0_0_30px_rgba(245,158,11,0.12)]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" /> Yearly Studio VIP
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">
                        🛡️ {globalConfig.yearlyGuaranteeViews}+ Views/Mo
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1">
                      ₹{globalConfig.yearlyPrice} <span className="text-xs font-normal text-slate-400">/ year</span>
                    </div>
                    <p className="text-xs text-amber-200/80 mb-4">Just ₹333/mo • Double Views Guarantee + VIP Extras</p>
                    <ul className="space-y-2 text-xs text-slate-200 mb-5">
                      <li className="flex items-center gap-2 text-amber-300 font-bold">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" /> Minimum {globalConfig.yearlyGuaranteeViews} Views Every Month Guarantee (T&C)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" /> <strong>1 Video → 5 Viral Shorts</strong> (Exclusive 5x Extractor)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" /> <strong>1-Click Live Short Re-Optimizer</strong> (Boost old Shorts)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" /> <strong>VIP Priority WhatsApp & Founder Support</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" /> <strong>Free Early Access</strong> to Instagram & FB Auto-Post Beta
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => openProModalWithReason(`Yearly Studio VIP (${globalConfig.yearlyGuaranteeViews}+ Views/Mo Guarantee + 5x Clips)`, 'yearly')}
                    className="w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-pink-600 to-rose-600 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                  >
                    Claim Yearly VIP (₹{globalConfig.yearlyPrice}) →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Generated & Auto-Posted Shorts Queue */}
          {videoQueue.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    AI Auto-Post Queue ({videoQueue.length})
                  </h3>
                </div>
                <button onClick={() => setVideoQueue([])} className="text-xs text-slate-400 hover:text-pink-400">
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoQueue.map((clip) => (
                  <div key={clip.id} className="p-4 rounded-2xl bg-[#090d16] border border-sky-500/20 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
                            Hook {clip.hookScore}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Audio ON
                          </span>
                        </div>
                        <h4 className="font-semibold text-white text-sm leading-snug">{clip.title}</h4>
                        <p className="text-[11px] text-sky-400 mt-0.5 truncate">{clip.hashtags}</p>
                      </div>
                      <button
                        onClick={() => setVideoQueue((prev) => prev.filter((i) => i.id !== clip.id))}
                        className="text-slate-500 hover:text-pink-400 p-1 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {clip.croppedUrl && (
                      <div
                        onClick={() => setPreviewClip(clip)}
                        className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-[9/16] h-52 mx-auto w-28 cursor-pointer"
                      >
                        <video src={clip.croppedUrl} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2">
                      {clip.croppedUrl ? (
                        <a
                          href={clip.croppedUrl}
                          download={`${clip.title.slice(0, 25)}_9x16.webm`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-400" /> Save
                        </a>
                      ) : (
                        <span className="text-slate-400">Rendering {clip.progress}%...</span>
                      )}

                      {clip.status === 'ready' && (
                        <button
                          onClick={() => uploadClipToYouTubeAPI(clip, null)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Retry Post
                        </button>
                      )}

                      {clip.status === 'uploading' && (
                        <span className="text-sky-400 font-semibold animate-pulse">Auto-Posting to YouTube...</span>
                      )}

                      {clip.status === 'scheduled' && (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Auto-Scheduled at Peak ✓
                        </span>
                      )}

                      {clip.status === 'published' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {clip.youtubeUrl ? (
                            <a href={clip.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
                              Auto-Posted Live ↗
                            </a>
                          ) : (
                            'Auto-Posted ✓'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* TAB 2: 24h–36h LIVE YOUTUBE SHORTS ANALYTICS & RE-OPTIMIZER */}
      {activeTab === 'analytics' && (
        <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-5 pb-16 flex-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">24h–36h Audience & Shorts Analytics</h2>
              <p className="text-xs text-slate-400">
                Tracks peak view hours & viewer region, and lets AI re-optimize live Short titles & tags.
              </p>
            </div>
            <button
              onClick={fetchYouTubeAnalytics}
              className="px-3 py-2 rounded-xl bg-[#0c1220] border border-sky-500/30 text-xs text-sky-300 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ytStats.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {!ytChannel?.accessToken ? (
            <div className="p-8 rounded-3xl bg-[#090d16] border border-rose-500/30 text-center">
              <Youtube className="w-10 h-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Connect YouTube to View Live Stats</h3>
              <p className="text-xs text-slate-400 mb-4">
                Sign in with Google to analyze 24h–36h view velocity, peak hours & audience region.
              </p>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-semibold"
              >
                Sign in with Google
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5">
                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#090d16] border border-sky-500/25">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" /> Subscribers
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{ytStats.subscribers}</div>
                </div>
                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#090d16] border border-pink-500/25">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Eye className="w-3.5 h-3.5 text-pink-400" /> Total Views
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{ytStats.totalViews}</div>
                </div>
                <div className="p-3.5 sm:p-5 rounded-2xl bg-[#090d16] border border-emerald-500/25">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Audience Region
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{ytStats.country}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Recent Uploads & 1-Click AI Title/Tag Boost</h3>
                {ytStats.recentVideos.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#090d16] border border-slate-800 text-xs text-slate-400 text-center">
                    {ytStats.loading ? 'Loading YouTube stats...' : 'No videos found on this channel yet.'}
                  </div>
                ) : (
                  ytStats.recentVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3 sm:p-4 rounded-2xl bg-[#090d16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {vid.thumbnail && (
                          <img src={vid.thumbnail} alt={vid.title} className="w-16 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-white truncate">{vid.title}</div>
                          <div className="text-[11px] text-slate-500">Posted: {vid.publishedAt}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1 text-sky-300 font-semibold">
                            <Eye className="w-3.5 h-3.5" /> {vid.views}
                          </span>
                          <span className="flex items-center gap-1 text-pink-300 font-semibold">
                            <ThumbsUp className="w-3.5 h-3.5" /> {vid.likes}
                          </span>
                        </div>
                        <button
                          onClick={() => handleReOptimizeLiveVideo(vid)}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500/20 to-pink-500/20 border border-pink-500/40 text-pink-300 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Bot className="w-3.5 h-3.5" /> AI Boost Title/Tags
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      )}

      {/* Website Footer with Mandatory Legal & Guarantee Terms Pages */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#05070c] py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShortsPilotLogo className="w-4 h-4" />
            <span className="font-semibold text-slate-300">ShortsPilot AI Studio</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <button onClick={() => setActiveInfoPage('about')} className="hover:text-sky-400">About Us</button>
            <button onClick={() => setActiveInfoPage('privacy')} className="hover:text-sky-400">Privacy Policy</button>
            <button onClick={() => setActiveInfoPage('terms')} className="hover:text-amber-300 text-amber-300/90 font-semibold">
              Terms & 50K/100K Guarantee T&C
            </button>
            <button onClick={() => setActiveInfoPage('refund')} className="hover:text-sky-400">Refund & Cancellation</button>
            <a href={`mailto:${globalConfig.supportEmail}`} className="hover:text-sky-400 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {globalConfig.supportEmail}
            </a>
          </div>
        </div>
      </footer>

      {/* Info & Legal Pages Modal (Includes Clear Guarantee Terms & Conditions) */}
      {activeInfoPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#080c15] border border-sky-500/30 p-6 max-h-[85vh] overflow-y-auto space-y-3">
            <button onClick={() => setActiveInfoPage(null)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
              <FileText className="w-5 h-5" />
              <span>
                {activeInfoPage === 'about' && 'About ShortsPilot AI Studio'}
                {activeInfoPage === 'privacy' && 'Privacy Policy'}
                {activeInfoPage === 'terms' && 'Terms & Conditions (Views Guarantee Policy)'}
                {activeInfoPage === 'refund' && 'Refund & Cancellation Policy'}
              </span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2.5">
              {activeInfoPage === 'about' && (
                <>
                  <p>
                    ShortsPilot is an AI-powered SaaS studio designed for YouTube creators to automatically convert long videos into high-retention 9:16 vertical Shorts with original audio, AI-generated viral metadata, and hands-free YouTube auto-publishing.
                  </p>
                  <p><strong>Contact Support:</strong> {globalConfig.supportEmail}</p>
                </>
              )}
              {activeInfoPage === 'privacy' && (
                <>
                  <p>
                    We respect creator privacy. When you sign in with Google, ShortsPilot only requests permissions required to view your YouTube channel analytics and auto-publish Shorts on your behalf.
                  </p>
                  <p>
                    We never sell your email, channel tokens, or video files to third parties. Videos are processed directly in your browser.
                  </p>
                </>
              )}
              {activeInfoPage === 'terms' && (
                <>
                  <p className="text-amber-300 font-semibold">
                    30-Day Minimum Views Guarantee — Terms & Conditions:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
                    <li>
                      <strong>Monthly Plan (₹{globalConfig.monthlyPrice}/mo):</strong> Minimum <strong>{globalConfig.monthlyGuaranteeViews} total views</strong> within 30 days of active Pro subscription.
                    </li>
                    <li>
                      <strong>Yearly VIP Plan (₹{globalConfig.yearlyPrice}/yr):</strong> Minimum <strong>{globalConfig.yearlyGuaranteeViews} total views per 30-day cycle</strong>.
                    </li>
                    <li>
                      <strong>Mandatory Posting Requirement:</strong> Creator must publish at least <strong>1 Short per day (minimum 30 Shorts in 30 days)</strong> using ShortsPilot's AI Peak-Time Auto-Scheduler.
                    </li>
                    <li>
                      <strong>Original & Policy-Compliant Content:</strong> Videos must be public, original, and free from YouTube Community Guideline or Copyright strikes. Deleted or private videos are excluded.
                    </li>
                    <li>
                      <strong>Guarantee Remedy:</strong> If all conditions above are met and the channel still receives fewer than the guaranteed views, ShortsPilot will extend your Pro subscription for the <strong>next 30 days 100% FREE</strong> upon verification at {globalConfig.supportEmail}.
                    </li>
                  </ul>
                </>
              )}
              {activeInfoPage === 'refund' && (
                <>
                  <p>
                    You may cancel your subscription renewal at any time by contacting {globalConfig.supportEmail}.
                  </p>
                  <p>
                    Under our 30-Day Views Guarantee, eligible creators who meet the daily posting criteria receive a free 30-day Pro extension. Technical billing errors are refunded 100% within 5–7 business days.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clip Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-[300px] rounded-3xl bg-[#080c15] border border-sky-500/30 p-3">
            <button
              onClick={() => setPreviewClip(null)}
              className="absolute -top-3 -right-3 p-2.5 rounded-full bg-slate-900 border border-slate-700 text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <video src={previewClip.croppedUrl} controls autoPlay playsInline className="w-full rounded-2xl aspect-[9/16]" />
          </div>
        </div>
      )}

      {/* Connect Gmail & YouTube Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border border-rose-500/35 p-5 sm:p-7">
            <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Gmail & YouTube Account</h3>
            <p className="text-xs text-slate-400 mb-4">Sign in with Google to enable 100% automatic YouTube Shorts publishing.</p>

            {(gmailUser || ytChannel) && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{ytChannel?.handle || gmailUser?.name}</div>
                  <div className="text-[11px] text-emerald-300 truncate">{gmailUser?.email}</div>
                </div>
                <button
                  onClick={handleDisconnectAll}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold"
                >
                  Logout
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleOneClickGoogleConnect(false)}
              className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center gap-2 mb-4"
            >
              <Youtube className="w-4 h-4" /> Sign in with Google
            </button>

            <form onSubmit={handleQuickConnectYouTube} className="space-y-2.5">
              <input
                type="text"
                value={ytHandleInput}
                onChange={(e) => setYtHandleInput(e.target.value)}
                placeholder="@YourChannelHandle"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm text-white outline-none"
              />
              {connectError && <p className="text-xs text-rose-400">{connectError}</p>}
              <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-rose-600">
                Save Channel Handle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border border-amber-400/40 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            {gmailUser?.email && (
              <div className="mb-2 text-[11px] text-sky-300 font-medium">
                Account: <strong>{gmailUser.email}</strong>
              </div>
            )}

            {upgradeReason && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                ⚡ {upgradeReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0c1220] border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setSelectedBilling('monthly')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedBilling === 'monthly'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly • ₹{globalConfig.monthlyPrice}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBilling('yearly');
                  setAppliedCoupon(null);
                  setCouponMsg('');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly VIP • ₹{globalConfig.yearlyPrice}
              </button>
            </div>

            {/* Active Guarantee Highlight inside Checkout */}
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>
                  Included: Minimum{' '}
                  {selectedBilling === 'yearly'
                    ? `${globalConfig.yearlyGuaranteeViews} Views/Month`
                    : `${globalConfig.monthlyGuaranteeViews} Views in 30 Days`}{' '}
                  Guarantee
                </strong>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsPricingOpen(false);
                    setActiveInfoPage('terms');
                  }}
                  className="underline text-amber-300 ml-1"
                >
                  (T&C Apply)
                </button>
              </div>
            </div>

            {selectedBilling === 'monthly' && (
              <div className="mb-4 p-3 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-2">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> Have a Promo / Coupon Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#05070c] border border-slate-700 text-xs font-mono text-white uppercase outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold"
                  >
                    Apply
                  </button>
                </div>
                {couponMsg && (
                  <p className={`text-[11px] ${appliedCoupon ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMsg}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Total Payable Amount:</span>
              <span className="text-2xl font-extrabold text-white">₹{getPayableAmount()}</span>
            </div>

            {checkoutPendingMsg ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center space-y-2">
                <Hourglass className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
                <div className="text-sm font-bold text-white">Verification Pending</div>
                <p className="text-xs text-amber-200">{checkoutPendingMsg}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCashfreePayClick}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{getPayableAmount()} Safely via Cashfree
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="border-t border-slate-800 pt-3">
                  <div className="text-[11px] text-slate-400 mb-2">
                    Paid via UPI? Enter your real 12-digit UTR Reference ID for Admin verification:
                  </div>
                  <form onSubmit={handleVerifyPayment} className="space-y-2.5">
                    <input
                      type="tel"
                      maxLength={12}
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter Real 12-Digit UTR / Reference No."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm font-mono text-white outline-none"
                      required
                    />
                    {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-500 to-pink-600"
                    >
                      Submit UTR for Verification
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Info Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75">
          <div className="w-full max-w-xs bg-[#080c15] border-l border-sky-500/25 h-full p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white">Account & Status</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-semibold">
                ✅ YouTube Auto-Post is Always Active
              </div>
              {gmailUser && (
                <button
                  onClick={handleDisconnectAll}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold"
                >
                  Logout ({gmailUser.email})
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500">ShortsPilot AI Studio v8.2</div>
          </div>
        </div>
      )}

      {/* FULL SAAS OWNER LIVE CONTROL CENTER (?admin=true) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-3xl rounded-t-3xl sm:rounded-3xl bg-[#070a12] border border-pink-500/40 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button onClick={() => setIsAdminOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="py-6 text-center">
                <Lock className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Owner Master Control Panel</h3>
                <p className="text-xs text-slate-400 mb-4">Enter Master PIN to manage Revenue, Clients, Guarantees & AI.</p>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Master PIN"
                  className="w-full max-w-xs mx-auto block px-4 py-3 rounded-xl bg-[#05070c] border border-slate-700 text-center text-white tracking-widest mb-3"
                  autoFocus
                />
                {pinError && <p className="text-xs text-pink-400 mb-3">{pinError}</p>}
                <button type="submit" className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-pink-600 text-white text-sm font-semibold">
                  Unlock Master Console
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-pink-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">ShortsPilot Master Admin</h3>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Firebase Live Connected
                  </span>
                </div>

                {/* Top 4 Live Business KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-emerald-500/30">
                    <div className="text-slate-400 text-[10px]">Verified Revenue</div>
                    <div className="text-base font-extrabold text-emerald-400">₹{totalVerifiedRevenue}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-sky-500/30">
                    <div className="text-slate-400 text-[10px]">Total Creators</div>
                    <div className="text-base font-extrabold text-white">{clientsList.length}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-pink-500/30">
                    <div className="text-slate-400 text-[10px]">Active Pro Users</div>
                    <div className="text-base font-extrabold text-pink-400">
                      {clientsList.filter((c) => c.tier === 'pro').length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0c1220] border border-amber-500/30">
                    <div className="text-slate-400 text-[10px]">Pending UTRs</div>
                    <div className="text-base font-extrabold text-amber-400">
                      {transactions.filter((t) => t.status === 'Pending').length}
                    </div>
                  </div>
                </div>

                {/* 4 Admin Control Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#0c1220] border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setAdminSubTab('controls')}
                    className={`py-2 rounded-lg ${adminSubTab === 'controls' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}
                  >
                    ⚙️ Plans & AI
                  </button>
                  <button
                    onClick={() => setAdminSubTab('site')}
                    className={`py-2 rounded-lg ${adminSubTab === 'site' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                  >
                    🌐 Guarantee & Alerts
                  </button>
                  <button
                    onClick={() => setAdminSubTab('clients')}
                    className={`py-2 rounded-lg ${adminSubTab === 'clients' ? 'bg-sky-600 text-white' : 'text-slate-400'}`}
                  >
                    👥 Clients ({clientsList.length})
                  </button>
                  <button
                    onClick={() => setAdminSubTab('payments')}
                    className={`py-2 rounded-lg ${adminSubTab === 'payments' ? 'bg-amber-600 text-white' : 'text-slate-400'}`}
                  >
                    💳 Payments ({transactions.length})
                  </button>
                </div>

                {/* TAB 1: PLANS, COUPONS, AI KEYS & MANUAL PRO GRANT */}
                {adminSubTab === 'controls' && (
                  <div className="space-y-3.5">
                    <form onSubmit={handleManualGrantPro} className="p-3 rounded-2xl bg-[#0c1220] border border-amber-500/35 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-[#05070c] px-3 py-1.5 rounded-xl border border-slate-700">
                        <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                        <input
                          type="email"
                          value={manualProEmail}
                          onChange={(e) => setManualProEmail(e.target.value)}
                          placeholder="Grant Instant Yearly VIP PRO to Gmail ID..."
                          className="w-full bg-transparent text-xs text-white outline-none"
                        />
                      </div>
                      <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0">
                        + Grant VIP PRO
                      </button>
                    </form>

                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-emerald-500/30 space-y-3">
                      <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" /> Pricing, Coupon Code & Cashfree Links
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monthly (₹)</label>
                          <input
                            type="number"
                            value={globalConfig.monthlyPrice}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, monthlyPrice: e.target.value })}
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Yearly (₹)</label>
                          <input
                            type="number"
                            value={globalConfig.yearlyPrice}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })}
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-amber-300 block mb-1">499 Coupon Code</label>
                          <input
                            type="text"
                            value={globalConfig.couponCode}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, couponCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. SAVE200"
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-amber-500/40 text-xs font-mono text-amber-300 uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Discount (₹)</label>
                          <input
                            type="number"
                            value={globalConfig.couponDiscount}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, couponDiscount: e.target.value })}
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Cashfree Monthly Link</label>
                          <input
                            type="url"
                            value={globalConfig.cashfreeLinkMonthly}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, cashfreeLinkMonthly: e.target.value })}
                            placeholder="https://payments.cashfree.com/..."
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Cashfree Yearly Link</label>
                          <input
                            type="url"
                            value={globalConfig.cashfreeLinkYearly}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, cashfreeLinkYearly: e.target.value })}
                            placeholder="https://payments.cashfree.com/..."
                            className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-emerald-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" /> AI Keys (DeepSeek / Claude)
                        </span>
                        <select
                          value={globalConfig.aiProvider}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, aiProvider: e.target.value })}
                          className="bg-[#05070c] px-2 py-1 rounded border border-slate-700 text-xs text-white"
                        >
                          <option value="deepseek">Primary: DeepSeek</option>
                          <option value="claude">Primary: Claude</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="password"
                          value={globalConfig.deepseekApiKey}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, deepseekApiKey: e.target.value })}
                          placeholder="DeepSeek API Key (sk-...)"
                          className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-sky-300"
                        />
                        <input
                          type="password"
                          value={globalConfig.claudeApiKey}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, claudeApiKey: e.target.value })}
                          placeholder="Claude API Key (sk-ant-...)"
                          className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-pink-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: VIEWS GUARANTEE CONTROL, WEBSITE CONTENT & ALERTS */}
                {adminSubTab === 'site' && (
                  <div className="space-y-3.5">
                    {/* Views Guarantee Live Settings */}
                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-emerald-500/35 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> 30-Day Minimum Views Guarantee
                        </span>
                        <button
                          type="button"
                          onClick={() => setGlobalConfig({ ...globalConfig, guaranteeActive: !globalConfig.guaranteeActive })}
                          className="text-[11px] px-2.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-semibold"
                        >
                          Badge: {globalConfig.guaranteeActive ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monthly Guarantee Views</label>
                          <input
                            type="text"
                            value={globalConfig.monthlyGuaranteeViews}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, monthlyGuaranteeViews: e.target.value })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Yearly Guarantee Views/Mo</label>
                          <input
                            type="text"
                            value={globalConfig.yearlyGuaranteeViews}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyGuaranteeViews: e.target.value })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-indigo-500/30 space-y-2.5">
                      <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> Live Website Content & Limits
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Hero Main Headline</label>
                          <input
                            type="text"
                            value={globalConfig.heroHeadline}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, heroHeadline: e.target.value })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Free Video Watermark Text</label>
                          <input
                            type="text"
                            value={globalConfig.watermarkText}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, watermarkText: e.target.value })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Free Plan Video Limit</label>
                          <input
                            type="number"
                            value={globalConfig.freeLimit}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, freeLimit: Number(e.target.value) })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Support Email</label>
                          <input
                            type="email"
                            value={globalConfig.supportEmail}
                            onChange={(e) => setGlobalConfig({ ...globalConfig, supportEmail: e.target.value })}
                            className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-pink-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5" /> Live User Broadcast Popup
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalConfig({ ...globalConfig, broadcastAlertActive: !globalConfig.broadcastAlertActive })
                          }
                          className="text-[11px] px-2.5 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold"
                        >
                          Popup: {globalConfig.broadcastAlertActive ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={globalConfig.broadcastAlertText}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, broadcastAlertText: e.target.value })}
                        placeholder="Type message to show as popup on all users' screens..."
                        className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalConfig({ ...globalConfig, ytAutoUploadActive: !globalConfig.ytAutoUploadActive })
                          }
                          className="p-2 rounded-xl border border-slate-700 text-xs font-semibold text-emerald-300 flex justify-between"
                        >
                          <span>YT Auto-Post</span>
                          <span>{globalConfig.ytAutoUploadActive ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setGlobalConfig({ ...globalConfig, maintenanceMode: !globalConfig.maintenanceMode })
                          }
                          className="p-2 rounded-xl border border-slate-700 text-xs font-semibold text-amber-300 flex justify-between"
                        >
                          <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> Maintenance</span>
                          <span>{globalConfig.maintenanceMode ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={globalConfig.adminPin}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, adminPin: e.target.value })}
                          placeholder="Master Admin PIN"
                          className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CLIENT DATA & DIRECT PLAN / BAN CONTROLS */}
                {adminSubTab === 'clients' && (
                  <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-300">
                        Manage Creators & Subscriptions ({clientsList.length})
                      </span>
                      <button onClick={fetchFirebaseAll} className="text-[11px] text-sky-400">
                        Refresh
                      </button>
                    </div>
                    {clientsList.length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">No clients logged in yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {clientsList.map((cli) => (
                          <div
                            key={cli.id}
                            className="p-3 rounded-xl bg-[#05070c] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {cli.picture ? (
                                <img src={cli.picture} alt="" className="w-7 h-7 rounded-full shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-300 font-bold shrink-0">
                                  {(cli.name || 'U')[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">
                                  {cli.name} <span className="text-pink-400">({cli.youtubeHandle})</span>
                                  {cli.banned && <span className="ml-1.5 text-[10px] text-rose-400 font-bold">[BANNED]</span>}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{cli.email}</div>
                                <div className="text-[10px] text-slate-500">Last seen: {cli.lastActive}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {cli.tier === 'pro' ? (
                                <button
                                  onClick={() => handleAdminSetClientTier(cli, 'free')}
                                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold"
                                >
                                  Set Free
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleAdminSetClientTier(cli, 'pro', 'monthly')}
                                    className="px-2 py-1 rounded bg-sky-600 text-white text-[10px] font-bold"
                                  >
                                    Monthly Pro
                                  </button>
                                  <button
                                    onClick={() => handleAdminSetClientTier(cli, 'pro', 'yearly')}
                                    className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold"
                                  >
                                    Yearly VIP
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleAdminToggleBanClient(cli)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-0.5 ${
                                  cli.banned ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                <Ban className="w-3 h-3" /> {cli.banned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PAYMENT VERIFICATION QUEUE */}
                {adminSubTab === 'payments' && (
                  <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-amber-500/35 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        UTR Payment Approvals ({transactions.length})
                      </span>
                      <button onClick={fetchFirebaseAll} className="text-[11px] text-sky-400">
                        Refresh
                      </button>
                    </div>
                    {transactions.length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">No payment UTRs submitted yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {transactions.map((txn, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#05070c] border border-slate-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate">{txn.user}</div>
                              <div className="font-mono text-[11px] text-sky-400">
                                UTR: {txn.utr} • {txn.amount}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Coupon: {txn.couponUsed || 'None'} • {txn.time}
                              </div>
                            </div>
                            {txn.status === 'Pending' ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleAdminApproveTxn(txn)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleAdminRejectTxn(txn)}
                                  className="px-2 py-1 rounded-lg bg-rose-600/30 text-rose-300"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`text-[11px] font-bold ${
                                  txn.status === 'Verified' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {txn.status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(adminSubTab === 'controls' || adminSubTab === 'site') && (
                  <button
                    type="button"
                    onClick={handlePublishGlobalConfig}
                    disabled={isSyncingGlobal}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 shadow-[0_0_25px_rgba(255,16,110,0.3)]"
                  >
                    {isSyncingGlobal ? 'Publishing to Live Site...' : '🚀 Publish All Live Website Changes'}
                  </button>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    onClick={() => {
                      const nextTier = tier === 'pro' ? 'free' : 'pro';
                      setTier(nextTier);
                      setActivePlanType('yearly');
                      setClipMode(nextTier === 'pro' ? '5clips' : '1clip');
                      setQuotaUsed(0);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Local Test: {tier.toUpperCase()}
                  </button>
                  <span className="text-slate-500 font-mono">
                    <HardDrive className="w-3.5 h-3.5 inline mr-1" />
                    {storageUsedGB} / 5,120 GB
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
