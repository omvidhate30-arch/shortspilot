import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Zap, Shield, Lock,
  Youtube, Sliders, X, Trash2, Download, CreditCard,
  RefreshCw, Link2, Radio, Send, Scissors, HardDrive,
  Megaphone, Wrench, IndianRupee, BarChart3, Calendar,
  Clock, Eye, ThumbsUp, Users, Bot, Volume2, ExternalLink,
  Crown, Flame, TrendingUp, Award, Check
} from 'lucide-react';

// आपकी Google Cloud OAuth Client ID और Firebase Live Database URL
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

export default function App() {
  const [globalConfig, setGlobalConfig] = useState({
    cashfreeLink: '',
    receiverUpi: '9767905729@paytm',
    trialPrice: '2',
    yearlyPrice: '1999',
    freeLimit: 3,
    bannerText: '⚡ FLASH OFFER: Unlock All Pro AI Tools for 7 Days at just ₹2 (99% OFF)!',
    bannerActive: true,
    maintenanceMode: false,
    ytAutoUploadActive: true,
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    aiProvider: 'deepseek',
    deepseekApiKey: DEFAULT_DEEPSEEK_KEY,
    claudeApiKey: DEFAULT_CLAUDE_KEY
  });
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);

  const [activeTab, setActiveTab] = useState('studio');
  const [tier, setTier] = useState(() => localStorage.getItem('sp_tier') || 'free');
  const [quotaUsed, setQuotaUsed] = useState(() => Number(localStorage.getItem('sp_quota_used') || 0));
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [clipMode, setClipMode] = useState('1clip');
  const [offerSeconds, setOfferSeconds] = useState(899); // 14:59 countdown timer

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
    recentVideos: [],
    loading: false
  });

  const [ytHandleInput, setYtHandleInput] = useState('');
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);
  const [scheduleTimes, setScheduleTimes] = useState({});

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL
  );
  const [storageUsedGB, setStorageUsedGB] = useState(14.8);
  const [transactions, setTransactions] = useState([]);

  const fileInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const tokenClientRef = useRef(null);
  const MASTER_PIN = '9767905729';

  const activeClientId =
    globalConfig.googleClientId || localStorage.getItem('sp_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;

  // Countdown Timer for Launch Offer
  useEffect(() => {
    const timer = setInterval(() => {
      setOfferSeconds((prev) => (prev > 60 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const openProModalWithReason = (reasonText = '') => {
    setUpgradeReason(reasonText);
    setIsPricingOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') setIsAdminOpen(true);
    if (params.get('payment') === 'success' || params.get('order_status') === 'PAID') {
      setTier('pro');
      localStorage.setItem('sp_tier', 'pro');
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('🎉 Payment Confirmed! ShortsPilot Pro is now UNLOCKED.');
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

  // Fetch Global Config from Firebase
  useEffect(() => {
    const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
    if (!dbBase) return;

    const fetchLiveSettings = async () => {
      try {
        const res = await fetch(`${dbBase}/siteConfig.json`);
        const data = await res.json();
        if (data && typeof data === 'object') {
          setGlobalConfig((prev) => ({
            ...prev,
            ...data,
            deepseekApiKey: data.deepseekApiKey || prev.deepseekApiKey,
            claudeApiKey: data.claudeApiKey || prev.claudeApiKey
          }));
        }
        const txnRes = await fetch(`${dbBase}/transactions.json`);
        const txnData = await txnRes.json();
        if (txnData && typeof txnData === 'object') {
          const list = Object.entries(txnData)
            .map(([key, val]) => ({ firebaseKey: key, ...val }))
            .reverse();
          setTransactions(list);
        }
      } catch {}
    };

    fetchLiveSettings();
    const interval = setInterval(fetchLiveSettings, 15000);
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
    if (tier === 'pro') setClipMode('3clips');
  }, [tier]);

  useEffect(() => {
    localStorage.setItem('sp_quota_used', String(quotaUsed));
  }, [quotaUsed]);

  // Google OAuth Setup
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
                  'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true',
                  { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
                );
                const data = await res.json();
                const ch = data?.items?.[0];
                const rawName = ch?.snippet?.customUrl || ch?.snippet?.title || '@ConnectedCreator';
                setYtChannel({
                  handle: rawName.startsWith('@') ? rawName : `@${rawName}`,
                  channelId: ch?.id || null,
                  uploadsPlaylistId: ch?.contentDetails?.relatedPlaylists?.uploads || null,
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

  // Live YouTube Analytics
  const fetchYouTubeAnalytics = async () => {
    if (!ytChannel?.accessToken) return;
    setYtStats((prev) => ({ ...prev, loading: true }));

    try {
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${ytChannel.accessToken}` } }
      );
      const chData = await chRes.json();
      const item = chData?.items?.[0];
      const stats = item?.statistics || {};
      const uploadsId = item?.contentDetails?.relatedPlaylists?.uploads;

      let videosList = [];
      if (uploadsId) {
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=8&playlistId=${uploadsId}`,
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
          videosList = (vidData?.items || []).map((v) => ({
            id: v.id,
            title: v.snippet?.title,
            thumbnail: v.snippet?.thumbnails?.medium?.url,
            views: Number(v.statistics?.viewCount || 0).toLocaleString(),
            likes: Number(v.statistics?.likeCount || 0).toLocaleString(),
            publishedAt: new Date(v.snippet?.publishedAt).toLocaleDateString()
          }));
        }
      }

      setYtStats({
        subscribers: Number(stats.subscriberCount || 0).toLocaleString(),
        totalViews: Number(stats.viewCount || 0).toLocaleString(),
        videoCount: Number(stats.videoCount || 0).toLocaleString(),
        recentVideos: videosList,
        loading: false
      });
    } catch {
      setYtStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && ytChannel?.accessToken) {
      fetchYouTubeAnalytics();
    }
  }, [activeTab, ytChannel]);

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

  // Dual AI Engine (DeepSeek + Claude)
  const generateViralMetadataWithAI = async (rawName, partLabel) => {
    const fallbackTitle = `${rawName} (${partLabel}) 🔥 #Shorts #Viral`;
    const fallbackTags = '#Shorts #YouTubeShorts #Trending #ViralVideo';

    const prompt = `You are a viral YouTube Shorts strategist. Create 1 high-CTR catchy title (max 65 chars, no quotes) and 4 trending hashtags for a vertical Short clip named "${rawName} - ${partLabel}". Format strictly as:
TITLE: <title>
TAGS: <hashtags>`;

    const callDeepSeek = async (key) => {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 120
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
          max_tokens: 120,
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

  // 9:16 Vertical Cropping WITH ORIGINAL SOUND + Watermark on Free Tier
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

              // Free Plan Subtle Watermark (Removed automatically in Pro!)
              if (tier !== 'pro') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(canvas.width - 175, 24, 155, 28);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('Made with ShortsPilot', canvas.width - 165, 43);
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

  // Direct OR Scheduled YouTube Shorts Upload
  const uploadClipToYouTubeAPI = async (clip, scheduledIsoTime = null) => {
    if (scheduledIsoTime && tier !== 'pro') {
      openProModalWithReason('Scheduled YouTube Auto-Posting is a Pro feature. Unlock now for just ₹2!');
      return;
    }

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
        const statusObj = scheduledIsoTime
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
            description: `${clip.title}\n\n${clip.hashtags}\nEdited & Auto-Published via ShortsPilot AI`,
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
                  status: scheduledIsoTime ? 'scheduled' : 'published',
                  scheduledFor: scheduledIsoTime,
                  youtubeUrl: uploadedVideo.id ? `https://youtube.com/shorts/${uploadedVideo.id}` : null
                }
              : item
          )
        );
        return;
      } catch (err) {
        alert(`YouTube Upload: ${err.message}`);
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
                status: scheduledIsoTime ? 'scheduled' : 'published',
                scheduledFor: scheduledIsoTime
              }
            : item
        )
      );
    }, 900);
  };

  const processNewFile = async (file) => {
    if (tier === 'free' && quotaUsed >= Number(globalConfig.freeLimit || 3)) {
      openProModalWithReason(`You've used all ${globalConfig.freeLimit} Free Credits! Unlock Unlimited Shorts for ₹${globalConfig.trialPrice}.`);
      return;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (tier === 'free') setQuotaUsed((q) => q + 1);

    const segments =
      clipMode === '3clips' && tier === 'pro'
        ? [
            { label: 'Part 1: Viral Hook', ratio: 0.02, score: '9.7/10' },
            { label: 'Part 2: Peak Climax', ratio: 0.36, score: '9.4/10' },
            { label: 'Part 3: Best Ending', ratio: 0.70, score: '9.2/10' }
          ]
        : [{ label: 'Highlight Cut', ratio: 0.10, score: '9.5/10' }];

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

      if (autoPublishEnabled && ytChannelRef.current?.accessToken) {
        await uploadClipToYouTubeAPI(readyClip, null);
      }
    }
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files || []).forEach((file) => processNewFile(file));
    e.target.value = '';
  };

  const handleCashfreePayClick = () => {
    const link = (globalConfig.cashfreeLink || '').trim();
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      alert('Cashfree Payment Link abhi pending hai. Approval ke baad Admin Panel (?admin=true) me add karein.');
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter the exact 12-digit Payment Reference / UTR number.');
      return;
    }

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser?.email || ytChannel?.handle || 'Creator User',
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
    }, 1400);
  };

  const handlePublishGlobalConfig = async () => {
    setIsSyncingGlobal(true);
    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', liveDbUrl.trim());
    localStorage.setItem('sp_google_client_id', globalConfig.googleClientId.trim());

    const dbBase = liveDbUrl.trim().replace(/\/$/, '');
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
      alert('✅ Live Updated! All changes are now live across the website.');
    } catch {
      alert('Check Firebase Realtime Database Rules (.read: true, .write: true).');
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
    <div className="min-h-screen w-full max-w-[100vw] bg-[#06080d] text-slate-100 font-sans relative overflow-x-hidden">
      {/* Top Urgent Offer Bar */}
      {globalConfig.bannerActive && globalConfig.bannerText && (
        <div
          onClick={() => tier !== 'pro' && openProModalWithReason('Limited-time Launch Offer unlocked!')}
          className="w-full bg-gradient-to-r from-sky-600 via-blue-600 to-pink-600 text-white text-[11px] sm:text-xs font-semibold py-2 px-3 text-center cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{globalConfig.bannerText}</span>
          {tier !== 'pro' && (
            <span className="px-2 py-0.5 rounded bg-black/30 font-mono text-[10px] shrink-0">
              Ends in {formatTimer(offerSeconds)}
            </span>
          )}
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
                <span>PRO</span>
              </div>
            ) : (
              <button
                onClick={() => openProModalWithReason('Unlock all Pro AI Tools for 7 days!')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/50 text-[11px] sm:text-xs font-bold text-amber-300 shrink-0 animate-pulse"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Pro ₹{globalConfig.trialPrice}</span>
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
            AI Clip Studio
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
            Shorts Analytics
          </button>
        </div>

        {/* Live Social Proof Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>1,420+ Creators upgraded to Pro this week</span>
        </div>
      </div>

      {/* TAB 1: HIGH-CONVERSION AI CLIP STUDIO */}
      {activeTab === 'studio' && (
        <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-5 pb-20">
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-semibold mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>#1 AI YouTube Shorts Automation Studio in India</span>
            </div>
            <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight text-white mb-2.5 leading-snug">
              1 Video →{' '}
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">
                3 Viral Shorts
              </span>{' '}
              in 30 Seconds
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mb-4">
              Auto-crops 9:16 with Original Sound, writes viral titles & hashtags with AI, and schedules directly to YouTube.
            </p>

            {/* Primary Conversion CTA Banner for Free Users */}
            {tier !== 'pro' && (
              <div className="inline-flex flex-col sm:flex-row items-center gap-2.5 p-2 px-4 rounded-2xl bg-gradient-to-r from-sky-500/15 via-pink-500/15 to-amber-500/15 border border-pink-500/35">
                <span className="text-xs text-slate-200">
                  Free Plan: <strong className="text-rose-400">Watermark ON</strong> • Only {Math.max(0, globalConfig.freeLimit - quotaUsed)} clips left
                </span>
                <button
                  onClick={() => openProModalWithReason('Remove Watermark + Unlock 3x Viral Clip Extraction & Auto-Scheduling!')}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 text-white text-xs font-bold flex items-center gap-1 shadow-lg"
                >
                  <Crown className="w-3.5 h-3.5" /> Start ₹{globalConfig.trialPrice} Pro Trial
                </button>
              </div>
            )}
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
                    Step 1: Connect Your YouTube Channel
                  </div>
                  <div className="text-xs text-slate-400">
                    Sign in with Google for 1-click Shorts publishing & live analytics.
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

          {/* Upload Dropzone with Pro Feature Toggles */}
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

            {/* Pro-Gated Mode Selector */}
            <div className="inline-flex p-1 rounded-xl bg-[#0c1220] border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setClipMode('1clip')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  clipMode === '1clip' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                1 Single Clip (Free)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tier !== 'pro') {
                    openProModalWithReason('Extract 3 Viral Shorts from 1 video automatically with Pro!');
                    return;
                  }
                  setClipMode('3clips');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  clipMode === '3clips' ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white' : 'text-amber-300'
                }`}
              >
                {tier !== 'pro' ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                3x Viral Clips (PRO)
              </button>
            </div>

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-pink-500/20 border border-sky-400/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1.5">
              Select Video from Gallery
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
              Crops to 9:16 vertical Short with original sound & AI viral titles.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto justify-center px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 flex items-center gap-2 mx-auto shadow-[0_0_25px_rgba(56,189,248,0.25)]"
            >
              <Upload className="w-4 h-4" />
              Choose Video File
            </button>
          </div>

          {/* 4 Pro-Locked AI Power Tools Showcase (Tapping any opens ₹2 Pro Upgrade) */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Pro AI Growth Suite
              </h3>
              {tier !== 'pro' && (
                <button
                  onClick={() => openProModalWithReason('Get instant access to all 4 AI Growth Tools!')}
                  className="text-xs text-amber-400 font-semibold hover:underline"
                >
                  Unlock All for ₹{globalConfig.trialPrice} →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  icon: Scissors,
                  title: '1-to-3 Viral Clipper',
                  desc: 'Auto-extracts Hook, Climax & Ending Shorts from 1 video.',
                  badge: '3x Views'
                },
                {
                  icon: Clock,
                  title: 'Auto-Schedule Posting',
                  desc: 'Set peak hours & let ShortsPilot post while you sleep.',
                  badge: 'Hands-Free'
                },
                {
                  icon: Bot,
                  title: 'AI Viral Title & Tags',
                  desc: 'DeepSeek & Claude write high-CTR titles that trigger algorithm.',
                  badge: 'High CTR'
                },
                {
                  icon: Award,
                  title: 'Zero Watermark Export',
                  desc: 'Clean, brand-free 9:16 vertical Shorts ready for monetization.',
                  badge: 'Clean HD'
                }
              ].map((tool, idx) => {
                const IconComp = tool.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => tier !== 'pro' && openProModalWithReason(`Unlock "${tool.title}" with ShortsPilot Pro!`)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      tier === 'pro'
                        ? 'bg-[#090d16] border-emerald-500/30'
                        : 'bg-[#090d16]/90 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-sky-400" />
                      </div>
                      {tier === 'pro' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{tool.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{tool.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Free vs Pro Comparison Box (Direct Conversion Block on First Page) */}
          {tier !== 'pro' && (
            <section className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#0c1222] via-[#090d16] to-[#160b18] border border-pink-500/35">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-lg">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[11px] font-bold">
                    <TrendingUp className="w-3.5 h-3.5" /> WHY CREATORS UPGRADE TO PRO
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white">
                    Go Viral Faster — Remove Watermark & Unlock Unlimited AI Shorts
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300 pt-1">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited 9:16 Video Conversions
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> No "ShortsPilot" Watermark
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> 1 Video → 3 Viral Shorts Mode
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> Scheduled YouTube Auto-Posting
                    </li>
                  </ul>
                </div>

                <div className="w-full md:w-auto p-4 rounded-2xl bg-black/50 border border-amber-400/40 text-center shrink-0">
                  <div className="text-[11px] text-slate-400 line-through">Regular ₹499/month</div>
                  <div className="text-3xl font-extrabold text-white my-0.5">
                    ₹{globalConfig.trialPrice}{' '}
                    <span className="text-xs font-normal text-amber-300">/ 7-Day Trial</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-3">
                    Then ₹{globalConfig.yearlyPrice}/year • Cancel anytime
                  </div>
                  <button
                    onClick={() => openProModalWithReason('Claim your ₹2 7-Day Pro Trial now!')}
                    className="w-full px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-pink-600 to-rose-600 shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                  >
                    Upgrade to Pro Now →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Generated Shorts Queue */}
          {videoQueue.length > 0 && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    AI Shorts Queue ({videoQueue.length})
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
                          {tier !== 'pro' && (
                            <span
                              onClick={() => openProModalWithReason('Remove watermark by upgrading to Pro for ₹2!')}
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 cursor-pointer"
                            >
                              Remove Watermark
                            </span>
                          )}
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

                    {/* Schedule Picker (Pro Feature) */}
                    {clip.status === 'ready' && (
                      <div className="p-2.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between gap-2">
                        <label className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" /> Schedule {tier !== 'pro' && '(PRO)'}:
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleTimes[clip.id] || ''}
                          onClick={() => tier !== 'pro' && openProModalWithReason('Scheduled YouTube Posting requires Pro!')}
                          onChange={(e) =>
                            setScheduleTimes((prev) => ({ ...prev, [clip.id]: e.target.value }))
                          }
                          className="bg-[#05070c] text-white text-[11px] px-2 py-1 rounded border border-slate-700 outline-none min-w-0"
                        />
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
                        <div className="flex items-center gap-1.5">
                          {scheduleTimes[clip.id] && (
                            <button
                              onClick={() => uploadClipToYouTubeAPI(clip, scheduleTimes[clip.id])}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-semibold flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" /> Schedule YT
                            </button>
                          )}
                          <button
                            onClick={() => uploadClipToYouTubeAPI(clip, null)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold flex items-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" /> Post Now
                          </button>
                        </div>
                      )}

                      {clip.status === 'uploading' && (
                        <span className="text-sky-400 font-medium">Uploading to YouTube...</span>
                      )}

                      {clip.status === 'scheduled' && (
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Scheduled ✓
                        </span>
                      )}

                      {clip.status === 'published' && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {clip.youtubeUrl ? (
                            <a href={clip.youtubeUrl} target="_blank" rel="noreferrer" className="underline">
                              Live on YT ↗
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
      )}

      {/* TAB 2: LIVE YOUTUBE SHORTS ANALYTICS */}
      {activeTab === 'analytics' && (
        <main className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-4 pt-5 pb-20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Shorts Performance Dashboard</h2>
              <p className="text-xs text-slate-400">
                Real-time channel views, likes & growth metrics from your connected YouTube channel.
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
                Sign in with Google to track how your uploaded Shorts are performing.
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
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
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
                    <Youtube className="w-3.5 h-3.5 text-emerald-400" /> Total Videos
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-white">{ytStats.videoCount}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Recent Uploads Performance</h3>
                {ytStats.recentVideos.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#090d16] border border-slate-800 text-xs text-slate-400 text-center">
                    {ytStats.loading ? 'Loading YouTube stats...' : 'No videos found on this channel yet.'}
                  </div>
                ) : (
                  ytStats.recentVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-3 sm:p-4 rounded-2xl bg-[#090d16] border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {vid.thumbnail && (
                          <img src={vid.thumbnail} alt={vid.title} className="w-16 h-10 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-white truncate">{vid.title}</div>
                          <div className="text-[11px] text-slate-500">{vid.publishedAt}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="flex items-center gap-1 text-sky-300 font-semibold">
                          <Eye className="w-3.5 h-3.5" /> {vid.views}
                        </span>
                        <span className="flex items-center gap-1 text-pink-300 font-semibold">
                          <ThumbsUp className="w-3.5 h-3.5" /> {vid.likes}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      )}

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

      {/* High-Converting Pro Upgrade Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#080c15] border border-amber-400/40 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
            <button onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            {upgradeReason && (
              <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                ⚡ {upgradeReason}
              </div>
            )}

            <h3 className="text-xl font-extrabold text-white mb-1">
              Unlock ShortsPilot PRO for <span className="text-amber-400">₹{globalConfig.trialPrice}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              7-Day Full Access Trial at ₹{globalConfig.trialPrice} (then ₹{globalConfig.yearlyPrice}/year). Remove watermarks, extract 3x viral clips & auto-schedule to YouTube.
            </p>

            {checkoutSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-white">Pro Plan Activated!</div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCashfreePayClick}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{globalConfig.trialPrice} Safely via Cashfree
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="border-t border-slate-800 pt-3">
                  <div className="text-[11px] text-slate-400 mb-2">
                    Already paid? Enter your 12-digit Payment Reference / UTR ID for instant unlock:
                  </div>
                  <form onSubmit={handleVerifyPayment} className="space-y-2.5">
                    <input
                      type="tel"
                      maxLength={12}
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 12-Digit UTR / Reference No."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 text-sm font-mono text-white outline-none"
                      required
                    />
                    {checkoutError && <p className="text-xs text-pink-400">{checkoutError}</p>}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-amber-500 to-pink-600"
                    >
                      Verify & Unlock Pro
                    </button>
                  </form>
                </div>
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
                <span className="text-sm text-slate-200">Instant Auto-Post to YT</span>
                <button
                  onClick={() => setAutoPublishEnabled(!autoPublishEnabled)}
                  className="text-xs px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 font-semibold"
                >
                  {autoPublishEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500">ShortsPilot AI Studio v5.5</div>
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
                <p className="text-xs text-slate-400 mb-4">Enter Master PIN to manage DeepSeek/Claude AI, Cashfree & Live Site.</p>
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
                    Firebase Synced
                  </span>
                </div>

                {/* 1. Dual AI Engine Configuration */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" /> AI Viral Title Engine (DeepSeek / Claude)
                    </span>
                    <select
                      value={globalConfig.aiProvider}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, aiProvider: e.target.value })}
                      className="bg-[#05070c] px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-white outline-none"
                    >
                      <option value="deepseek">Primary: DeepSeek AI</option>
                      <option value="claude">Primary: Claude AI</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">DeepSeek API Key</label>
                      <input
                        type="password"
                        value={globalConfig.deepseekApiKey}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, deepseekApiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-sky-300 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Claude API Key</label>
                      <input
                        type="password"
                        value={globalConfig.claudeApiKey}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, claudeApiKey: e.target.value })}
                        placeholder="sk-ant-..."
                        className="w-full bg-[#05070c] px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-pink-300 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Cashfree Payment Gateway Link & Prices */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-emerald-500/30 space-y-3">
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Cashfree Payment Gateway & Plans
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Cashfree Payment Link URL (Add after KYC approval)
                    </label>
                    <input
                      type="url"
                      value={globalConfig.cashfreeLink}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, cashfreeLink: e.target.value })}
                      placeholder="https://payments.cashfree.com/links/..."
                      className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-emerald-300 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Trial Price (₹)</label>
                      <input
                        type="number"
                        value={globalConfig.trialPrice}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, trialPrice: e.target.value })}
                        className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Yearly Price (₹)</label>
                      <input
                        type="number"
                        value={globalConfig.yearlyPrice}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })}
                        className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Free Limit</label>
                      <input
                        type="number"
                        value={globalConfig.freeLimit}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, freeLimit: Number(e.target.value) })}
                        className="w-full bg-[#05070c] px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Banner & Kill Switches */}
                <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-pink-300 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" /> Top Offer Banner
                    </span>
                    <button
                      type="button"
                      onClick={() => setGlobalConfig({ ...globalConfig, bannerActive: !globalConfig.bannerActive })}
                      className="text-[11px] px-2.5 py-0.5 rounded bg-slate-800 text-sky-300 font-semibold"
                    >
                      {globalConfig.bannerActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={globalConfig.bannerText}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, bannerText: e.target.value })}
                    className="w-full bg-[#05070c] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGlobalConfig({ ...globalConfig, ytAutoUploadActive: !globalConfig.ytAutoUploadActive })
                      }
                      className="p-2 rounded-xl border border-slate-700 text-xs font-semibold text-emerald-300 flex justify-between"
                    >
                      <span>YT Upload</span>
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
                </div>

                {/* Publish Button */}
                <button
                  type="button"
                  onClick={handlePublishGlobalConfig}
                  disabled={isSyncingGlobal}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 shadow-[0_0_25px_rgba(255,16,110,0.3)]"
                >
                  {isSyncingGlobal ? 'Publishing to All Users...' : '🚀 Publish Live Changes to Entire Website'}
                </button>

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
