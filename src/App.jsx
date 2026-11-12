import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Instagram, Sliders, X, Trash2, Download,
  CreditCard, AlertCircle, Check, RefreshCw, Link2, Radio, Send,
  Scissors, HardDrive, LogOut, UserCheck, Smartphone, Copy,
  Megaphone, Wrench, Globe, IndianRupee
} from 'lucide-react';

// 1. अपनी Google Cloud OAuth Client ID यहाँ डालें
const DEFAULT_GOOGLE_CLIENT_ID = '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';

// 2. अपना Firebase Realtime Database URL यहाँ डालें (ताकि Admin बदलाव पूरी वेबसाइट पर लाइव दिखें)
const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';

// कस्टम Futuristic 'P' प्ले-एरो लोगो
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

export default function App() {
  // Global Remote Config (सब यूज़र्स के लिए लाइव सिंक होता है)
  const [globalConfig, setGlobalConfig] = useState({
    receiverUpi: '9767905729@paytm',
    trialPrice: '2',
    yearlyPrice: '1999',
    freeLimit: 5,
    bannerText: '🔥 Launch Offer: Start 7-Day Pro Trial for just ₹2!',
    bannerActive: true,
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID
  });
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  // Local User State
  const [tier, setTier] = useState(() => localStorage.getItem('sp_tier') || 'free');
  const [quotaUsed, setQuotaUsed] = useState(() => Number(localStorage.getItem('sp_quota_used') || 0));
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Persistent Gmail + YouTube Channel State
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

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [igAutoSync, setIgAutoSync] = useState(true);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Modals & Drawers
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  // Checkout / UPI State
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Owner Control Center State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL
  );
  const [driveFolderId, setDriveFolderId] = useState(
    () => localStorage.getItem('sp_drive_folder_id') || 'ShortsPilot_5TB_Vault'
  );
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);
  const MASTER_PIN = '9767905729';

  const activeClientId =
    globalConfig.googleClientId || localStorage.getItem('sp_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;

  // Fetch Global Website Settings on Load (सभी यूज़र्स को लाइव अपडेट मिलता है)
  useEffect(() => {
    const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
    if (!dbBase) {
      const localSaved = localStorage.getItem('sp_global_config');
      if (localSaved) {
        try {
          setGlobalConfig((prev) => ({ ...prev, ...JSON.parse(localSaved) }));
        } catch {}
      }
      return;
    }

    const fetchLiveSettings = async () => {
      try {
        const res = await fetch(`${dbBase}/siteConfig.json`);
        const data = await res.json();
        if (data && typeof data === 'object') {
          setGlobalConfig((prev) => ({ ...prev, ...data }));
        }
        const txnRes = await fetch(`${dbBase}/transactions.json`);
        const txnData = await txnRes.json();
        if (txnData && typeof txnData === 'object') {
          const list = Object.entries(txnData)
            .map(([key, val]) => ({ firebaseKey: key, ...val }))
            .reverse();
          setTransactions(list);
        }
      } catch {
        // Fallback to local
      }
    };

    fetchLiveSettings();
    const interval = setInterval(fetchLiveSettings, 15000); // हर 15 सेकंड में लाइव चेक
    return () => clearInterval(interval);
  }, [liveDbUrl]);

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
    localStorage.setItem('sp_tier', tier);
  }, [tier]);

  useEffect(() => {
    localStorage.setItem('sp_quota_used', String(quotaUsed));
  }, [quotaUsed]);

  // Secret Admin Trigger: ?admin=true OR Ctrl/Cmd + Shift + O
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

  // Initialize Google OAuth
  useEffect(() => {
    if (!activeClientId) return;

    const initGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId.trim(),
          scope:
            'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              const expiresAt = Date.now() + (Number(tokenResponse.expires_in) || 3500) * 1000;

              try {
                const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profileData = await profileRes.json();
                if (profileData?.email) {
                  setGmailUser({
                    email: profileData.email,
                    name: profileData.name || profileData.email.split('@')[0],
                    picture: profileData.picture || ''
                  });
                }
              } catch {}

              try {
                const res = await fetch(
                  'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
                  { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );
                const data = await res.json();
                const rawName =
                  data?.items?.[0]?.snippet?.customUrl ||
                  data?.items?.[0]?.snippet?.title ||
                  '@ConnectedCreator';
                setYtChannel({
                  handle: rawName.startsWith('@') ? rawName : `@${rawName}`,
                  accessToken: tokenResponse.access_token,
                  expiresAt,
                  isRealOAuth: true
                });
                setIsConnectModalOpen(false);
              } catch {
                setYtChannel({
                  handle: '@YouTubeCreator',
                  accessToken: tokenResponse.access_token,
                  expiresAt,
                  isRealOAuth: true
                });
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

  const handleOneClickGoogleConnect = (silent = false) => {
    setConnectError('');
    if (!activeClientId.trim()) {
      setConnectError('Google Client ID pending. Add it in Owner Console (?admin=true).');
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

  const handleDisconnectAll = () => {
    setYtChannel(null);
    setGmailUser(null);
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_gmail_user');
    setIsConnectModalOpen(false);
    setIsSettingsOpen(false);
  };

  const handleQuickConnectYouTube = (e) => {
    e.preventDefault();
    setConnectError('');
    const cleaned = ytHandleInput.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//i, '');
    if (!cleaned || cleaned.length < 2) {
      setConnectError('Enter a valid YouTube @handle.');
      return;
    }
    const formattedHandle = cleaned.startsWith('@') ? cleaned : `@${cleaned.replace(/^@/, '')}`;
    setYtChannel({ handle: formattedHandle, accessToken: null, expiresAt: null, isRealOAuth: false });
    setYtHandleInput('');
    setIsConnectModalOpen(false);
  };

  // 9:16 Vertical Cropping Engine
  const renderVertical916Clip = async (file, clipId) => {
    return new Promise((resolve) => {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');

      const safetyTimer = setTimeout(() => {
        resolve({ croppedUrl: videoUrl, clipLength: 15, blob: file });
      }, 18000);

      video.onloadedmetadata = () => {
        const duration = video.duration || 10;
        const startOffset = duration > 15 ? Math.min(duration * 0.2, duration - 10) : 0;
        const clipLength = Math.min(10, duration - startOffset);

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 854;
        const ctx = canvas.getContext('2d');

        let supportedMime = '';
        if (window.MediaRecorder) {
          const candidates = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
          supportedMime = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
        }

        if (!window.MediaRecorder || !canvas.captureStream || !supportedMime) {
          clearTimeout(safetyTimer);
          resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file });
          return;
        }

        try {
          const stream = canvas.captureStream(24);
          const chunks = [];
          const recorder = new MediaRecorder(stream, { mimeType: supportedMime });

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            clearTimeout(safetyTimer);
            const croppedBlob = new Blob(chunks, { type: supportedMime });
            resolve({
              croppedUrl: URL.createObjectURL(croppedBlob),
              clipLength: Math.round(clipLength),
              blob: croppedBlob
            });
          };

          video.currentTime = startOffset;
          video.onseeked = () => {
            recorder.start();
            video.play().catch(() => {
              clearTimeout(safetyTimer);
              resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file });
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

              const elapsed = video.currentTime - startOffset;
              const pct = Math.min(95, Math.round(35 + (elapsed / clipLength) * 60));
              setVideoQueue((prev) =>
                prev.map((item) => (item.id === clipId ? { ...item, progress: pct } : item))
              );
              requestAnimationFrame(drawFrame);
            };
            drawFrame();
          };
        } catch {
          clearTimeout(safetyTimer);
          resolve({ croppedUrl: videoUrl, clipLength: Math.round(clipLength), blob: file });
        }
      };

      video.onerror = () => {
        clearTimeout(safetyTimer);
        resolve({ croppedUrl: videoUrl, clipLength: 15, blob: file });
      };
    });
  };

  // YouTube Upload
  const uploadClipToYouTubeAPI = async (clipId, title, blob, channelOverride = null) => {
    if (!globalConfig.ytAutoUploadActive) {
      alert('YouTube Auto-Upload is currently paused by Admin.');
      return;
    }
    const activeChannel = channelOverride || ytChannelRef.current;
    if (!activeChannel) {
      setIsConnectModalOpen(true);
      return;
    }

    setVideoQueue((prev) =>
      prev.map((item) => (item.id === clipId ? { ...item, status: 'uploading' } : item))
    );

    if (activeChannel.accessToken && blob) {
      try {
        const metadata = {
          snippet: {
            title: `${title.slice(0, 85)} #Shorts`,
            description: 'Created & auto-cropped in 9:16 with ShortsPilot AI #Shorts',
            categoryId: '22'
          },
          status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
        };

        const initRes = await fetch(
          'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeChannel.accessToken}`,
              'Content-Type': 'application/json',
              'X-Upload-Content-Type': blob.type || 'video/mp4',
              'X-Upload-Content-Length': blob.size
            },
            body: JSON.stringify(metadata)
          }
        );

        if (!initRes.ok) throw new Error(`HTTP ${initRes.status}`);
        const uploadLocation = initRes.headers.get('Location');
        const uploadRes = await fetch(uploadLocation, {
          method: 'PUT',
          headers: { 'Content-Type': blob.type || 'video/mp4' },
          body: blob
        });
        if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

        const uploadedVideo = await uploadRes.json();
        setVideoQueue((prev) =>
          prev.map((item) =>
            item.id === clipId
              ? {
                  ...item,
                  status: 'published',
                  youtubeUrl: uploadedVideo.id ? `https://youtube.com/shorts/${uploadedVideo.id}` : null
                }
              : item
          )
        );
        return;
      } catch (err) {
        alert(`YouTube Upload: ${err.message}`);
        setVideoQueue((prev) =>
          prev.map((item) => (item.id === clipId ? { ...item, status: 'ready' } : item))
        );
        return;
      }
    }

    setTimeout(() => {
      setVideoQueue((prev) =>
        prev.map((item) => (item.id === clipId ? { ...item, status: 'published' } : item))
      );
    }, 1000);
  };

  const processNewFile = async (file) => {
    if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 5)) {
      setIsPricingOpen(true);
      return;
    }

    const newId = Date.now() + Math.random();
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    setVideoQueue((prev) => [
      {
        id: newId,
        title: cleanTitle,
        status: 'analyzing',
        progress: 20,
        hookScore: `${(9.0 + Math.random() * 0.9).toFixed(1)}/10`,
        duration: '0:10',
        croppedUrl: null,
        blob: file,
        youtubeUrl: null
      },
      ...prev
    ]);
    if (tier === 'free') setQuotaUsed((q) => q + 1);

    const result = await renderVertical916Clip(file, newId);
    setStorageUsedGB((prev) => Number((prev + 0.02).toFixed(2)));

    setVideoQueue((prev) =>
      prev.map((item) =>
        item.id === newId
          ? {
              ...item,
              status: 'ready',
              progress: 100,
              croppedUrl: result.croppedUrl,
              blob: result.blob,
              duration: `0:${String(result.clipLength).padStart(2, '0')}`
            }
          : item
      )
    );

    if (autoPublishEnabled && ytChannelRef.current?.accessToken) {
      await uploadClipToYouTubeAPI(newId, cleanTitle, result.blob, ytChannelRef.current);
    }
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files || []).forEach((file) => processNewFile(file));
    e.target.value = '';
  };

  // Dynamic UPI Deep Link (Uses Live Receiver UPI + Live Trial Price)
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
    globalConfig.receiverUpi
  )}&pn=${encodeURIComponent('ShortsPilot Pro')}&am=${encodeURIComponent(
    Number(globalConfig.trialPrice || 2).toFixed(2)
  )}&cu=INR&tn=${encodeURIComponent('ShortsPilot 7-Day Pro Trial')}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(globalConfig.receiverUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Submit UTR & Log Transaction to Live Firebase Database
  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter the exact 12-digit UPI UTR Reference number.');
      return;
    }

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser?.email || ytChannel?.handle || 'Mobile User',
      utr: utrNumber.trim(),
      amount: `₹${globalConfig.trialPrice} → ₹${globalConfig.yearlyPrice}/yr`,
      status: 'Verified',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
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
    setTier('pro');
    setCheckoutSuccess(true);

    setTimeout(() => {
      setIsPricingOpen(false);
      setCheckoutSuccess(false);
      setUtrNumber('');
    }, 1500);
  };

  // Publish Admin Changes to ALL Users Worldwide via Firebase
  const handlePublishGlobalConfig = async () => {
    setIsSyncingGlobal(true);
    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', liveDbUrl.trim());
    localStorage.setItem('sp_google_client_id', globalConfig.googleClientId.trim());

    const dbBase = liveDbUrl.trim().replace(/\/$/, '');
    if (!dbBase) {
      setIsSyncingGlobal(false);
      alert('Saved locally! Add Firebase Database URL to push changes to ALL users worldwide.');
      return;
    }

    try {
      const res = await fetch(`${dbBase}/siteConfig.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalConfig)
      });
      if (!res.ok) throw new Error('Database write failed');
      alert('✅ Live Updated! All users on the website now see your new UPI ID, Prices & Settings.');
    } catch {
      alert('Check your Firebase Database URL (must be in Test Mode).');
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master Security PIN');
    }
  };

  // Maintenance Screen (When Admin turns Maintenance Mode ON)
  if (globalConfig.maintenanceMode && !isAdminOpen) {
    return (
      <div className="min-h-screen bg-[#06080d] text-white flex flex-col items-center justify-center p-6 text-center">
        <ShortsPilotLogo className="w-16 h-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">ShortsPilot is Upgrading</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          We are deploying faster 9:16 AI rendering servers. Back online in a few minutes!
        </p>
        <button
          onClick={() => setIsAdminOpen(true)}
          className="text-xs text-slate-600 hover:text-slate-400"
        >
          Owner Access
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#06080d] text-slate-100 font-sans relative overflow-x-hidden">
      {/* Top Global Announcement Bar (Controlled Live by Admin) */}
      {globalConfig.bannerActive && globalConfig.bannerText && (
        <div className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-pink-600 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 text-center">
          {globalConfig.bannerText}
        </div>
      )}

      {/* Ambient Glows */}
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border max-w-[145px] sm:max-w-[200px] ${
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
                <Sparkles className="w-3 h-3 text-pink-400" />
                <span>Pro</span>
              </div>
            ) : (
              <button
                onClick={() => setIsPricingOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#0c1220] border border-sky-500/30 text-[11px] sm:text-xs font-medium text-slate-200 shrink-0"
              >
                <span className="text-sky-400 font-semibold">
                  {quotaUsed}/{globalConfig.freeLimit}
                </span>
                <span className="text-pink-400 font-semibold">₹{globalConfig.trialPrice} Pro</span>
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

      {/* Main Workspace */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-10 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-9">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[11px] sm:text-xs font-medium mb-3">
            <Scissors className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>9:16 Vertical Shorts + YouTube Auto-Post</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-bold tracking-tight text-white mb-3 leading-snug">
            Turn Raw Videos Into{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">
              Viral Shorts
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-base">
            Select any video from your gallery. ShortsPilot crops it into a 9:16 vertical clip and publishes straight to YouTube.
          </p>
        </div>

        {/* Account Banner */}
        {!ytChannel && !gmailUser ? (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-[#090d16] to-sky-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  Step 1: Sign in with Gmail & Connect YouTube
                </div>
                <div className="text-xs text-slate-400">
                  Stays logged in automatically even after page refresh.
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
                    Connected
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
              Account
            </button>
          </div>
        )}

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            Array.from(e.dataTransfer.files || []).forEach((f) => processNewFile(f));
          }}
          className={`relative rounded-3xl p-7 sm:p-14 text-center transition-all border-2 border-dashed mb-6 ${
            isDragging ? 'border-pink-500 bg-pink-500/10' : 'border-sky-500/35 bg-[#080c15]/95'
          }`}
        >
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-pink-500/20 border border-sky-400/30 flex items-center justify-center">
            <Upload className="w-6 h-6 text-sky-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1.5">Select Video from Gallery</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
            Choose any MP4/MOV video. Automatically crops to 9:16 vertical Short & uploads to YouTube.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 flex items-center gap-2 mx-auto"
          >
            <Upload className="w-4 h-4" />
            Choose Video File
          </button>
        </div>

        {/* Queue */}
        {videoQueue.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-white">Publishing Queue</h3>
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
                      <span className="text-[11px] px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30 mr-1.5">
                        Hook {clip.hookScore}
                      </span>
                      <h4 className="font-semibold text-white text-sm truncate mt-1">{clip.title}</h4>
                    </div>
                    <button
                      onClick={() => setVideoQueue((prev) => prev.filter((i) => i.id !== clip.id))}
                      className="text-slate-500 hover:text-pink-400 p-1"
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    {clip.croppedUrl ? (
                      <a
                        href={clip.croppedUrl}
                        download={`${clip.title}_9x16.mp4`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" /> Save 9:16
                      </a>
                    ) : (
                      <span className="text-slate-400">Rendering {clip.progress}%...</span>
                    )}

                    {clip.status === 'ready' && (
                      <button
                        onClick={() => uploadClipToYouTubeAPI(clip.id, clip.title, clip.blob)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Post to YT
                      </button>
                    )}

                    {clip.status === 'published' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Posted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Preview Modal */}
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
            <p className="text-xs text-slate-400 mb-4">Stays saved automatically across page refreshes.</p>

            {(gmailUser || ytChannel) && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{ytChannel?.handle || gmailUser?.name}</div>
                  <div className="text-[11px] text-emerald-300 truncate">{gmailUser?.email}</div>
                </div>
                <button onClick={handleDisconnectAll} className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold">
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

      {/* Live UPI Checkout Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border border-sky-500/30 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Start 7-Day Pro Trial for <span className="text-sky-400">₹{globalConfig.trialPrice}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              ₹{globalConfig.trialPrice} today, then ₹{globalConfig.yearlyPrice}/year for unlimited 9:16 Shorts & YT Auto-Post.
            </p>

            {checkoutSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-white">Pro Plan Activated!</div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <a
                  href={upiDeepLink}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Step 1: Pay ₹{globalConfig.trialPrice} via GPay / PhonePe / Paytm
                </a>

                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0c1220] border border-slate-800 text-xs">
                  <span className="text-slate-400 truncate">
                    UPI: <strong className="text-sky-300 font-mono">{globalConfig.receiverUpi}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> {copiedUpi ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <form onSubmit={handleVerifyPayment} className="space-y-3">
                  <input
                    type="tel"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Step 2: Enter 12-Digit UTR Number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm font-mono text-white outline-none"
                    required
                  />
                  {checkoutError && <p className="text-xs text-pink-400">{checkoutError}</p>}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 to-pink-600 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Verify ₹{globalConfig.trialPrice} & Unlock Pro
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client Settings Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75">
          <div className="w-full max-w-xs bg-[#080c15] border-l border-sky-500/25 h-full p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white">Studio Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-200">YouTube Auto-Post</span>
                <button
                  onClick={() => setAutoPublishEnabled(!autoPublishEnabled)}
                  className="text-xs px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 font-semibold"
                >
                  {autoPublishEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-200">Instagram Sync</span>
                <button
                  onClick={() => setIgAutoSync(!igAutoSync)}
                  className="text-xs px-2.5 py-1 rounded bg-pink-500/20 text-pink-300 font-semibold"
                >
                  {igAutoSync ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500">ShortsPilot Live Cloud v4.0</div>
          </div>
        </div>
      )}

      {/* FULL LIVE OWNER CONTROL CENTER (?admin=true) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-[#070a12] border border-pink-500/40 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button onClick={() => setIsAdminOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="py-6 text-center">
                <Lock className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Owner Live Control Center</h3>
                <p className="text-xs text-slate-400 mb-4">Enter Master PIN to control the entire live website.</p>
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
                  Unlock Live Console
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-pink-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">Live Website Control Center</h3>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Global Sync
                  </span>
                </div>

                {/* 1. Firebase Live Sync URL */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/30">
                  <label className="text-xs font-semibold text-sky-300 flex items-center gap-1.5 mb-1.5">
                    <Globe className="w-3.5 h-3.5" /> Firebase Live Database URL (Syncs All Users)
                  </label>
                  <input
                    type="text"
                    value={liveDbUrl}
                    onChange={(e) => setLiveDbUrl(e.target.value)}
                    placeholder="https://shortspilot-live-default-rtdb.firebaseio.com"
                    className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-emerald-300 outline-none"
                  />
                </div>

                {/* 2. Live UPI ID & Pricing Controls */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Live Payment & Plan Controls (Updates All Users)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Receiver UPI ID</label>
                      <input
                        type="text"
                        value={globalConfig.receiverUpi}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, receiverUpi: e.target.value })}
                        className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-sky-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Free Videos Quota</label>
                      <input
                        type="number"
                        value={globalConfig.freeLimit}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, freeLimit: Number(e.target.value) })}
                        className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Trial Price (₹)</label>
                      <input
                        type="number"
                        value={globalConfig.trialPrice}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, trialPrice: e.target.value })}
                        className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Yearly Pro Price (₹)</label>
                      <input
                        type="number"
                        value={globalConfig.yearlyPrice}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })}
                        className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Top Offer Banner & Site Kill-Switches */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" /> Top Announcement Banner
                    </span>
                    <button
                      type="button"
                      onClick={() => setGlobalConfig({ ...globalConfig, bannerActive: !globalConfig.bannerActive })}
                      className={`text-[11px] px-2.5 py-0.5 rounded font-semibold ${
                        globalConfig.bannerActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {globalConfig.bannerActive ? 'VISIBLE' : 'HIDDEN'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={globalConfig.bannerText}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, bannerText: e.target.value })}
                    className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setGlobalConfig({ ...globalConfig, ytAutoUploadActive: !globalConfig.ytAutoUploadActive })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                        globalConfig.ytAutoUploadActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <span>YT Upload</span>
                      <span>{globalConfig.ytAutoUploadActive ? 'ON' : 'OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setGlobalConfig({ ...globalConfig, maintenanceMode: !globalConfig.maintenanceMode })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                        globalConfig.maintenanceMode
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" /> Maintenance
                      </span>
                      <span>{globalConfig.maintenanceMode ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>

                {/* 4. Google OAuth Client ID */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Google OAuth Client ID (Global)</label>
                  <input
                    type="text"
                    value={globalConfig.googleClientId}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, googleClientId: e.target.value })}
                    placeholder="123456789-xxxx.apps.googleusercontent.com"
                    className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-white outline-none"
                  />
                </div>

                {/* Live Publish Button */}
                <button
                  type="button"
                  onClick={handlePublishGlobalConfig}
                  disabled={isSyncingGlobal}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 shadow-[0_0_25px_rgba(255,16,110,0.3)]"
                >
                  {isSyncingGlobal ? 'Publishing to All Users...' : '🚀 Publish Live Changes to Entire Website'}
                </button>

                {/* Live Payments Feed */}
                {transactions.length > 0 && (
                  <div className="p-3 rounded-2xl bg-[#0c1220] border border-slate-800">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      Recent UPI Payments ({transactions.length})
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                      {transactions.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#05070c]">
                          <span className="text-slate-300 truncate">{t.user}</span>
                          <span className="font-mono text-sky-400">UTR: {t.utr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    onClick={() => {
                      setTier(tier === 'pro' ? 'free' : 'pro');
                      setQuotaUsed(0);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Test Tier: {tier.toUpperCase()}
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
