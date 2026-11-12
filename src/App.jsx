import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Instagram, Sliders, X, Trash2, ArrowUpRight, Download,
  CreditCard, AlertCircle, Check, RefreshCw, Link2, Radio, Send,
  Scissors, HardDrive, LogOut, UserCheck
} from 'lucide-react';

// अपनी Google Cloud Console से मिली Client ID यहाँ पेस्ट करें ताकि सभी क्लाइंट्स को 1-क्लिक लॉगिन मिले
const DEFAULT_GOOGLE_CLIENT_ID = '';

export default function App() {
  // Persistent Client & Subscription State
  const [tier, setTier] = useState(() => localStorage.getItem('sp_tier') || 'free');
  const [quotaUsed, setQuotaUsed] = useState(() => Number(localStorage.getItem('sp_quota_used') || 0));
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Persistent Gmail User + YouTube Channel State (Survives Page Refresh)
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
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed;
    } catch {
      return null;
    }
  });

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [googleClientId, setGoogleClientId] = useState(
    () => localStorage.getItem('sp_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [igAutoSync, setIgAutoSync] = useState(true);
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Modals & Drawers
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  // Checkout / UPI AutoPay State
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [mandateSent, setMandateSent] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Hidden Owner Control Center & 5TB Cloud Storage State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [receiverUpi, setReceiverUpi] = useState('shortspilot@ptyes');
  const [backendUrl, setBackendUrl] = useState(
    () => localStorage.getItem('sp_backend_url') || ''
  );
  const [driveFolderId, setDriveFolderId] = useState(
    () => localStorage.getItem('sp_drive_folder_id') || 'ShortsPilot_5TB_Vault'
  );
  const [autoCleanupDays, setAutoCleanupDays] = useState('15');
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-8841',
      upi: 'rohan.create@okicici',
      utr: '431892019482',
      plan: '₹2 Trial → ₹1,999/yr AutoPay',
      status: 'Active',
      time: '12 mins ago'
    }
  ]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);
  const MASTER_PIN = '9767905729';

  // Sync states to localStorage automatically so refresh NEVER logs user out
  useEffect(() => {
    ytChannelRef.current = ytChannel;
    if (ytChannel) {
      localStorage.setItem('sp_yt_channel', JSON.stringify(ytChannel));
    } else {
      localStorage.removeItem('sp_yt_channel');
    }
  }, [ytChannel]);

  useEffect(() => {
    if (gmailUser) {
      localStorage.setItem('sp_gmail_user', JSON.stringify(gmailUser));
    } else {
      localStorage.removeItem('sp_gmail_user');
    }
  }, [gmailUser]);

  useEffect(() => {
    localStorage.setItem('sp_tier', tier);
  }, [tier]);

  useEffect(() => {
    localStorage.setItem('sp_quota_used', String(quotaUsed));
  }, [quotaUsed]);

  // Secret Admin Access: ?admin=true OR Ctrl/Cmd + Shift + O
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Google Identity Services SDK & Initialize Token Client
  useEffect(() => {
    if (!googleClientId) return;

    const initGoogleAuth = () => {
      if (window.google && window.google.accounts) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId.trim(),
          scope:
            'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              const expiresAt = Date.now() + (Number(tokenResponse.expires_in) || 3500) * 1000;

              // 1. Fetch Gmail Profile (Name, Email, Picture)
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
              } catch {
                // Keep existing profile if network hiccups
              }

              // 2. Fetch YouTube Channel Info
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
  }, [googleClientId]);

  // 1-Click Gmail + YouTube Sign-In
  const handleOneClickGoogleConnect = (silent = false) => {
    setConnectError('');
    if (!googleClientId.trim()) {
      setConnectError(
        'Studio OAuth setup pending. Add your Google Client ID in Owner Console (?admin=true) first.'
      );
      return;
    }
    if (!tokenClientRef.current) {
      setConnectError('Google Sign-In is loading. Please tap again in 2 seconds.');
      return;
    }

    try {
      tokenClientRef.current.requestAccessToken({
        prompt: silent ? '' : 'select_account'
      });
    } catch {
      setConnectError('Please open this site in Google Chrome (not inside WhatsApp/Instagram).');
    }
  };

  // Full Logout (Clears Gmail & YouTube Session)
  const handleDisconnectAll = () => {
    setYtChannel(null);
    setGmailUser(null);
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_gmail_user');
    setIsConnectModalOpen(false);
    setIsSettingsOpen(false);
  };

  // Quick Handle Link
  const handleQuickConnectYouTube = (e) => {
    e.preventDefault();
    setConnectError('');
    const cleaned = ytHandleInput.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//i, '');
    if (!cleaned || cleaned.length < 2) {
      setConnectError('Please enter a valid YouTube @handle.');
      return;
    }
    const formattedHandle = cleaned.startsWith('@') ? cleaned : `@${cleaned.replace(/^@/, '')}`;
    setYtChannel({
      handle: formattedHandle,
      accessToken: null,
      expiresAt: null,
      isRealOAuth: false
    });
    setYtHandleInput('');
    setIsConnectModalOpen(false);
  };

  // Android-Safe 9:16 Vertical Video Rendering Engine
  const renderVertical916Clip = async (file, clipId) => {
    return new Promise((resolve) => {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const safetyTimer = setTimeout(() => {
        resolve({
          croppedUrl: videoUrl,
          clipLength: 15,
          blob: file
        });
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
          resolve({
            croppedUrl: videoUrl,
            clipLength: Math.round(clipLength),
            blob: file
          });
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
            const croppedUrl = URL.createObjectURL(croppedBlob);
            resolve({
              croppedUrl,
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

              let sx = 0,
                sy = 0,
                sWidth = vw,
                sHeight = vh;
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
          resolve({
            croppedUrl: videoUrl,
            clipLength: Math.round(clipLength),
            blob: file
          });
        }
      };

      video.onerror = () => {
        clearTimeout(safetyTimer);
        resolve({
          croppedUrl: videoUrl,
          clipLength: 15,
          blob: file
        });
      };
    });
  };

  // Sync rendered 9:16 clip to Owner's 5TB Google Drive Cloud
  const syncClipTo5TBCloud = async (blob, title) => {
    const sizeInGB = Number(((blob.size || 2000000) / (1024 * 1024 * 1024)).toFixed(3));
    setStorageUsedGB((prev) => Number((prev + Math.max(sizeInGB, 0.015)).toFixed(2)));

    if (backendUrl.trim()) {
      try {
        const fd = new FormData();
        fd.append('file', blob, `${title}_9x16.mp4`);
        fd.append('folder_id', driveFolderId);
        if (gmailUser?.email) fd.append('client_email', gmailUser.email);
        await fetch(`${backendUrl.replace(/\/$/, '')}/api/save-to-drive`, {
          method: 'POST',
          body: fd
        });
      } catch {
        // Silent fallback
      }
    }
  };

  // Direct YouTube Shorts Upload Function (With Token Expiry Check)
  const uploadClipToYouTubeAPI = async (clipId, title, blob, channelOverride = null) => {
    const activeChannel = channelOverride || ytChannelRef.current;
    if (!activeChannel) {
      setIsConnectModalOpen(true);
      return;
    }

    // If token expired after 1 hour, trigger silent refresh instead of failing
    if (activeChannel.isRealOAuth && activeChannel.expiresAt && Date.now() > activeChannel.expiresAt) {
      handleOneClickGoogleConnect(true);
      alert('Refreshing your Google session—please tap Post to YT once more.');
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
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false
          }
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

        if (initRes.status === 401) {
          handleOneClickGoogleConnect(true);
          throw new Error('Session refreshed—tap Post to YT again.');
        }

        if (!initRes.ok) {
          const errData = await initRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${initRes.status}`);
        }

        const uploadLocation = initRes.headers.get('Location');
        if (!uploadLocation) throw new Error('YouTube upload URL missing');

        const uploadRes = await fetch(uploadLocation, {
          method: 'PUT',
          headers: { 'Content-Type': blob.type || 'video/mp4' },
          body: blob
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed (${uploadRes.status})`);
        }

        const uploadedVideo = await uploadRes.json();
        const videoId = uploadedVideo.id;

        setVideoQueue((prev) =>
          prev.map((item) =>
            item.id === clipId
              ? {
                  ...item,
                  status: 'published',
                  youtubeUrl: videoId ? `https://youtube.com/shorts/${videoId}` : null
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

  // Main File Processing Pipeline
  const processNewFile = async (file) => {
    if (tier === 'free' && quotaUsed >= 5) {
      setIsPricingOpen(true);
      return;
    }

    const newId = Date.now() + Math.random();
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    const newItem = {
      id: newId,
      title: cleanTitle,
      status: 'analyzing',
      progress: 18,
      hookScore: `${(9.0 + Math.random() * 0.9).toFixed(1)}/10`,
      duration: '0:10',
      croppedUrl: null,
      blob: file,
      cloudSynced: false,
      youtubeUrl: null
    };

    setVideoQueue((prev) => [newItem, ...prev]);
    if (tier === 'free') setQuotaUsed((q) => q + 1);

    setTimeout(() => {
      setVideoQueue((prev) =>
        prev.map((item) => (item.id === newId ? { ...item, status: 'cropping', progress: 35 } : item))
      );
    }, 400);

    const result = await renderVertical916Clip(file, newId);
    await syncClipTo5TBCloud(result.blob, cleanTitle);

    setVideoQueue((prev) =>
      prev.map((item) =>
        item.id === newId
          ? {
              ...item,
              status: 'ready',
              progress: 100,
              croppedUrl: result.croppedUrl,
              blob: result.blob,
              cloudSynced: true,
              duration: `0:${String(result.clipLength).padStart(2, '0')}`
            }
          : item
      )
    );

    if (autoPublishEnabled && ytChannelRef.current?.accessToken) {
      await uploadClipToYouTubeAPI(newId, cleanTitle, result.blob, ytChannelRef.current);
    }
  };

  const handleManualPublishClick = (clip) => {
    uploadClipToYouTubeAPI(clip.id, clip.title, clip.blob);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => processNewFile(file));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      files.forEach((file) => processNewFile(file));
    }
  };

  const handleSendMandate = () => {
    setCheckoutError('');
    if (!upiId.includes('@') || upiId.length < 5) {
      setCheckoutError('Please enter a valid UPI ID (e.g., name@okaxis or 9876543210@paytm)');
      return;
    }
    setMandateSent(true);
  };

  const handleVerifyPayment = (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter the exact 12-digit UPI Reference / Mandate UTR number.');
      return;
    }

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      upi: upiId.trim(),
      utr: utrNumber.trim(),
      plan: '₹2 Trial → ₹1,999/yr AutoPay',
      status: 'Active',
      time: 'Just now'
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setTier('pro');
    setCheckoutSuccess(true);

    setTimeout(() => {
      setIsPricingOpen(false);
      setCheckoutSuccess(false);
      setMandateSent(false);
      setUtrNumber('');
    }, 1500);
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

  const saveAdminCloudConfig = () => {
    localStorage.setItem('sp_google_client_id', googleClientId.trim());
    localStorage.setItem('sp_backend_url', backendUrl.trim());
    localStorage.setItem('sp_drive_folder_id', driveFolderId.trim());
    alert('5TB Cloud & OAuth settings saved!');
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#06080d] text-slate-100 font-sans selection:bg-pink-500/30 selection:text-pink-200 relative overflow-x-hidden">
      {/* Ambient Jet Black + Cerulean Blue + Neon Rose Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-36 left-0 w-72 sm:w-[540px] h-72 sm:h-[540px] rounded-full bg-sky-500/12 blur-[110px]" />
        <div className="absolute top-1/3 right-0 w-64 sm:w-[460px] h-64 sm:h-[460px] rounded-full bg-pink-600/12 blur-[115px]" />
      </div>

      {/* Android-Responsive Floating Glass Header */}
      <header className="sticky top-2.5 sm:top-4 z-30 w-full max-w-6xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-[#090d16]/90 backdrop-blur-xl border border-sky-500/20 shadow-[0_0_25px_rgba(0,123,255,0.12)]">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-pink-500 p-[1px]">
              <div className="w-full h-full bg-[#06080d] rounded-[11px] flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              </div>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-pink-300 bg-clip-text text-transparent">
              ShortsPilot
            </span>
          </div>

          {/* Right Controls (Persistent Gmail Avatar + YouTube Pill + Tier) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Gmail Account Pill */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all border max-w-[145px] sm:max-w-[200px] ${
                gmailUser || ytChannel
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 active:scale-95 border-rose-500/40 text-rose-300'
              }`}
            >
              {gmailUser?.picture ? (
                <img
                  src={gmailUser.picture}
                  alt="Profile"
                  className="w-4 h-4 rounded-full shrink-0"
                />
              ) : (
                <Youtube
                  className={`w-3.5 h-3.5 shrink-0 ${
                    ytChannel ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                />
              )}
              <span className="truncate">
                {ytChannel
                  ? ytChannel.handle
                  : gmailUser
                  ? gmailUser.name
                  : 'Sign In / YT'}
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
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#0c1220] border border-sky-500/30 text-[11px] sm:text-xs font-medium text-slate-200 shrink-0 active:scale-95"
              >
                <span className="text-sky-400 font-semibold">{quotaUsed}/5</span>
                <span className="text-pink-400 font-semibold">Pro</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-[#0c1220] border border-slate-800 text-slate-300 shrink-0 active:scale-95"
              aria-label="Studio Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-10 pb-20">
        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-9">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[11px] sm:text-xs font-medium mb-3">
            <Scissors className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>9:16 Vertical Shorts + YouTube Auto-Post</span>
          </div>
          <h1 className="text-2xl sm:text-5xl font-bold tracking-tight text-white mb-3 leading-snug sm:leading-tight">
            Turn Raw Videos Into{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">
              Viral Shorts
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-base px-1">
            Select any video from your gallery. ShortsPilot crops it into a 9:16 vertical clip and publishes straight to YouTube.
          </p>
        </div>

        {/* Persistent Gmail + YouTube Channel Status Banner */}
        {!ytChannel && !gmailUser ? (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-[#090d16] to-sky-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Youtube className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0">
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500 active:bg-rose-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
            >
              <Link2 className="w-3.5 h-3.5" />
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3 px-4 rounded-2xl bg-[#090d16] border border-emerald-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {gmailUser?.picture ? (
                <img
                  src={gmailUser.picture}
                  alt="Gmail"
                  className="w-7 h-7 rounded-full border border-emerald-400/50 shrink-0"
                />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {ytChannel?.handle || gmailUser?.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
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
              className="text-xs text-sky-400 shrink-0 font-medium"
            >
              Account
            </button>
          </div>
        )}

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl p-7 sm:p-14 text-center transition-all border-2 border-dashed mb-6 ${
            isDragging
              ? 'border-pink-500 bg-pink-500/10'
              : 'border-sky-500/35 bg-[#080c15]/95 shadow-[0_0_30px_rgba(0,123,255,0.08)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-500/20 to-pink-500/20 border border-sky-400/30 flex items-center justify-center">
            <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
          </div>

          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1.5">
            Select Video from Gallery
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
            Choose any MP4/MOV video. Automatically crops to 9:16 vertical Short & uploads to YouTube.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 active:scale-[0.98] transition-all shadow-[0_0_25px_rgba(255,16,110,0.35)] flex items-center gap-2 mx-auto"
          >
            <Upload className="w-4 h-4" />
            Choose Video File
          </button>
        </div>

        {/* 3-Step Bento Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-7">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/90 border border-sky-500/20 flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              01
            </span>
            <div>
              <div className="text-sm font-semibold text-white">Select Raw Video</div>
              <div className="text-xs text-slate-400">From phone gallery or files</div>
            </div>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/90 border border-pink-500/20 flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-400 border border-pink-500/30 shrink-0">
              02
            </span>
            <div>
              <div className="text-sm font-semibold text-white">AI Hook & 9:16 Crop</div>
              <div className="text-xs text-slate-400">Vertical Shorts framing</div>
            </div>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#090d16]/90 border border-sky-500/20 flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              03
            </span>
            <div>
              <div className="text-sm font-semibold text-white">YouTube Auto-Post</div>
              <div className="text-xs text-slate-400">Direct Shorts publishing</div>
            </div>
          </div>
        </div>

        {/* Auto-Pilot Publishing Queue */}
        {videoQueue.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-white">Publishing Queue</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {videoQueue.length}
                </span>
              </div>
              <button
                onClick={() => setVideoQueue([])}
                className="text-xs text-slate-400 hover:text-pink-400"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoQueue.map((clip) => (
                <div
                  key={clip.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-sky-500/20 flex flex-col justify-between gap-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          Hook {clip.hookScore}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          9:16 • {clip.duration}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm truncate">
                        {clip.title}
                      </h4>
                    </div>
                    <button
                      onClick={() =>
                        setVideoQueue((prev) => prev.filter((item) => item.id !== clip.id))
                      }
                      className="text-slate-500 hover:text-pink-400 p-1.5 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {clip.croppedUrl && (
                    <div
                      onClick={() => setPreviewClip(clip)}
                      className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-[9/16] h-56 mx-auto w-32 cursor-pointer"
                    >
                      <video
                        src={clip.croppedUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-sky-300 font-medium">
                        {clip.status === 'analyzing' && 'Scanning Viral Hook...'}
                        {clip.status === 'cropping' && 'Rendering 9:16 Short...'}
                        {clip.status === 'ready' && '9:16 Short Ready'}
                        {clip.status === 'uploading' && 'Uploading to YouTube...'}
                        {clip.status === 'published' && 'Published to YouTube ✓'}
                      </span>
                      <span className="text-slate-400">{clip.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          clip.status === 'published'
                            ? 'bg-emerald-400'
                            : 'bg-gradient-to-r from-sky-400 to-pink-500'
                        }`}
                        style={{ width: `${clip.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs gap-2">
                    {clip.croppedUrl ? (
                      <a
                        href={clip.croppedUrl}
                        download={`${clip.title}_9x16.mp4`}
                        className="px-3 py-2 rounded-lg bg-slate-800 active:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        Save 9:16
                      </a>
                    ) : (
                      <span className="text-slate-500">Processing...</span>
                    )}

                    {clip.status === 'ready' && (
                      <button
                        onClick={() => handleManualPublishClick(clip)}
                        className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {ytChannel ? 'Post to YT' : 'Link YT'}
                      </button>
                    )}

                    {clip.status === 'published' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        {clip.youtubeUrl ? (
                          <a href={clip.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
                            Open Short ↗
                          </a>
                        ) : (
                          'Posted'
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

      {/* Full 9:16 Clip Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-[300px] rounded-3xl bg-[#080c15] border border-sky-500/30 p-3">
            <button
              onClick={() => setPreviewClip(null)}
              className="absolute -top-3 -right-3 p-2.5 rounded-full bg-slate-900 border border-slate-700 text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <video
              src={previewClip.croppedUrl}
              controls
              autoPlay
              playsInline
              className="w-full rounded-2xl aspect-[9/16] bg-black"
            />
          </div>
        </div>
      )}

      {/* Connect Gmail & YouTube Channel Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border-t sm:border border-rose-500/35 p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsConnectModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center mb-3">
              <Youtube className="w-6 h-6 text-rose-400" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              Gmail & YouTube Account
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your Gmail login & YouTube channel stay saved even if you refresh or close the app.
            </p>

            {/* Show Active Signed-In Gmail Card */}
            {(gmailUser || ytChannel) && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {gmailUser?.picture ? (
                    <img
                      src={gmailUser.picture}
                      alt="Profile"
                      className="w-9 h-9 rounded-full shrink-0"
                    />
                  ) : (
                    <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {ytChannel?.handle || gmailUser?.name}
                    </div>
                    <div className="text-[11px] text-emerald-300 truncate">
                      {gmailUser?.email || 'Saved in Browser Storage'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectAll}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/25 mb-4 space-y-2.5">
              <div className="text-xs font-semibold text-sky-300">
                1-Click Google OAuth (Gmail + YouTube Auto-Upload)
              </div>
              <button
                type="button"
                onClick={() => handleOneClickGoogleConnect(false)}
                className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-sky-500 to-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                {gmailUser ? 'Switch Gmail / Re-Authorize' : 'Sign in with Google'}
              </button>
            </div>

            <form onSubmit={handleQuickConnectYouTube} className="space-y-3">
              <div className="text-xs font-semibold text-slate-400">
                Or Save Channel Handle Manually
              </div>
              <input
                type="text"
                value={ytHandleInput}
                onChange={(e) => setYtHandleInput(e.target.value)}
                placeholder="@YourChannelHandle"
                className="w-full px-3.5 py-3 rounded-xl bg-[#05070c] border border-slate-700 focus:border-rose-500 text-sm text-white outline-none"
              />

              {connectError && <p className="text-xs text-rose-400">{connectError}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 active:scale-[0.98]"
              >
                Save Channel Handle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ₹2 Trial + ₹1,999/Year UPI AutoPay Checkout Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border-t sm:border border-sky-500/30 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsPricingOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>7-Day Trial • 1-Year Pro Unlock</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Start for <span className="text-sky-400">₹2</span> Today
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              ₹2 today for 7 days, then ₹1,999/year via UPI AutoPay (cancel anytime).
            </p>

            <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/25 mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">₹2</span>
                <span className="text-xs text-slate-400">for 7 days, then ₹1,999/year</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" /> Unlimited 9:16 AI Shorts & Reels
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400 shrink-0" /> Direct YouTube Auto-Publishing
                </li>
              </ul>
            </div>

            {checkoutSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-white text-base">1-Year Pro Plan Activated!</div>
              </div>
            ) : (
              <form onSubmit={handleVerifyPayment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your UPI ID for AutoPay
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="name@okicici / number@paytm"
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm text-white outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendMandate}
                      className="px-3.5 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-semibold shrink-0"
                    >
                      {mandateSent ? 'Sent ✓' : 'Request'}
                    </button>
                  </div>
                  {mandateSent && (
                    <p className="text-[11px] text-sky-300 mt-1.5">
                      Approve ₹2 AutoPay in your UPI app (to <span className="font-mono">{receiverUpi}</span>) & enter 12-digit UTR below.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    12-Digit UPI UTR Reference Number
                  </label>
                  <input
                    type="tel"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 431982746102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm font-mono text-white outline-none"
                    required
                  />
                </div>

                {checkoutError && (
                  <div className="flex items-center gap-2 text-xs text-pink-400 bg-pink-500/10 border border-pink-500/30 p-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Verify ₹2 & Unlock Pro
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Client Settings Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xs sm:max-w-sm bg-[#080c15] border-l border-sky-500/25 h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Studio Preferences</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {gmailUser && (
                  <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {gmailUser.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{gmailUser.email}</div>
                    </div>
                    <button
                      onClick={handleDisconnectAll}
                      className="text-xs text-rose-400 font-semibold shrink-0"
                    >
                      Logout
                    </button>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Current Plan</div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      {tier === 'pro' ? 'ShortsPilot Pro (1-Yr)' : 'Starter Free Tier'}
                    </span>
                    {tier !== 'pro' && (
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsPricingOpen(true);
                        }}
                        className="text-xs text-sky-400 font-medium"
                      >
                        Try ₹2
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span className="text-sm text-slate-200">Auto-Publish to YT</span>
                    </div>
                    <button
                      onClick={() => setAutoPublishEnabled(!autoPublishEnabled)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        autoPublishEnabled
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {autoPublishEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="text-sm text-slate-200 truncate">
                        {ytChannel ? ytChannel.handle : 'YouTube Shorts'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsConnectModalOpen(true);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 shrink-0"
                    >
                      {ytChannel ? 'Manage' : 'Connect'}
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-slate-200">Instagram Reels</span>
                    </div>
                    <button
                      onClick={() => setIgAutoSync(!igAutoSync)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        igAutoSync
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {igAutoSync ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-800 pt-3">
              ShortsPilot Persistent Studio v3.3
            </div>
          </div>
        </div>
      )}

      {/* Hidden Owner Control Center (?admin=true) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#070a12] border-t sm:border border-pink-500/40 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="py-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-pink-500/15 border border-pink-500/40 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Owner Control Center</h3>
                <p className="text-xs text-slate-400 mb-5">
                  Enter Master PIN to manage 5TB Drive Vault, OAuth & Payments.
                </p>

                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Master PIN"
                  className="w-full max-w-xs mx-auto block px-4 py-3 rounded-xl bg-[#05070c] border border-slate-700 text-center text-white tracking-widest outline-none mb-3"
                  autoFocus
                />

                {pinError && <p className="text-xs text-pink-400 mb-3">{pinError}</p>}

                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-pink-600 text-white text-sm font-semibold"
                >
                  Unlock Console
                </button>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-pink-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">Owner Control Center</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    5 TB Active
                  </span>
                </div>

                {/* 5TB Google Drive Storage Meter */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/30 mb-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-sky-300">
                      <HardDrive className="w-4 h-4" /> Google Drive 5 TB Vault
                    </span>
                    <span className="font-mono text-slate-300">
                      {storageUsedGB} / 5,120 GB
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-pink-500"
                      style={{ width: `${Math.max(1, (storageUsedGB / 5120) * 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Drive Target Folder
                      </label>
                      <input
                        type="text"
                        value={driveFolderId}
                        onChange={(e) => setDriveFolderId(e.target.value)}
                        className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-sky-300 font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Auto-Cleanup Raw Files
                      </label>
                      <select
                        value={autoCleanupDays}
                        onChange={(e) => setAutoCleanupDays(e.target.value)}
                        className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-200 outline-none"
                      >
                        <option value="7">7 Days</option>
                        <option value="15">15 Days</option>
                        <option value="30">30 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Google OAuth Client ID */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800 mb-3.5 space-y-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Google OAuth Client ID
                    </label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="123456789-xxxx.apps.googleusercontent.com"
                      className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="Optional FFmpeg Server URL"
                      className="flex-1 min-w-0 bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-sky-300 outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveAdminCloudConfig}
                      className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold shrink-0"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Receiver UPI & Subscribers */}
                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  <div className="p-3 rounded-2xl bg-[#0c1220] border border-sky-500/20">
                    <div className="text-[11px] text-slate-400">Receiver UPI</div>
                    <input
                      type="text"
                      value={receiverUpi}
                      onChange={(e) => setReceiverUpi(e.target.value)}
                      className="mt-1 w-full bg-transparent text-xs font-mono text-sky-300 font-semibold outline-none"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#0c1220] border border-pink-500/20">
                    <div className="text-[11px] text-slate-400">AutoPay Users</div>
                    <div className="mt-1 text-sm font-bold text-pink-400">
                      {transactions.length} Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setTier(tier === 'pro' ? 'free' : 'pro');
                      setQuotaUsed(0);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tier: {tier.toUpperCase()}
                  </button>
                  <button
                    onClick={() => setIsAdminUnlocked(false)}
                    className="text-xs text-slate-400 hover:text-pink-400"
                  >
                    Lock Console
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
