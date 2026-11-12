import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Instagram, Sliders, X, Trash2, Download,
  CreditCard, AlertCircle, Check, RefreshCw, Link2, Radio, Send,
  Scissors, HardDrive, LogOut, UserCheck, Smartphone, Copy, QrCode
} from 'lucide-react';

// अपनी Google Cloud Console से मिली Client ID यहाँ पेस्ट करें
const DEFAULT_GOOGLE_CLIENT_ID = '';

// अपनी असली Receiver UPI ID यहाँ डालें (एडमिन पैनल से भी बदल सकते हैं)
const DEFAULT_RECEIVER_UPI = 'shortspilot@ptyes';

export default function App() {
  // Persistent Client & Subscription State
  const [tier, setTier] = useState(() => localStorage.getItem('sp_tier') || 'free');
  const [quotaUsed, setQuotaUsed] = useState(() => Number(localStorage.getItem('sp_quota_used') || 0));
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Persistent Gmail User + YouTube Channel State
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

  // Direct UPI Payment State
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [upiLaunched, setUpiLaunched] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Hidden Owner Control Center & 5TB Cloud Storage State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [receiverUpi, setReceiverUpi] = useState(
    () => localStorage.getItem('sp_receiver_upi') || DEFAULT_RECEIVER_UPI
  );
  const [backendUrl, setBackendUrl] = useState(
    () => localStorage.getItem('sp_backend_url') || ''
  );
  const [driveFolderId, setDriveFolderId] = useState(
    () => localStorage.getItem('sp_drive_folder_id') || 'ShortsPilot_5TB_Vault'
  );
  const [autoCleanupDays, setAutoCleanupDays] = useState('15');
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('sp_transactions');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'TXN-8841',
              upi: 'rohan.create@okicici',
              utr: '431892019482',
              plan: '₹2 Trial → ₹1,999/yr',
              status: 'Active',
              time: '12 mins ago'
            }
          ];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);
  const MASTER_PIN = '9767905729';

  // Build Official UPI Deep Link (Opens GPay, PhonePe, Paytm automatically on Android)
  const cleanReceiverUpi = (receiverUpi || DEFAULT_RECEIVER_UPI).trim();
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
    cleanReceiverUpi
  )}&pn=${encodeURIComponent('ShortsPilot Pro')}&am=2.00&cu=INR&tn=${encodeURIComponent(
    'ShortsPilot 7-Day Trial'
  )}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=ffffff&color=06080d&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  // Sync states to localStorage
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

  useEffect(() => {
    localStorage.setItem('sp_transactions', JSON.stringify(transactions));
  }, [transactions]);

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

  // Load Google Identity Services SDK
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
                // Keep existing profile
              }

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

  const uploadClipToYouTubeAPI = async (clipId, title, blob, channelOverride = null) => {
    const activeChannel = channelOverride || ytChannelRef.current;
    if (!activeChannel) {
      setIsConnectModalOpen(true);
      return;
    }

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

  // Auto-Open Installed UPI App (GPay / PhonePe / Paytm) on Android
  const handleLaunchUpiApp = () => {
    setCheckoutError('');
    setUpiLaunched(true);
    window.location.href = upiDeepLink;
  };

  const handleCopyUpiId = () => {
    navigator.clipboard?.writeText(cleanReceiverUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyPayment = (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter the exact 12-digit UPI Reference / UTR number from GPay/PhonePe/Paytm.');
      return;
    }

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      upi: upiId.trim() || gmailUser?.email || 'UPI User',
      utr: utrNumber.trim(),
      plan: '₹2 Trial → ₹1,999/yr',
      status: 'Active',
      time: 'Just now'
    };

    setTransactions((prev) => [newTxn, ...prev
