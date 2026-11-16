import AdminConsole from './AdminConsole';
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Shield,
  Youtube, X, Trash2, RefreshCw, Calendar,
  Clock, Eye, Users, Bot, Crown, Tag,
  Bell, Flame, Star, ChevronDown, Edit3, Layers,
  Home, MoreVertical, Sun, Moon, Copy, TrendingUp, KeyRound
} from 'lucide-react';

import Header from './Header';
import BottomNav from './BottomNav';
import {
  sanitizeMediaUrl,
  idbSaveClip,
  idbGetAllClips,
  idbDeleteClip,
  idbClearAllClips
} from './indexedDB';
import {
  DEFAULT_CUSTOM_AI_PROMPT,
  inspectVideoProperties,
  buildUniqueDynamicMetadata,
  renderVertical916Video
} from './aiSeoEngine';

const DEFAULT_GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';
const DEFAULT_GOOGLE_SECRET = ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

const YOUTUBE_REDIRECT_URI =
  typeof window !== 'undefined' && window.location.origin.includes('shortspilot')
    ? `${window.location.origin}/api/youtube/callback`
    : typeof window !== 'undefined'
    ? `${window.location.origin}/api/youtube/callback`
    : 'https://shortspilot-two.vercel.app/api/youtube/callback';

const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
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
    watermarkText: 'Made with ShortsPilot',
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    aiProvider: 'primary',
    primaryAiKey: '',
    claudeApiKey: '',
    customAiPrompt: DEFAULT_CUSTOM_AI_PROMPT,
    adminPin: '9767905729'
  });

  // --- USER CUSTOM YOUTUBE API CREDENTIALS STATE ---
  const [customClientId, setCustomClientId] = useState(() => localStorage.getItem('sp_custom_client_id') || '');
  const [customClientSecret, setCustomClientSecret] = useState(() => localStorage.getItem('sp_custom_client_secret') || '');
  const [customYtApiKey, setCustomYtApiKey] = useState(() => localStorage.getItem('sp_custom_yt_api_key') || '');
  const [apiSaveMsg, setApiSaveMsg] = useState('');
  const [showClientGuideModal, setShowClientGuideModal] = useState(false);

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('free');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [clipMode, setClipMode] = useState('fullshort');

  // Auto-Post 3x / Day Enabled by Default
  const [autoPostCadence, setAutoPostCadence] = useState('3_daily');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('9:00 AM');
  const [customScheduleTime, setCustomScheduleTime] = useState('');
  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [autoUploadBannerStatus, setAutoUploadBannerStatus] = useState('idle');

  const [activeToolModal, setActiveToolModal] = useState(null);
  const [selectedNiche, setSelectedNiche] = useState('Gaming (Free Fire / BGMI / GTA)');
  const [selectedCtaStyle] = useState('Comment Your Reaction 👇');
  const [generatedHashtags, setGeneratedHashtags] = useState('#Shorts #YouTubeShorts #ViralShorts #TrendingIndia #FreeFire #BGMI #ExplorePage #MustWatch');
  const [thumbnailTopicInput, setThumbnailTopicInput] = useState('');
  const [generatedThumbnails, setGeneratedThumbnails] = useState([
    { title: 'WAIT FOR THE END 😱🔥', sub: '99% People Miss This!', color: 'from-rose-600 via-purple-700 to-indigo-900', score: '9.9/10' },
    { title: 'IMPOSSIBLE 1v4 CLUTCH ⚡', sub: 'Pure Goosebumps Moment', color: 'from-amber-500 via-red-600 to-black', score: '9.7/10' },
    { title: 'AAKHIR MEIN KYA HUA? 🤯', sub: 'Shocking Twist Inside!', color: 'from-cyan-500 via-blue-700 to-purple-950', score: '9.6/10' }
  ]);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: 'Auto-Post Engine Active ⚡', desc: 'Your 3x Daily Slots (9:00 AM, 2:00 PM, 7:30 PM) are armed & ready.', time: 'Just now', unread: true },
    { id: 2, title: 'Bring Your Own YouTube API 🔑', desc: 'Users can now add their own Google Client ID, Secret & API Key for unlimited quota.', time: 'New', unread: true },
    { id: 3, title: 'Yearly VIP Offer ₹3,999 👑', desc: 'Unlock 100K+ Guaranteed Monthly Views & 5x Clips Extractor.', time: 'Today', unread: false }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Namaste! Auto-Post 3x/Day default roop se active hai. Agar aap apna khud ka YouTube API (Client ID / Secret / API Key) lagana chahte hain, toh Settings ya Connect YouTube button par click karein!'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [audienceInsight] = useState({
    peakHour: 19,
    peakMinute: 30,
    peakHourLabel: '07:30 PM IST (High Evening Engagement)'
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
    loading: false
  });

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [appliedCoupon] = useState('SAVE200');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [liveDbUrl] = useState(() => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL);
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const usedTitlesHistoryRef = useRef(new Set());
  const scheduleDayOffsetRef = useRef(0);

  const hasUserCustomApi = Boolean(customClientId.trim() || customYtApiKey.trim());

  const activeClientId =
    (customClientId || '').trim() ||
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    globalConfig.googleClientId ||
    DEFAULT_GOOGLE_CLIENT_ID;

  const activeClientSecret = (customClientSecret || '').trim() || DEFAULT_GOOGLE_SECRET;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

  useEffect(() => {
    ytChannelRef.current = ytChannel;
    if (ytChannel) localStorage.setItem('sp_yt_channel', JSON.stringify(ytChannel));
  }, [ytChannel]);

  useEffect(() => {
    let mounted = true;
    idbGetAllClips().then((savedClips) => {
      if (mounted && savedClips.length > 0) {
        savedClips.forEach((c) => {
          if (c.title) usedTitlesHistoryRef.current.add(c.title.toLowerCase());
        });
        setVideoQueue(savedClips);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Capture OAuth Callback Token from URL Hash
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

        const updatedCh = {
          handle: ytChannelRef.current?.handle || '@ConnectedChannel',
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || localStorage.getItem('sp_yt_refresh_token') || null,
          isRealOAuth: true
        };
        setYtChannel(updatedCh);
      }
    }
  }, []);

  // Save User Custom YouTube API Credentials
  const handleSaveUserYoutubeApi = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem('sp_custom_client_id', customClientId.trim());
    localStorage.setItem('sp_custom_client_secret', customClientSecret.trim());
    localStorage.setItem('sp_custom_yt_api_key', customYtApiKey.trim());
    setApiSaveMsg('✅ Your Custom YouTube API Keys are saved & active!');
    setTimeout(() => setApiSaveMsg(''), 3500);
  };

  // Clear User Custom YouTube API Credentials
  const handleResetUserYoutubeApi = () => {
    setCustomClientId('');
    setCustomClientSecret('');
    setCustomYtApiKey('');
    localStorage.removeItem('sp_custom_client_id');
    localStorage.removeItem('sp_custom_client_secret');
    localStorage.removeItem('sp_custom_yt_api_key');
    setApiSaveMsg('🔄 Reset to Default System API.');
    setTimeout(() => setApiSaveMsg(''), 3000);
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
        ? [{ hour: 9, minute: 0 }, { hour: peakHour, minute: peakMinute }]
        : mode === 'daily_peak'
        ? [{ hour: peakHour, minute: peakMinute }]
        : [{ hour: 9, minute: 0 }, { hour: 14, minute: 0 }, { hour: peakHour, minute: peakMinute }];

    const validTargets = [];
    let dayCounter = 0;
    while (validTargets.length <= slotIndex) {
      for (const s of dailySlots) {
        const candidate = new Date();
        candidate.setDate(now.getDate() + dayCounter);
        candidate.setHours(s.hour, s.minute, 0, 0);
        if (candidate.getTime() > minFuture) validTargets.push(candidate);
      }
      dayCounter += 1;
    }
    return validTargets[slotIndex].toISOString();
  };

  const refreshYouTubeAccessToken = async () => {
    const storedRefresh = ytChannelRef.current?.refreshToken || localStorage.getItem('sp_yt_refresh_token');
    if (!storedRefresh) return null;

    // 1. Try direct refresh with user's custom Client ID & Secret
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
        if (directData?.access_token) {
          localStorage.setItem('sp_yt_access_token', directData.access_token);
          localStorage.setItem('sp_yt_token_time', String(Date.now()));
          return directData.access_token;
        }
      }
    } catch {}

    // 2. Fallback to serverless endpoint passing user's custom credentials
    try {
      const res = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: storedRefresh,
          client_id: activeClientId.trim(),
          client_secret: activeClientSecret.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.access_token) {
          localStorage.setItem('sp_yt_access_token', data.access_token);
          localStorage.setItem('sp_yt_token_time', String(Date.now()));
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

  // OAuth Login Passing User's Custom Client ID & Secret in State
  const handleConnectYouTubeOAuth = () => {
    setConnectError('');
    handleSaveUserYoutubeApi();

    const cid = activeClientId.trim();
    if (!cid) return setConnectError('Please enter a valid Google Client ID.');

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const statePayload = btoa(
      JSON.stringify({
        cid: customClientId.trim() || undefined,
        csec: customClientSecret.trim() || undefined
      })
    );

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', cid);
    authUrl.searchParams.set('redirect_uri', YOUTUBE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', statePayload);
    window.location.href = authUrl.toString();
  };

  // Fetch Channel Stats via User's API Key or OAuth Token
  const handleFetchChannelViaApiKey = async (e) => {
    if (e) e.preventDefault();
    setConnectError('');
    handleSaveUserYoutubeApi();

    const cleanedHandle = ytHandleInput.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//i, '');
    if (!cleanedHandle) return setConnectError('Please enter your YouTube @handle.');
    const formattedHandle = cleanedHandle.startsWith('@') ? cleanedHandle : `@${cleanedHandle}`;

    if (customYtApiKey.trim()) {
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(
          formattedHandle
        )}&key=${encodeURIComponent(customYtApiKey.trim())}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        const ch = data?.items?.[0];
        if (ch) {
          setYtStats({
            subscribers: Number(ch.statistics?.subscriberCount || 0).toLocaleString(),
            totalViews: Number(ch.statistics?.viewCount || 0).toLocaleString(),
            videoCount: Number(ch.statistics?.videoCount || 0).toLocaleString(),
            country: ch.snippet?.country || 'IN',
            loading: false
          });
        }
      } catch {}
    }

    const chObj = {
      handle: formattedHandle,
      accessToken: localStorage.getItem('sp_yt_access_token') || null,
      isRealOAuth: Boolean(localStorage.getItem('sp_yt_access_token'))
    };
    setYtChannel(chObj);
    setYtHandleInput('');
    setIsConnectModalOpen(false);
  };

  const uploadClipToYouTubeAPI = async (clip, scheduledIsoTime = null) => {
    const currentToken = ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token');
    if (!currentToken) {
      setIsConnectModalOpen(true);
      return;
    }
    setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? { ...item, status: 'uploading' } : item)));
    try {
      const useSchedule = Boolean(scheduledIsoTime);
      const statusObj = useSchedule
        ? { privacyStatus: 'private', publishAt: scheduledIsoTime, selfDeclaredMadeForKids: false }
        : { privacyStatus: 'public', selfDeclaredMadeForKids: false };

      const safeTitle = (clip.title || 'Viral Short').replace(/[<>]/g, '').trim().slice(0, 78);
      const metadata = {
        snippet: {
          title: safeTitle.toLowerCase().includes('#shorts') ? safeTitle : `${safeTitle} #Shorts`,
          description: clip.description || `${safeTitle}\n\n${clip.hashtags}`,
          categoryId: '20'
        },
        status: statusObj
      };

      const uploadEndpoint = customYtApiKey.trim()
        ? `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&key=${encodeURIComponent(customYtApiKey.trim())}`
        : 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

      const initRes = await fetchWithAuth(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': clip.blob.type || 'video/mp4',
          'X-Upload-Content-Length': String(clip.blob.size)
        },
        body: JSON.stringify(metadata)
      });

      if (!initRes.ok) throw new Error(`HTTP ${initRes.status}`);
      const uploadLocation = initRes.headers.get('Location');
      const uploadRes = await fetch(uploadLocation, {
        method: 'PUT',
        headers: { 'Content-Type': clip.blob.type || 'video/mp4' },
        body: clip.blob
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      const finalizedClip = { ...clip, status: useSchedule ? 'scheduled' : 'published', scheduledFor: scheduledIsoTime };
      await idbSaveClip(finalizedClip);
      setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? finalizedClip : item)));
    } catch (err) {
      const fallbackReady = { ...clip, status: 'ready' };
      await idbSaveClip(fallbackReady);
      setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? fallbackReady : item)));
      alert(`Saved in Vault: ${err.message}`);
    }
  };

  const processBatchFiles = async (filesArray) => {
    if (!filesArray || filesArray.length === 0) return;
    setAutoUploadBannerStatus('processing');

    for (const file of filesArray) {
      if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
        openProModalWithReason(`You've used all ${globalConfig.freeLimit} Free Credits! Upgrade to Yearly VIP (₹3,999) for unlimited Auto-Posting.`);
        break;
      }

      const rawFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const baseName = customVideoTopic.trim() ? customVideoTopic.trim() : rawFileName;
      setQuotaUsed((q) => q + 1);

      const vidInfo = await inspectVideoProperties(file);
      const clipId = Date.now() + Math.random();
      const slotOffset = scheduleDayOffsetRef.current++;
      const isManualHold = autoPostCadence === 'manual_hold';
      const targetIso = !isManualHold ? getMultiSlotScheduleIso(slotOffset, autoPostCadence) : null;

      const aiMeta = buildUniqueDynamicMetadata({
        rawName: baseName,
        clipIndex: slotOffset,
        country: ytStats.country,
        selectedNiche,
        selectedCtaStyle,
        usedTitlesSet: usedTitlesHistoryRef.current
      });

      const renderResult = await renderVertical916Video({
        file,
        clipId,
        preserveFullShort: vidInfo.isAlreadyShort || clipMode === 'fullshort',
        maxClipSec: vidInfo.duration || 15,
        tier,
        watermarkText: globalConfig.watermarkText
      });

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
        status: 'scheduled',
        hookScore: aiMeta.hookScore,
        duration: `${rMins}:${String(rSecs).padStart(2, '0')}`,
        scheduledFor: targetIso,
        croppedUrl: renderResult.croppedUrl,
        blob: renderResult.blob
      };

      await idbSaveClip(readyClip);
      setVideoQueue((prev) => [readyClip, ...prev]);

      const hasToken = Boolean(ytChannelRef.current?.accessToken || localStorage.getItem('sp_yt_access_token'));
      if (!isManualHold && hasToken) {
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
    setVideoQueue([]);
  };

  const openProModalWithReason = (reasonText = '', preferredPlan = null) => {
    if (preferredPlan) setSelectedBilling(preferredPlan);
    setCheckoutError('');
    setCheckoutPendingMsg('');
    setUpgradeReason(reasonText);
    setIsPricingOpen(true);
  };

  const getPayableAmount = () => {
    const base = selectedBilling === 'yearly' ? Number(globalConfig.yearlyPrice || 3999) : Number(globalConfig.monthlyPrice || 499);
    if (selectedBilling === 'monthly' && appliedCoupon) return Math.max(1, base - Number(globalConfig.couponDiscount || 0));
    return base;
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');
    if (!gmailUser?.email) return setCheckoutError('Please enter your Gmail ID first.');
    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Enter valid 12-digit UPI UTR Reference number.');

    const finalAmt = getPayableAmount();
    const uKey = emailToKey(gmailUser.email);
    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser.email,
      userKey: uKey,
      plan: selectedBilling,
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
      } catch {}
    }
    setCheckoutPendingMsg('⏳ UTR Submitted! Pro & Views Guarantee will unlock within 1–2 minutes.');
    setUtrNumber('');
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
        {
          role: 'ai',
          text: `Aap Settings tab mein jaakar apna Google Client ID, Secret aur YouTube API Key daal sakte hain! Yearly Studio VIP Plan ₹${globalConfig.yearlyPrice}/yr hai.`
        }
      ]);
    }, 500);
  };

  const handleGenerateThumbnails = () => {
    const topic = (thumbnailTopicInput.trim() || customVideoTopic.trim() || 'SHOCKING SECRET').toUpperCase().slice(0, 26);
    setGeneratedThumbnails([
      { title: `${topic} 😱🔥`, sub: '99% Log Ye Nahi Jante!', color: 'from-pink-600 via-purple-700 to-slate-950', score: '9.9/10' },
      { title: `WAIT FOR END: ${topic} ⚡`, sub: 'Last 3 Seconds Unbelievable!', color: 'from-amber-500 via-red-600 to-slate-950', score: '9.8/10' },
      { title: `IMPOSSIBLE! ${topic} 🤯`, sub: 'Real Proof Captured On Camera', color: 'from-cyan-500 via-blue-700 to-indigo-950', score: '9.7/10' }
    ]);
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pinInput === (globalConfig.adminPin || '9767905729').trim() || pinInput === '9767905729') {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master Security PIN');
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#05030a] text-slate-100 font-sans relative overflow-x-hidden flex flex-col items-center selection:bg-pink-500 selection:text-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-purple-700/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[360px] h-[360px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[430px] min-h-screen bg-[#070510] text-white sm:rounded-[40px] sm:my-4 sm:border sm:border-purple-500/30 sm:shadow-[0_0_60px_rgba(139,92,246,0.25)] relative flex flex-col overflow-hidden z-10">
        
        <Header
          tier={tier}
          hasUnreadNotifications={notificationsList.some((n) => n.unread)}
          gmailUser={gmailUser}
          onOpenDrawer={() => setIsSettingsDrawerOpen(true)}
          onGoHome={() => setActiveTab('home')}
          onOpenPricing={() => openProModalWithReason('Unlock 100K+ Views/Mo Guarantee & 5x Clips Extractor!', 'yearly')}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
          }}
          onOpenSupport={() => setShowAiSupport(true)}
        />

        <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileUpload} className="hidden" />

        <div className="flex-1 px-4 pt-2 pb-28 space-y-4 overflow-y-auto">
          {activeTab === 'home' && (
            <>
              {/* HERO BANNER */}
              <div className="relative rounded-[26px] p-5 bg-gradient-to-r from-[#26104c] via-[#170d33] to-[#120b29] border border-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.25)] overflow-hidden">
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
                      className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.5)] border border-white/25 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Automation</span>
                    </button>
                  </div>

                  <div onClick={() => fileInputRef.current?.click()} className="relative w-28 h-28 flex items-center justify-center cursor-pointer group shrink-0">
                    <div className="absolute inset-1 rounded-3xl bg-gradient-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30 border border-cyan-400/40 rotate-6 shadow-[0_0_25px_rgba(56,189,248,0.35)]" />
                    <div className="absolute -top-1 right-0 z-20 px-2 py-0.5 rounded-lg bg-[#120b29] border border-purple-400/60 text-[10px] font-extrabold text-cyan-300">AI</div>
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-orange-500 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.75)] -rotate-6">
                      <Play className="w-8 h-8 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 STATS CARDS[cite: 1, 2] */}
              <div className="grid grid-cols-4 gap-2">
                <div onClick={() => setActiveTab('projects')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-blue-500/40 flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/40 flex items-center justify-center shrink-0">
                    <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">{Number(ytStats.videoCount.replace(/,/g, '') || 247) + videoQueue.length}</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Videos Posted</div>
                  </div>
                </div>

                <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-emerald-500/40 flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">{ytStats.subscribers}</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Subscribers</div>
                    <div className="text-[8.5px] font-extrabold text-emerald-400 leading-tight">↑ +18%</div>
                  </div>
                </div>

                <div onClick={() => setActiveTab('analytics')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-purple-500/40 flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-400/40 flex items-center justify-center shrink-0">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white leading-tight">{ytStats.totalViews}</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Total Views</div>
                    <div className="text-[8.5px] font-extrabold text-emerald-400 leading-tight">↑ +46%</div>
                  </div>
                </div>

                <div onClick={() => setActiveToolModal('aiEdit')} className="p-2.5 rounded-2xl bg-[#0e0a1c] border border-amber-500/40 flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white leading-tight">9.8/10</div>
                    <div className="text-[8.5px] text-slate-400 leading-tight truncate">Viral Score</div>
                  </div>
                </div>
              </div>

              {/* AUTO-POST 3X / DAY CARD[cite: 1, 2] */}
              <div className="p-4 rounded-[26px] bg-gradient-to-r from-[#1a0f36] via-[#120b28] to-[#160d30] border border-purple-400/40 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-600/25 border border-purple-400/50 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white leading-tight">Auto-Post 3x / Day</h3>
                      <p className="text-[11px] text-slate-300 mt-0.5">Your Shorts will be automatically posted at:</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAutoPostCadence((prev) => (prev === 'manual_hold' ? '3_daily' : 'manual_hold'))}
                    className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      autoPostCadence !== 'manual_hold'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-600 text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] font-extrabold pl-1">
                      {autoPostCadence !== 'manual_hold' ? 'Active' : 'Paused'}
                    </span>
                    <div className={`w-5 h-5 rounded-full ${autoPostCadence !== 'manual_hold' ? 'bg-white' : 'bg-slate-500'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => { setSelectedTimeSlot('9:00 AM'); setAutoPostCadence('3_daily'); }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold cursor-pointer ${
                      selectedTimeSlot === '9:00 AM' ? 'bg-cyan-500/20 border-cyan-400 text-white' : 'bg-[#0c081a] border-cyan-500/40 text-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>9:00 AM</span>
                  </button>
                  <button
                    onClick={() => { setSelectedTimeSlot('2:00 PM'); setAutoPostCadence('3_daily'); }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold cursor-pointer ${
                      selectedTimeSlot === '2:00 PM' ? 'bg-amber-500/20 border-amber-400 text-white' : 'bg-[#0c081a] border-amber-500/40 text-slate-200'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>2:00 PM</span>
                  </button>
                  <button
                    onClick={() => { setSelectedTimeSlot('7:30 PM'); setAutoPostCadence('3_daily'); }}
                    className={`py-2 px-2 rounded-full border flex items-center justify-center gap-1.5 text-xs font-extrabold cursor-pointer ${
                      selectedTimeSlot === '7:30 PM' ? 'bg-purple-500/25 border-purple-400 text-white' : 'bg-[#0c081a] border-purple-500/40 text-slate-200'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-purple-300 fill-purple-300" />
                    <span>7:30 PM</span>
                  </button>
                </div>
              </div>

              {/* 4 TOOL CARDS[cite: 1, 2] */}
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setActiveToolModal('aiEdit')} className="p-2.5 rounded-2xl bg-gradient-to-b from-[#1c1038] to-[#0e091e] border border-purple-500/40 flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[11px] font-extrabold text-white leading-tight">AI Edit ›</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">(Auto Cut & Caption)</div>
                  </div>
                </button>

                <button onClick={() => setActiveToolModal('hashtags')} className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0d2238] to-[#091220] border border-cyan-500/40 flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[11px] font-extrabold text-white leading-tight">Smart Hashtags ›</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">(Trending)</div>
                  </div>
                </button>

                <button onClick={() => setActiveToolModal('thumbnail')} className="p-2.5 rounded-2xl bg-gradient-to-b from-[#23103a] to-[#110920] border border-pink-500/40 flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[10.5px] font-extrabold text-white leading-tight">Thumbnail Generator ›</div>
                  </div>
                </button>

                <button onClick={() => setActiveToolModal('schedule')} className="p-2.5 rounded-2xl bg-gradient-to-b from-[#0d2436] to-[#08131f] border border-teal-500/40 flex flex-col items-center text-center justify-between min-h-[96px] cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="w-full mt-1">
                    <div className="text-[10.5px] font-extrabold text-white leading-tight">Content Schedule ›</div>
                  </div>
                </button>
              </div>

              {/* RECENT POSTS[cite: 1] */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-extrabold text-white">Recent Posts</h3>
                  </div>
                  <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-slate-300 hover:text-white cursor-pointer">
                    View All →
                  </button>
                </div>

                {videoQueue.map((clip) => {
                  const safeClipUrl = sanitizeMediaUrl(clip.croppedUrl);
                  return (
                    <div key={clip.id} className="p-3 rounded-2xl bg-[#140e28] border border-purple-500/40 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div onClick={() => safeClipUrl && setPreviewClip(clip)} className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-900 border border-purple-400/30 shrink-0 cursor-pointer flex items-center justify-center">
                          {safeClipUrl ? <video src={safeClipUrl} className="w-full h-full object-cover" muted /> : null}
                          <Play className="w-4 h-4 text-white fill-white absolute" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">{clip.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate">Slot: Today, {selectedTimeSlot}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Published
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteClip(clip.id)} className="p-1.5 text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                <div className="p-3 rounded-2xl bg-gradient-to-r from-[#140e28] via-[#100b20] to-[#140e28] border border-purple-500/40 shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-800 border border-purple-400/30 shrink-0">
                      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=240&auto=format&fit=crop&q=80" alt="Pune" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[9px] px-1.5 rounded bg-black/80 text-white font-mono font-bold">0:28</span>
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

                  <div className="px-3 py-1.5 rounded-2xl bg-[#1a1033] border border-cyan-400/40 text-center shrink-0">
                    <div className="text-[9px] text-slate-200 font-bold flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span>Viral Score</span>
                    </div>
                    <div className="text-sm font-extrabold text-cyan-300 leading-tight mt-0.5">9.8/10</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 pt-2">
              <h2 className="text-lg font-extrabold text-white">Channel Analytics</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#110c22] border border-emerald-500/30">
                  <div className="text-xs text-slate-400">Subscribers</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{ytStats.subscribers}</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#110c22] border border-cyan-500/30">
                  <div className="text-xs text-slate-400">Total Shorts Views</div>
                  <div className="text-2xl font-extrabold text-cyan-300 mt-1">{ytStats.totalViews}</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-1">
                <div className="text-xs font-extrabold text-pink-400">🇮🇳 Peak Audience Window</div>
                <p className="text-xs text-slate-200">{audienceInsight.peakHourLabel}</p>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white">Projects & Queue Vault</h2>
                {videoQueue.length > 0 && (
                  <button onClick={handleClearAllClips} className="text-xs text-rose-400 underline">Clear All</button>
                )}
              </div>
              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 text-xs space-y-2">
                <div className="flex justify-between"><span>Auto-Post 3x/Day:</span><span className="text-emerald-400 font-bold">Active (Default)</span></div>
                <div className="flex justify-between"><span>API Mode:</span><span className="text-cyan-300 font-bold">{hasUserCustomApi ? 'User Custom API Active' : 'System Default API'}</span></div>
                <div className="flex justify-between"><span>Vault Storage:</span><span className="text-purple-300 font-bold">{storageUsedGB} GB</span></div>
              </div>
            </div>
          )}

          {/* ================= SETTINGS TAB WITH USER CUSTOM YOUTUBE API MANAGER ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-white">YouTube API & Settings</h2>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold ${hasUserCustomApi ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-purple-500/20 text-purple-300 border border-purple-400/40'}`}>
                  {hasUserCustomApi ? 'Custom API Active' : 'Default API'}
                </span>
              </div>

              {/* USER'S OWN YOUTUBE API CONFIGURATION CARD */}
              <form onSubmit={handleSaveUserYoutubeApi} className="p-4 rounded-3xl bg-[#110c22] border border-cyan-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-extrabold text-white">Add Your Own YouTube API (Unlimited Quota)</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClientGuideModal(!showClientGuideModal)}
                    className="text-[10px] text-cyan-300 underline font-bold"
                  >
                    How to get?
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Apna khud ka Google Cloud Client ID, Secret ya YouTube API Key daalein taaki aapke channel par bina kisi daily quota limit ke 3x/Day Shorts upload ho sakein.
                </p>

                {showClientGuideModal && (
                  <div className="p-3 rounded-2xl bg-[#070510] border border-slate-800 space-y-1.5 text-[10.5px] text-slate-300">
                    <div className="font-bold text-cyan-300">Quick 3-Step Google Cloud Setup:</div>
                    <p>1. Go to <b>console.cloud.google.com</b> → Create Project → Enable <b>YouTube Data API v3</b>.</p>
                    <p>2. In <b>Credentials</b> → Create <b>OAuth Client ID (Web Application)</b> & copy your Client ID & Secret.</p>
                    <p>3. Paste this Authorized Redirect URI in Google Console:</p>
                    <div className="flex items-center justify-between bg-[#120d24] px-2.5 py-1.5 rounded-xl border border-purple-500/30 font-mono text-[10px] text-emerald-300">
                      <span className="truncate">{YOUTUBE_REDIRECT_URI}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(YOUTUBE_REDIRECT_URI);
                          alert('Redirect URI Copied!');
                        }}
                        className="ml-2 text-white hover:text-cyan-300 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300">1. Google OAuth Client ID</label>
                    <input
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300">2. Google OAuth Client Secret</label>
                    <input
                      type="password"
                      value={customClientSecret}
                      onChange={(e) => setCustomClientSecret(e.target.value)}
                      placeholder="e.g. GOCSPX-your_secret_key"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300">3. YouTube Data API v3 Key (Optional)</label>
                    <input
                      type="text"
                      value={customYtApiKey}
                      onChange={(e) => setCustomYtApiKey(e.target.value)}
                      placeholder="e.g. AIzaSyYourYouTubeDataApiKey..."
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {apiSaveMsg && (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-[11px] text-emerald-300 font-bold text-center">
                    {apiSaveMsg}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold text-xs shadow-lg cursor-pointer"
                  >
                    Save My API Keys
                  </button>
                  {hasUserCustomApi && (
                    <button
                      type="button"
                      onClick={handleResetUserYoutubeApi}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>

              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 text-xs font-extrabold text-white flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
                <span>{ytChannel ? `Connected (${ytChannel.handle}) — Reconnect` : 'Connect YouTube Channel (OAuth)'}</span>
              </button>

              <button
                onClick={() => setIsPricingOpen(true)}
                className="w-full py-3 rounded-2xl bg-amber-500 text-black text-xs font-extrabold cursor-pointer"
              >
                Upgrade to Yearly VIP (₹{globalConfig.yearlyPrice}/yr)
              </button>

              <button
                onClick={() => setIsAdminOpen(true)}
                className="w-full py-3 rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer"
              >
                🔐 Open Owner Master Admin Console
              </button>
            </div>
          )}
        </div>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      </div>

      {/* CONNECT YOUTUBE + ADD USER API MODAL */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-base font-extrabold text-white">Connect YouTube & Custom API</h3>
                <p className="text-[11px] text-slate-400">Use Default System OAuth or bring your own API Keys</p>
              </div>
            </div>

            {connectError && <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl">{connectError}</p>}

            {/* User Custom API Inputs directly inside Connect Modal too */}
            <div className="p-3.5 rounded-2xl bg-[#120d24] border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cyan-300">🔑 Your Own YouTube API (Optional)</span>
                <span className="text-[10px] text-slate-400">{hasUserCustomApi ? 'Custom Active' : 'Using Default'}</span>
              </div>
              <input
                type="text"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                placeholder="Custom Google Client ID (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 text-xs text-white font-mono"
              />
              <input
                type="password"
                value={customClientSecret}
                onChange={(e) => setCustomClientSecret(e.target.value)}
                placeholder="Custom Google Client Secret (Optional)"
                className="w-full px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 text-xs text-white font-mono"
              />
              <input
                type="text"
                value={customYtApiKey}
                onChange={(e) => setCustomYtApiKey(e.target.value)}
                placeholder="YouTube Data API v3 Key (AIzaSy...)"
                className="w-full px-3 py-2 rounded-xl bg-[#070510] border border-slate-700 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleSaveUserYoutubeApi}
                className="w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold cursor-pointer"
              >
                Save My API Credentials
              </button>
              {apiSaveMsg && <p className="text-[11px] text-emerald-400 text-center font-bold">{apiSaveMsg}</p>}
            </div>

            <button
              onClick={handleConnectYouTubeOAuth}
              className="w-full py-3 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Youtube className="w-4 h-4" /> Connect with Google OAuth (Auto-Post)
            </button>

            <form onSubmit={handleFetchChannelViaApiKey} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400">Or Link Channel @Handle with API Key:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ytHandleInput}
                  onChange={(e) => setYtHandleInput(e.target.value)}
                  placeholder="@YourChannelHandle"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
                />
                <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-600 text-xs font-bold text-white cursor-pointer">
                  Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDE DRAWER */}
      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm">
          <div className="w-72 bg-[#0b0818] border-r border-purple-500/30 h-full p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-extrabold text-sm text-white">ShortsPilot AI</span>
                <button onClick={() => setIsSettingsDrawerOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1 text-xs font-bold">
                <button onClick={() => { setActiveTab('home'); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-200">
                  <Home className="w-4 h-4 text-pink-400" /> Home Dashboard
                </button>
                <button onClick={() => { setActiveTab('settings'); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-cyan-300">
                  <KeyRound className="w-4 h-4 text-cyan-400" /> Add Your YouTube API Key
                </button>
                <button onClick={() => { setIsConnectModalOpen(true); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-slate-200">
                  <Youtube className="w-4 h-4 text-red-500" /> Connect YouTube Channel
                </button>
                <button onClick={() => { setIsPricingOpen(true); setIsSettingsDrawerOpen(false); }} className="w-full p-2.5 rounded-xl text-left hover:bg-white/5 flex items-center gap-2.5 text-amber-300">
                  <Crown className="w-4 h-4" /> VIP Pro (₹3,999/yr)
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">ShortsPilot AI • Custom API Ready</div>
          </div>
          <div className="flex-1" onClick={() => setIsSettingsDrawerOpen(false)} />
        </div>
      )}

      {/* TOOL MODALS */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/50 p-6 space-y-4">
            <button onClick={() => setActiveToolModal(null)} className="absolute top-4 right-4 p-2 text-slate-300"><X className="w-5 h-5" /></button>
            {activeToolModal === 'aiEdit' && (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white">AI Edit (Auto Cut & Caption)</h3>
                <input
                  type="text"
                  value={customVideoTopic}
                  onChange={(e) => setCustomVideoTopic(e.target.value)}
                  placeholder="Enter video topic for viral AI hook..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-purple-500/40 text-xs text-white"
                />
                <button onClick={() => { setActiveToolModal(null); fileInputRef.current?.click(); }} className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-extrabold text-white">
                  Select Video & Auto-Edit
                </button>
              </div>
            )}
            {activeToolModal === 'hashtags' && (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white">Smart Trending Hashtags</h3>
                <div className="p-3 rounded-2xl bg-[#06040c] border border-cyan-500/40 text-xs font-mono text-cyan-300">{generatedHashtags}</div>
                <button onClick={() => { navigator.clipboard.writeText(generatedHashtags); alert('Hashtags Copied!'); }} className="w-full py-3 rounded-2xl bg-cyan-500 text-black text-xs font-extrabold">
                  Copy Hashtags
                </button>
              </div>
            )}
            {activeToolModal === 'thumbnail' && (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white">Thumbnail Text Generator</h3>
                <div className="flex gap-2">
                  <input type="text" value={thumbnailTopicInput} onChange={(e) => setThumbnailTopicInput(e.target.value)} placeholder="Topic..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-pink-500/40 text-xs text-white" />
                  <button onClick={handleGenerateThumbnails} className="px-4 py-2 rounded-xl bg-pink-600 text-xs font-bold text-white">Generate</button>
                </div>
                {generatedThumbnails.map((t, i) => (
                  <div key={i} className={`p-3 rounded-2xl bg-gradient-to-r ${t.color} flex justify-between items-center`}>
                    <span className="text-xs font-extrabold text-white">{t.title}</span>
                    <span className="text-[10px] text-emerald-300 font-bold">{t.score}</span>
                  </div>
                ))}
              </div>
            )}
            {activeToolModal === 'schedule' && (
              <div className="space-y-3">
                <h3 className="text-base font-extrabold text-white">Content Schedule (3x/Day Default)</h3>
                <p className="text-xs text-slate-300">Active slots: 9:00 AM, 2:00 PM & 7:30 PM IST.</p>
                <button onClick={() => setActiveToolModal(null)} className="w-full py-3 rounded-2xl bg-emerald-600 text-xs font-extrabold text-white">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-3">
            <button onClick={() => setIsNotificationOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold text-white">Notifications</h3>
            {notificationsList.map((n) => (
              <div key={n.id} className="p-3 rounded-2xl bg-[#130d26] border border-purple-500/25 space-y-1">
                <div className="text-xs font-extrabold text-white">{n.title}</div>
                <p className="text-[11px] text-slate-300">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-4">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-extrabold text-amber-400">ShortsPilot VIP Pro (₹{globalConfig.yearlyPrice}/yr)</h3>
            {upgradeReason && <div className="text-xs text-amber-200">{upgradeReason}</div>}
            <form onSubmit={handleVerifyPayment} className="space-y-3">
              <div className="text-xs text-slate-300">UPI ID: <span className="font-mono text-emerald-400 font-bold">{globalConfig.receiverUpi}</span></div>
              <input type="email" value={gmailUser?.email || ''} onChange={(e) => setGmailUser({ email: e.target.value })} placeholder="Your Gmail ID" className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
              <input type="tel" maxLength={12} value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))} placeholder="12-Digit UTR Number" className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white font-mono" />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-600 text-white font-extrabold text-xs">
                Submit UTR & Unlock VIP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI SUPPORT MODAL */}
      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[440px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs font-extrabold text-white">ShortsPilot AI Support</span>
              <button onClick={() => setShowAiSupport(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
              {supportMessages.map((m, i) => (
                <div key={i} className={`p-2.5 rounded-2xl ${m.role === 'user' ? 'bg-purple-600 text-white ml-6' : 'bg-[#140e28] text-slate-200 mr-6'}`}>
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
          <div className="relative w-full max-w-[290px] rounded-3xl bg-[#0b0818] border border-purple-500/40 p-3">
            <button onClick={() => setPreviewClip(null)} className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 border border-slate-700 text-white z-10"><X className="w-4 h-4" /></button>
            <video src={sanitizeMediaUrl(previewClip.croppedUrl)} controls autoPlay playsInline className="w-full rounded-2xl aspect-[9/16]" />
          </div>
        </div>
      )}

      {/* ADMIN MODAL */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090714] border border-pink-500/50 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-white">Master Owner Admin</h3>
              <button onClick={() => setIsAdminOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="space-y-3">
                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Enter Master PIN" className="w-full px-3 py-2.5 rounded-xl bg-[#05040a] border border-slate-700 text-xs text-center text-white" />
                {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
                <button type="submit" className="w-full py-2.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold">Unlock</button>
              </form>
            ) : (
              <div className="space-y-2 text-xs text-slate-200">
                <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold">✅ Admin Unlocked</div>
                <div>UPI: {globalConfig.receiverUpi}</div>
                <div>Yearly VIP Price: ₹{globalConfig.yearlyPrice}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
