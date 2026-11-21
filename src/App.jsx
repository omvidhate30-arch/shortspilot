import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Play,
  Youtube,
  X,
  Trash2,
  Calendar,
  Clock,
  Bot,
  Crown,
  Bell,
  Home,
  BarChart2 as ChartIcon,
  Plus,
  FolderKanban,
  Settings,
  Menu,
  Zap,
  TrendingUp,
  Scissors,
  Image as ImageIcon,
  Instagram,
  LogOut,
  ExternalLink,
  Copy
} from 'lucide-react';

const DEFAULT_FIREBASE_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const FIXED_OAUTH_ORIGIN = 'https://www.shortspilot.in';
const IDB_NAME = 'ShortsPilotClipsDB';
const IDB_STORE = 'clips';

const emailToKey = (email = '') =>
  String(email || '')
    .trim()
    .toLowerCase()
    .replace(/[.#$[\]@]/g, '_');

const sanitizeMediaUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  if (
    url.startsWith('blob:') ||
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('data:image/')
  ) {
    return url;
  }
  return '';
};

const formatClockTime = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const detectTopicFromFile = (fileName = '') => {
  const base = String(fileName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(
      /\b(vid|video|screen|recording|record|clip|short|shorts|final|edit|hd|fhd|4k|1080p|720p|60fps|30fps|mp4|mov|mkv)\b/gi,
      ' '
    )
    .replace(/\b\d{4,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!base || base.length < 2) {
    return 'Insane Viral Moment';
  }
  return base.replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const generateThumbnailBlob = async ({
  hookText = 'WAIT FOR END 😱',
  subText = 'VIRAL SHORT',
  watermarkText = 'Developed by shortspilot.in',
  palette = ['#db2777', '#581c87', '#020617']
}) => {
  try {
    if (typeof document === 'undefined') return { blob: null, dataUrl: '' };
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: null, dataUrl: '' };

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, palette[0] || '#db2777');
    grad.addColorStop(0.55, palette[1] || '#581c87');
    grad.addColorStop(1, palette[2] || '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 96px sans-serif';
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(String(hookText).toUpperCase(), canvas.width / 2, canvas.height * 0.44);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(hookText).toUpperCase(), canvas.width / 2, canvas.height * 0.44);

    ctx.font = '800 58px sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeText(
      String(subText).toUpperCase().slice(0, 24),
      canvas.width / 2,
      canvas.height * 0.54
    );
    ctx.fillStyle = '#fde047';
    ctx.fillText(
      String(subText).toUpperCase().slice(0, 24),
      canvas.width / 2,
      canvas.height * 0.54
    );

    ctx.font = '700 32px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(watermarkText, canvas.width / 2, canvas.height * 0.92);

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return { blob, dataUrl };
  } catch {
    return { blob: null, dataUrl: '' };
  }
};

const readLocalRegistry = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

const saveLocalRegistry = (email, record) => {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;
    const current = readLocalRegistry();
    current[cleanEmail] = {
      ...(current[cleanEmail] || {}),
      ...record,
      email: cleanEmail,
      updatedAt: Date.now()
    };
    localStorage.setItem('sp_user_registry', JSON.stringify(current));
  } catch {}
};

let cachedDbPromise = null;
const openClipsDB = () => {
  if (cachedDbPromise) return cachedDbPromise;
  cachedDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      cachedDbPromise = null;
      reject(req.error);
    };
  });
  return cachedDbPromise;
};

const idbSaveClip = async (clipObj) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const { croppedUrl, ...persistable } = clipObj;
      tx.objectStore(IDB_STORE).put({
        ...persistable,
        savedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};

const idbGetAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort(
          (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
        );
        resolve(
          items.map((item) => {
            const baseUrl = item.blob instanceof Blob ? URL.createObjectURL(item.blob) : '';
            const trimHash =
              baseUrl && typeof item.startSec === 'number' && typeof item.endSec === 'number'
                ? `#t=${Math.floor(item.startSec)},${Math.floor(item.endSec)}`
                : '';
            return {
              ...item,
              croppedUrl: baseUrl ? `${baseUrl}${trimHash}` : ''
            };
          })
        );
      };
      req.onerror = () => resolve([]);
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

const readVideoMetadata = (file) =>
  new Promise((resolve) => {
    try {
      if (!(file instanceof Blob)) return resolve({ duration: 30 });
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
        URL.revokeObjectURL(url);
        resolve({ duration: dur });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ duration: 30 });
      };
      video.src = url;
    } catch {
      resolve({ duration: 30 });
    }
  });

const buildClipPackage = (
  rawTopic,
  index = 0,
  partLabel = '',
  watermarkText = 'Developed by shortspilot.in',
  durationLabel = '',
  hookText = ''
) => {
  const cleanTopic = (rawTopic || 'Insane Viral Moment').trim();
  const title = partLabel ? `${cleanTopic} (${partLabel})` : cleanTopic;

  const hookLines = [
    `Watch till the end for ${cleanTopic} — this moment catches you completely off guard.`,
    `High-retention highlight from ${cleanTopic} crafted for fast vertical Shorts discovery.`,
    `Blink and you might miss what happens next in ${cleanTopic}.`,
    `Pure highlight energy from ${cleanTopic} — clipped for quick mobile viewing.`,
    `Unexpected turn in ${cleanTopic} that keeps viewers hooked till the final second.`
  ];

  const tagPools = [
    ['#Shorts', '#ViralShorts', '#TrendingNow'],
    ['#YouTubeShorts', '#MustWatch', '#ShortClip'],
    ['#ShortsFeed', '#ViralClip', '#ForYou'],
    ['#DailyShorts', '#Highlight', '#TrendingShorts'],
    ['#QuickWatch', '#ViralMoment', '#ShortsCreator']
  ];

  const words = cleanTopic
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 3)
    .map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);

  const pool = tagPools[index % tagPools.length];
  const combinedTags = Array.from(new Set([...words, ...pool])).slice(0, 5);
  const hashtags = combinedTags.join(' ');

  const openingLine = hookLines[index % hookLines.length];
  const metaBits = [
    partLabel ? `Segment: ${partLabel}` : 'Format: 9:16 Vertical Short',
    durationLabel ? `Length: ${durationLabel}` : '',
    hookText ? `Hook: ${hookText}` : ''
  ]
    .filter(Boolean)
    .join(' • ');

  const description = [
    title,
    '',
    openingLine,
    metaBits ? `\n${metaBits}` : '',
    '',
    hashtags,
    '',
    watermarkText
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const hookScore = `${Math.min(99, 88 + ((index * 3) % 10))}/100`;

  return {
    title,
    category: 'Shorts',
    hashtags,
    description,
    watermarkText,
    websiteUrl: 'https://shortspilot.in',
    hookScore
  };
};

const buildThumbnailConcepts = (topic = 'VIRAL') => {
  const clean = (topic || 'VIRAL').trim().toUpperCase().slice(0, 18);
  return [
    {
      id: 't1',
      badge: 'HIGH CTR',
      hookText: 'WAIT FOR END 😱',
      subText: clean,
      accentText: 'text-amber-300',
      ctrScore: '9.6 CTR',
      gradient: 'from-pink-600 via-purple-900 to-slate-950',
      palette: ['#db2777', '#581c87', '#020617']
    },
    {
      id: 't2',
      badge: 'TRENDING',
      hookText: 'INSANE CLUTCH 🔥',
      subText: clean,
      accentText: 'text-cyan-300',
      ctrScore: '9.4 CTR',
      gradient: 'from-cyan-600 via-blue-950 to-slate-950',
      palette: ['#0891b2', '#172554', '#020617']
    },
    {
      id: 't3',
      badge: 'VIRAL',
      hookText: 'NO WAY!! 🤯',
      subText: clean,
      accentText: 'text-rose-300',
      ctrScore: '9.2 CTR',
      gradient: 'from-amber-500 via-rose-900 to-slate-950',
      palette: ['#f59e0b', '#881337', '#020617']
    }
  ];
};

const ClipActionShortcuts = React.memo(({ clip, onPreview, onCopyDescription }) => {
  const youtubeShortUrl = clip?.youtubeVideoId
    ? `https://www.youtube.com/shorts/${clip.youtubeVideoId}`
    : 'https://studio.youtube.com/channel/UC/videos/short';

  return (
    <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onPreview?.(clip)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/40 text-purple-200 text-[10.5px] font-extrabold cursor-pointer transition"
      >
        <Play className="w-3 h-3 fill-purple-200" />
        <span>Watch Clip</span>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCopyDescription?.(clip)}
          title="Copy Description & #Tags"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-300 text-[10.5px] font-bold cursor-pointer transition"
        >
          <Copy className="w-3 h-3" />
          <span>Copy Desc</span>
        </button>

        <a
          href={youtubeShortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600/25 hover:bg-red-600/40 border border-red-400/40 text-red-200 text-[10.5px] font-extrabold transition"
        >
          <Youtube className="w-3.5 h-3.5 text-red-400" />
          <span>{clip?.youtubeVideoId ? 'Open Short' : 'YT Shorts'}</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>
    </div>
  );
});

const ChannelAvatarBadge = React.memo(({ googleUser, sizeClass = 'w-10 h-10' }) => {
  const safeAvatar = sanitizeMediaUrl(googleUser?.avatar);
  if (googleUser?.email && safeAvatar) {
    return (
      <div className="relative shrink-0">
        <img
          src={safeAvatar}
          alt={googleUser?.name || googleUser?.email || 'Google Account'}
          className={`${sizeClass} rounded-full object-cover border-2 border-emerald-400 shadow-md`}
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090614]" />
      </div>
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0`}
    >
      <Youtube className="w-5 h-5 text-red-500" />
    </div>
  );
});

const GoogleUserLogo = React.memo(({ googleUser, onClick }) => {
  const safeAvatar = sanitizeMediaUrl(googleUser?.avatar);
  return (
    <button
      type="button"
      onClick={onClick}
      title={googleUser?.email ? `${googleUser.email} (Google Connected)` : 'Connect Google'}
      className="w-9 h-9 rounded-full bg-white p-[1.5px] flex items-center justify-center cursor-pointer overflow-hidden shadow shrink-0"
    >
      {safeAvatar ? (
        <img
          src={safeAvatar}
          alt="Google Profile"
          className="w-full h-full rounded-full object-cover"
        />
      ) : googleUser?.email ? (
        <span className="w-full h-full rounded-full bg-[#4285F4] text-white text-xs font-black flex items-center justify-center uppercase">
          {googleUser.email[0]}
        </span>
      ) : (
        <span className="text-sm font-black text-[#4285F4] leading-none">G</span>
      )}
    </button>
  );
});

const DesktopSidebar = React.memo(
  ({
    activeTab,
    setActiveTab,
    onTriggerUpload,
    onOpenSplitter,
    onOpenThumbnail,
    onOpenPricing,
    onOpenAdmin,
    onGoogleLogin,
    onGoogleLogout,
    isGoogleConnected,
    isLoggingIn,
    googleUser,
    monthlyPrice,
    yearlyPrice,
    videoCount
  }) => (
    <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[#090614] border-r border-purple-500/20 p-5 sticky top-0 h-screen z-30">
      <div className="space-y-5">
        <div onClick={() => setActiveTab('home')} className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center text-lg font-extrabold tracking-tight leading-none">
              <span className="text-white">Shorts</span>
              <span className="text-pink-400">Pilot AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">shortspilot.in • PC Studio</p>
          </div>
        </div>

        <div
          onClick={() => (!isGoogleConnected ? onGoogleLogin() : setActiveTab('settings'))}
          className={`p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
            isGoogleConnected
              ? 'bg-emerald-500/10 border-emerald-400/50'
              : 'bg-[#120c24] border-amber-400/50 hover:border-cyan-400/60'
          }`}
        >
          <ChannelAvatarBadge googleUser={googleUser} sizeClass="w-10 h-10" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white truncate">
              {isLoggingIn
                ? 'Connecting...'
                : isGoogleConnected
                ? googleUser?.name || googleUser?.email
                : 'Connect Google'}
            </div>
            <div
              className={`text-[10px] font-bold truncate ${
                isGoogleConnected ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {isGoogleConnected ? '✅ Connected' : 'Click for Google Popup'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload & Auto-Post Short</span>
        </button>

        <div className="space-y-1.5 text-xs font-bold">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 pb-1">
            PC Workspace
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'home'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <ChartIcon className="w-4 h-4" />
            <span>Channel Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'projects'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4" />
              <span>Queue Vault</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-[10px] text-purple-200">
              {videoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Profile & Settings</span>
          </button>

          <div className="text-[10px] uppercase tracking-wider text-slate-500 px-2 pt-3 pb-1">
            AI Studio Tools
          </div>

          <button
            type="button"
            onClick={onOpenSplitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-pink-300 hover:bg-pink-500/15 cursor-pointer transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span>AI Clip Cutter (1, 3, 5)</span>
          </button>

          <button
            type="button"
            onClick={onOpenThumbnail}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cyan-300 hover:bg-cyan-500/15 cursor-pointer transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span>9:16 Thumbnail Preset</span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-purple-500/20">
        <button
          type="button"
          onClick={onOpenPricing}
          className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/50 text-left cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-amber-300">
            <span>VIP Offer Active</span>
            <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-[10px] text-slate-300 mt-1">
            ₹{monthlyPrice}/mo • ₹{yearlyPrice}/yr
          </div>
        </button>

        {isGoogleConnected && (
          <button
            type="button"
            onClick={onGoogleLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/25"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Google</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenAdmin}
          className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer hover:bg-purple-600/30"
        >
          🔐 Owner Admin Console
        </button>
        <div className="text-[9.5px] text-center text-slate-500 font-mono">
          Developed by shortspilot.in
        </div>
      </div>
    </aside>
  )
);

const TopHeader = React.memo(
  ({
    tier,
    hasUnread,
    googleUser,
    isGoogleConnected,
    isLoggingIn,
    onOpenDrawer,
    onGoHome,
    onOpenPricing,
    onOpenNotifications,
    onGoogleLogin,
    onGoogleLogout,
    onOpenSettings
  }) => (
    <header className="flex items-center justify-between px-4 lg:px-8 pt-4 pb-3 bg-[#090614]/95 backdrop-blur sticky top-0 z-30 border-b border-purple-500/15">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="lg:hidden p-1.5 rounded-xl text-slate-200 hover:text-white cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div onClick={onGoHome} className="flex lg:hidden items-center gap-2 cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center text-[17px] font-extrabold tracking-tight leading-none">
              <span className="text-white">Shorts</span>
              <span className="text-pink-400">Pilot AI</span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">
              Developed by shortspilot.in
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2.5">
          <span
            className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${
              isGoogleConnected
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
            }`}
          >
            {isGoogleConnected ? '● Google Connected ✅' : '● Connect Google Popup'}
          </span>
          <span className="text-xs text-slate-400">
            Brand: <b className="text-cyan-300 font-mono">Developed by shortspilot.in</b>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isGoogleConnected ? (
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoggingIn}
            className="px-3 py-1.5 rounded-full bg-[#4285F4] hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer shadow disabled:opacity-60"
          >
            {isLoggingIn ? 'Connecting...' : 'Connect Google'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoogleLogout}
            title="Disconnect Google"
            className="px-2.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenPricing}
          className="px-3 py-1.5 rounded-full bg-[#1f1608] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{tier === 'pro' ? 'VIP Active' : 'Offer ₹99'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full bg-[#120d24] border border-purple-500/30 text-slate-200 cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
        </button>

        <GoogleUserLogo googleUser={googleUser} onClick={onOpenSettings} />
      </div>
    </header>
  )
);

const MobileBottomNavBar = React.memo(({ activeTab, setActiveTab, onTriggerUpload }) => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#090614] border-t border-purple-500/25 px-3 flex items-center justify-around z-40">
    <button
      type="button"
      onClick={() => setActiveTab('home')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'home' ? 'text-pink-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <Home className="w-5 h-5" />
      <span className="text-[10.5px]">Home</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('analytics')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'analytics' ? 'text-cyan-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <ChartIcon className="w-5 h-5" />
      <span className="text-[10.5px]">Analytics</span>
    </button>
    <div className="relative -top-4">
      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-15 h-15 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-[2px] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      >
        <div className="w-full h-full rounded-full bg-[#160b2e] flex flex-col items-center justify-center px-3 py-2">
          <Plus className="w-6 h-6 text-white" />
          <span className="text-[8.5px] font-extrabold text-white -mt-0.5">Upload</span>
        </div>
      </button>
    </div>
    <button
      type="button"
      onClick={() => setActiveTab('projects')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'projects' ? 'text-purple-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <FolderKanban className="w-5 h-5" />
      <span className="text-[10.5px]">Projects</span>
    </button>
    <button
      type="button"
      onClick={() => setActiveTab('settings')}
      className={`flex flex-col items-center gap-1 py-1 px-3 cursor-pointer ${
        activeTab === 'settings' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
      }`}
    >
      <Settings className="w-5 h-5" />
      <span className="text-[10.5px]">Settings</span>
    </button>
  </nav>
));

export default function App() {
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem('sp_google_user') || localStorage.getItem('shortspilot_google_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  });

  const [youtubeAccessToken, setYoutubeAccessToken] = useState(
    () =>
      localStorage.getItem('sp_yt_access_token') ||
      localStorage.getItem('shortspilot_yt_access_token') ||
      ''
  );

  const [youtubeRefreshToken, setYoutubeRefreshToken] = useState(
    () =>
      localStorage.getItem('sp_yt_refresh_token') ||
      localStorage.getItem('shortspilot_yt_refresh_token') ||
      ''
  );

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isGoogleAccountModalOpen, setIsGoogleAccountModalOpen] = useState(false);
  const [manualGoogleEmail, setManualGoogleEmail] = useState('');
  const [manualGoogleName, setManualGoogleName] = useState('');

  const isGoogleConnected = Boolean(googleUser?.email);

  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sp_global_config') || 'null');
      if (saved && typeof saved === 'object') {
        return {
          ...saved,
          monthlyOriginalPrice: '499',
          monthlyPrice: saved.monthlyPrice || '99',
          yearlyOriginalPrice: '6999',
          yearlyPrice: saved.yearlyPrice || '3999',
          watermarkText: saved.watermarkText || 'Developed by shortspilot.in',
          ownerAlertEmail: saved.ownerAlertEmail || '',
          paymentWebhookUrl: saved.paymentWebhookUrl || ''
        };
      }
    } catch {}
    return {
      receiverUpi: '9767905729@paytm',
      monthlyOriginalPrice: '499',
      monthlyPrice: '99',
      yearlyOriginalPrice: '6999',
      yearlyPrice: '3999',
      couponCode: 'SAVE200',
      couponDiscount: '200',
      freeLimit: 3,
      watermarkText: 'Developed by shortspilot.in',
      ownerAlertEmail: '',
      paymentWebhookUrl: '',
      ytAutoUploadActive: true,
      adminPin: '9767905729'
    };
  });

  const [igData, setIgData] = useState(() => {
    try {
      const reg = readLocalRegistry()['creator@shortspilot.in'];
      if (reg?.igToken) {
        return {
          username: reg.igUsername || '@instagram_user',
          token: reg.igToken,
          connected: true
        };
      }
    } catch {}
    return { username: '', token: '', connected: false };
  });

  const [igUsernameDraft, setIgUsernameDraft] = useState(() => igData.username || '');
  const [igTokenDraft, setIgTokenDraft] = useState(() => igData.token || '');
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [igError, setIgError] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('pro');
  const [videoQueue, setVideoQueue] = useState([]);

  const [clipSplitCount, setClipSplitCount] = useState(3);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);

  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbTopicInput, setThumbTopicInput] = useState('');
  const [selectedThumbConcept, setSelectedThumbConcept] = useState(
    () => buildThumbnailConcepts('VIRAL')[0]
  );
  const [thumbConcepts, setThumbConcepts] = useState(() => buildThumbnailConcepts('VIRAL'));

  const [selectedTimeSlot] = useState(() => {
    const h = new Date().getHours();
    if (h < 13) return '9:00 AM (Nearest VIP Slot)';
    if (h < 18) return '2:00 PM (Nearest VIP Slot)';
    return '7:30 PM (Nearest VIP Slot)';
  });

  const [autoPublishStatus, setAutoPublishStatus] = useState('');
  const [manualPostMode, setManualPostMode] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: 'Auto Thumbnail + YouTube Upload Ready ✅',
      desc: 'Dynamic descriptions, 9:16 thumbnails, and shortcuts are active.',
      unread: true
    }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Namaste! Video upload karte hi 9:16 thumbnail, dynamic description aur YouTube upload run hota hai.'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [upgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  const [checkoutEmail, setCheckoutEmail] = useState(() => googleUser?.email || '');
  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || DEFAULT_FIREBASE_URL
  );
  const [transactions, setTransactions] = useState([]);

  const fileInputRef = useRef(null);
  const splitterInputRef = useRef(null);

  const dbBase = (liveDbUrl || DEFAULT_FIREBASE_URL).trim().replace(/\/$/, '');

  const handleCopyDescription = useCallback((clip) => {
    if (clip?.description && navigator.clipboard) {
      navigator.clipboard.writeText(clip.description).catch(() => {});
    }
  }, []);

  const applyConnectedGoogleProfile = useCallback((profile, tokens = {}) => {
    const userPayload = {
      name: profile.name || 'YouTube Creator',
      email: profile.email,
      avatar: profile.avatar || '',
      channelId: profile.channelId || '',
      connectedAt: Date.now()
    };

    setGoogleUser(userPayload);
    setCheckoutEmail((prev) => prev || profile.email);
    try {
      localStorage.setItem('sp_google_user', JSON.stringify(userPayload));
      localStorage.setItem('shortspilot_google_user', JSON.stringify(userPayload));
    } catch {}

    if (tokens.accessToken) {
      setYoutubeAccessToken(tokens.accessToken);
      try {
        localStorage.setItem('sp_yt_access_token', tokens.accessToken);
        localStorage.setItem('shortspilot_yt_access_token', tokens.accessToken);
      } catch {}
    }

    if (tokens.refreshToken) {
      setYoutubeRefreshToken(tokens.refreshToken);
      try {
        localStorage.setItem('sp_yt_refresh_token', tokens.refreshToken);
        localStorage.setItem('shortspilot_yt_refresh_token', tokens.refreshToken);
      } catch {}
    }

    saveLocalRegistry(profile.email, {
      name: userPayload.name,
      avatar: userPayload.avatar,
      channelId: userPayload.channelId
    });

    setLoginError('');
    setIsGoogleAccountModalOpen(false);
  }, []);

  const startGoogleLogin = useCallback(() => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const origin =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? window.location.origin
          : FIXED_OAUTH_ORIGIN;
      const payload = { cid: GOOGLE_CLIENT_ID, origin };
      if (GOOGLE_CLIENT_SECRET) payload.csec = GOOGLE_CLIENT_SECRET;
      const statePayload = btoa(JSON.stringify(payload));
      const redirectUri = encodeURIComponent(`${origin}/api/youtube/callback`);
      const scope = encodeURIComponent(
        'openid email profile https://www.googleapis.com/auth/youtube.upload'
      );
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        GOOGLE_CLIENT_ID
      )}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${encodeURIComponent(
        statePayload
      )}`;
      window.location.href = authUrl;
    } catch {
      setIsLoggingIn(false);
      setIsGoogleAccountModalOpen(true);
    }
  }, []);

  const logoutGoogle = useCallback(() => {
    setGoogleUser(null);
    setYoutubeAccessToken('');
    setYoutubeRefreshToken('');
    setLoginError('');
    try {
      localStorage.removeItem('sp_google_user');
      localStorage.removeItem('shortspilot_google_user');
      localStorage.removeItem('sp_yt_access_token');
      localStorage.removeItem('shortspilot_yt_access_token');
      localStorage.removeItem('sp_yt_refresh_token');
      localStorage.removeItem('shortspilot_yt_refresh_token');
    } catch {}
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!youtubeRefreshToken) return '';
    try {
      const res = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: youtubeRefreshToken,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET
        })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setYoutubeAccessToken(data.access_token);
        try {
          localStorage.setItem('sp_yt_access_token', data.access_token);
          localStorage.setItem('shortspilot_yt_access_token', data.access_token);
        } catch {}
        return data.access_token;
      }
    } catch {}
    return '';
  }, [youtubeRefreshToken]);

  const uploadClipToYouTube = useCallback(
    async (clip) => {
      let token = youtubeAccessToken;
      if (!token && youtubeRefreshToken) {
        token = await refreshAccessToken();
      }
      if (!token) {
        return { uploaded: false, reason: 'Connect Google for Auto-Post' };
      }
      if (!(clip?.blob instanceof Blob)) {
        return { uploaded: false, reason: 'No video blob' };
      }

      const metadata = {
        snippet: {
          title: `${clip.title} #Shorts`.slice(0, 100),
          description: clip.description,
          categoryId: '22'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      };

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', clip.blob, `${clip.title}.mp4`);

      let res = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        }
      );

      if (res.status === 401) {
        const fresh = await refreshAccessToken();
        if (fresh) {
          res = await fetch(
            'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart',
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${fresh}` },
              body: form
            }
          );
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'YouTube upload failed');
      }

      const data = await res.json();
      const videoId = data?.id || '';

      if (videoId && clip.thumbnailBlob instanceof Blob) {
        try {
          await fetch(
            `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(
              videoId
            )}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'image/png'
              },
              body: clip.thumbnailBlob
            }
          );
        } catch {}
      }

      return { uploaded: true, videoId };
    },
    [youtubeAccessToken, youtubeRefreshToken, refreshAccessToken]
  );

  useEffect(() => {
    let active = true;
    idbGetAllClips().then((clips) => {
      if (active && clips.length > 0) {
        setVideoQueue(clips);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthErr = params.get('error');
    if (oauthErr) {
      setLoginError(`Google Auth Error: ${decodeURIComponent(oauthErr)}`);
      setIsLoggingIn(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (window.location.hash && window.location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || '';
      window.history.replaceState({}, document.title, window.location.pathname);

      if (accessToken) {
        setIsLoggingIn(true);
        Promise.all([
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }).then((r) => (r.ok ? r.json() : null)),
          fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        ])
          .then(([info, ytData]) => {
            const ytItem = ytData?.items?.[0];
            const ytChannel = ytItem?.snippet;
            if (info?.email) {
              applyConnectedGoogleProfile(
                {
                  name: ytChannel?.title || info.name,
                  email: info.email,
                  avatar: ytChannel?.thumbnails?.default?.url || info.picture,
                  channelId: ytItem?.id || ''
                },
                { accessToken, refreshToken }
              );
            } else {
              setLoginError('Could not read Google profile. Please try again.');
              setIsGoogleAccountModalOpen(true);
            }
          })
          .catch(() => {
            setLoginError('Network error while connecting Google profile.');
            setIsGoogleAccountModalOpen(true);
          })
          .finally(() => setIsLoggingIn(false));
      }
    }
  }, [applyConnectedGoogleProfile]);

  const fetchFirebaseData = useCallback(async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes] = await Promise.all([
        fetch(`${dbBase}/siteConfig.json`),
        fetch(`${dbBase}/transactions.json`)
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData && typeof cfgData === 'object') {
        setGlobalConfig((prev) => ({
          ...prev,
          ...cfgData,
          monthlyOriginalPrice: '499',
          monthlyPrice: cfgData.monthlyPrice || '99',
          yearlyOriginalPrice: '6999',
          yearlyPrice: cfgData.yearlyPrice || '3999',
          watermarkText: cfgData.watermarkText || 'Developed by shortspilot.in'
        }));
      }
      const txnData = await txnRes.json();
      setTransactions(
        txnData && typeof txnData === 'object'
          ? Object.entries(txnData)
              .map(([k, v]) => ({ firebaseKey: k, ...v }))
              .reverse()
          : []
      );
    } catch {}
  }, [dbBase]);

  useEffect(() => {
    fetchFirebaseData();
  }, [fetchFirebaseData]);

  const handleSaveInstagramToken = async (e) => {
    e?.preventDefault();
    setIgError('');
    const cleanToken = (igTokenDraft || '').trim();
    const rawUser = (igUsernameDraft || '').trim() || '@instagram_creator';
    const formattedUser = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;

    if (!cleanToken || cleanToken.length < 6) {
      return setIgError('Enter a valid Instagram Token.');
    }

    setIgData({
      username: formattedUser,
      token: cleanToken,
      connected: true
    });
    saveLocalRegistry((googleUser?.email || 'creator@shortspilot.in').toLowerCase(), {
      igUsername: formattedUser,
      igToken: cleanToken
    });
    setIsIgModalOpen(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setLoginError('');
    setAutoPublishStatus('Generating 9:16 Thumbnail, Description & Auto-Posting...');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const detectedTopic = detectTopicFromFile(file.name);
      const meta = await readVideoMetadata(file);
      const durLabel = formatClockTime(meta.duration);
      const hookLabel = selectedThumbConcept?.hookText || 'WAIT FOR END 😱';
      const watermark = globalConfig.watermarkText || 'Developed by shortspilot.in';
      const aiMeta = buildClipPackage(detectedTopic, i, '', watermark, durLabel, hookLabel);
      const thumb = await generateThumbnailBlob({
        hookText: hookLabel,
        subText: detectedTopic,
        watermarkText: watermark,
        palette: selectedThumbConcept?.palette
      });
      const objectUrl = URL.createObjectURL(file);

      let clipStatus = manualPostMode ? 'Manual Ready' : 'Queued for Auto-Post';
      let youtubeVideoId = '';

      if (!manualPostMode) {
        try {
          const ytRes = await uploadClipToYouTube({
            ...aiMeta,
            blob: file,
            thumbnailBlob: thumb.blob
          });
          if (ytRes.uploaded) {
            youtubeVideoId = ytRes.videoId || '';
            clipStatus = `Uploaded to YT (${youtubeVideoId || 'Done'}) ✅`;
          } else {
            clipStatus = 'Queued (Connect Google for Auto-Post)';
          }
        } catch (err) {
          clipStatus = `Queued (${err.message})`;
        }
      }

      const readyClip = {
        id: `${Date.now()}-${Math.random()}`,
        title: aiMeta.title,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        thumbnailHook: hookLabel,
        thumbnailGradient:
          selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        thumbnailDataUrl: thumb.dataUrl,
        thumbnailBlob: thumb.blob,
        youtubeVideoId,
        status: clipStatus,
        hookScore: aiMeta.hookScore,
        duration: durLabel,
        croppedUrl: objectUrl,
        blob: file
      };

      setVideoQueue((prev) => [readyClip, ...prev]);
      await idbSaveClip(readyClip);
    }
    setAutoPublishStatus('');
  };

  const handleSplitFullVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsSplitterModalOpen(false);
    setLoginError('');
    const count = Number(clipSplitCount) || 3;
    setAutoPublishStatus(`Generating 9:16 Thumbnails & Cutting ${count} Clips...`);

    const detectedTopic = detectTopicFromFile(file.name);
    const meta = await readVideoMetadata(file);
    const totalDur = Math.max(15, meta.duration || 60);
    const segDur = Math.max(5, Math.floor(totalDur / count));
    const baseObjectUrl = URL.createObjectURL(file);
    const watermark = globalConfig.watermarkText || 'Developed by shortspilot.in';
    const hookLabel = selectedThumbConcept?.hookText || 'WAIT FOR END 😱';
    const generated = [];

    for (let i = 0; i < count; i++) {
      const startSec = Math.floor(i * segDur);
      const endSec =
        i === count - 1 ? Math.floor(totalDur) : Math.min(Math.floor(totalDur), startSec + segDur);
      const clipLength = Math.max(1, endSec - startSec);
      const durLabel = formatClockTime(clipLength);
      const timeRangeLabel = `${formatClockTime(startSec)}–${formatClockTime(endSec)}`;
      const partLabel = count > 1 ? `Part ${i + 1}/${count}` : '';
      const aiMeta = buildClipPackage(
        detectedTopic,
        i,
        partLabel,
        watermark,
        durLabel,
        hookLabel
      );
      const thumb = await generateThumbnailBlob({
        hookText: hookLabel,
        subText: `${detectedTopic} ${partLabel}`.trim(),
        watermarkText: watermark,
        palette: selectedThumbConcept?.palette
      });

      let clipStatus = manualPostMode
        ? `Cut Ready (${timeRangeLabel})`
        : `Cut Clip (${timeRangeLabel})`;
      let youtubeVideoId = '';

      if (!manualPostMode) {
        try {
          const ytRes = await uploadClipToYouTube({
            ...aiMeta,
            blob: file,
            thumbnailBlob: thumb.blob
          });
          if (ytRes.uploaded) {
            youtubeVideoId = ytRes.videoId || '';
            clipStatus = `Uploaded (${youtubeVideoId || timeRangeLabel}) ✅`;
          } else {
            clipStatus = `Cut Ready • Connect Google (${timeRangeLabel})`;
          }
        } catch (err) {
          clipStatus = `Cut Ready • ${err.message}`;
        }
      }

      const clipItem = {
        id: `${Date.now()}-${Math.random()}-${i}`,
        title: aiMeta.title,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        thumbnailHook: hookLabel,
        thumbnailGradient:
          selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        thumbnailDataUrl: thumb.dataUrl,
        thumbnailBlob: thumb.blob,
        youtubeVideoId,
        status: clipStatus,
        hookScore: aiMeta.hookScore,
        duration: durLabel,
        croppedUrl: `${baseObjectUrl}#t=${startSec},${endSec}`,
        blob: file,
        startSec,
        endSec
      };

      generated.push(clipItem);
      await idbSaveClip(clipItem);
    }

    setVideoQueue((prev) => [...generated, ...prev]);
    setAutoPublishStatus('');
  };

  const handleGenerateThumbnails = (e) => {
    e.preventDefault();
    const updated = buildThumbnailConcepts(thumbTopicInput || 'VIRAL');
    setThumbConcepts(updated);
    setSelectedThumbConcept(updated[0]);
  };

  const handleDeleteClip = async (clipId) => {
    const target = videoQueue.find((c) => c.id === clipId);
    if (target?.croppedUrl && target.croppedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.croppedUrl.split('#')[0]);
    }
    setVideoQueue((prev) => prev.filter((item) => item.id !== clipId));
    await idbDeleteClip(clipId);
  };

  const handleClearAllClips = async () => {
    videoQueue.forEach((c) => {
      if (c.croppedUrl && c.croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(c.croppedUrl.split('#')[0]);
      }
    });
    setVideoQueue([]);
    await idbClearAllClips();
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');
    const cleanEmail = (checkoutEmail || googleUser?.email || '').trim().toLowerCase();
    if (!cleanEmail) return setCheckoutError('Enter your Gmail ID first.');
    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Enter valid 12-digit UTR number.');

    const amt =
      selectedBilling === 'yearly'
        ? Number(globalConfig.yearlyPrice || 3999)
        : Number(globalConfig.monthlyPrice || 99);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: cleanEmail,
      userKey: emailToKey(cleanEmail),
      plan: selectedBilling,
      utr: cleanUtr,
      numericAmount: amt,
      amount: `₹${amt} (${selectedBilling})`,
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

    setTransactions((prev) => [newTxn, ...prev]);
    setCheckoutPendingMsg('⏳ UTR Submitted! VIP will activate after verification.');
    setUtrNumber('');
  };

  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const msg = supportInput.trim();
    setSupportMessages((prev) => [
      ...prev,
      { role: 'user', text: msg },
      {
        role: 'ai',
        text: 'Video upload karte hi 9:16 thumbnail, dynamic description aur YouTube upload auto run hota hai.'
      }
    ]);
    setSupportInput('');
  };

  const totalPostedCount = useMemo(() => videoQueue.length, [videoQueue.length]);

  return (
    <div className="min-h-screen w-full bg-[#05030a] text-slate-100 font-sans flex selection:bg-pink-500 selection:text-white">
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onOpenSplitter={() => setIsSplitterModalOpen(true)}
        onOpenThumbnail={() => setIsThumbnailModalOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onGoogleLogin={startGoogleLogin}
        onGoogleLogout={logoutGoogle}
        isGoogleConnected={isGoogleConnected}
        isLoggingIn={isLoggingIn}
        googleUser={googleUser}
        monthlyPrice={globalConfig.monthlyPrice || '99'}
        yearlyPrice={globalConfig.yearlyPrice || '3999'}
        videoCount={videoQueue.length}
      />

      <div className="flex-1 min-h-screen bg-[#070510] text-white flex flex-col">
        <TopHeader
          tier={tier}
          hasUnread={notificationsList.some((n) => n.unread)}
          googleUser={googleUser}
          isGoogleConnected={isGoogleConnected}
          isLoggingIn={isLoggingIn}
          onOpenDrawer={() => setIsSettingsDrawerOpen(true)}
          onGoHome={() => setActiveTab('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
          }}
          onGoogleLogin={startGoogleLogin}
          onGoogleLogout={logoutGoogle}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {loginError && (
          <div className="mx-4 lg:mx-8 mt-2 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-bold">
            {loginError}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <input
          ref={splitterInputRef}
          type="file"
          accept="video/*"
          onChange={handleSplitFullVideo}
          className="hidden"
        />

        <div className="flex-1 w-full max-w-[460px] lg:max-w-6xl mx-auto px-4 lg:px-8 pt-3 lg:pt-6 pb-28 lg:pb-12 space-y-4 lg:space-y-6">
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-pink-600/20 border border-amber-400/50 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs lg:text-sm font-extrabold text-amber-300 truncate">
                        Auto-Post + Thumbnail Active
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-200">
                        Dynamic Desc • 9:16 Thumb • shortspilot.in
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    PRO
                  </span>
                </div>

                {isGoogleConnected ? (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-purple-600/20 to-cyan-600/20 border border-emerald-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChannelAvatarBadge googleUser={googleUser} sizeClass="w-10 h-10" />
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>{googleUser?.name || 'Google Account'}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[9.5px] font-extrabold">
                            Connected ✅
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-300 truncate">
                          {googleUser?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-red-600/20 via-purple-600/20 to-amber-600/20 border border-amber-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChannelAvatarBadge googleUser={googleUser} sizeClass="w-10 h-10" />
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>Google & YouTube</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/25 text-cyan-300 text-[9px] font-extrabold">
                            AUTO
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-300 truncate">
                          One-click Google account popup
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startGoogleLogin}
                      disabled={isLoggingIn}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] hover:bg-blue-500 text-white text-[11px] lg:text-xs font-extrabold cursor-pointer shrink-0 shadow-lg disabled:opacity-60"
                    >
                      {isLoggingIn ? 'Connecting...' : 'Connect Google'}
                    </button>
                  </div>
                )}

                {igData.connected ? (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-amber-500/15 border border-pink-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>{igData.username}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[9.5px] font-extrabold">
                            Connected ✅
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-pink-200/80 truncate">
                          Token saved
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-fuchsia-600/15 via-pink-600/15 to-amber-500/15 border border-pink-500/35 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                        <Instagram className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>Instagram</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9.5px] font-extrabold">
                            Pending ⏳
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-400 truncate">
                          Add token anytime with minimal setup
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsIgModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[10.5px] font-extrabold cursor-pointer shrink-0"
                    >
                      Add Token
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
                <div className="rounded-[28px] p-5 lg:p-6 bg-gradient-to-br from-[#2a104e] via-[#150a2e] to-[#0c071d] border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)] relative overflow-hidden flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="max-w-[65%] space-y-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-[9.5px] font-extrabold text-pink-300">
                        <Zap className="w-3 h-3 text-pink-400" /> Shorts Feed Engine
                      </span>
                      <h2 className="text-[22px] lg:text-[26px] font-extrabold text-white leading-[1.15] tracking-tight">
                        Publish to <br />
                        YouTube{' '}
                        <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                          Shorts
                        </span>
                      </h2>
                      <p className="text-[10.5px] lg:text-xs text-slate-300 font-medium">
                        Mode: {manualPostMode ? 'Manual Post' : selectedTimeSlot}
                      </p>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600/30 to-pink-600/30 border border-purple-400/50 flex items-center justify-center relative cursor-pointer shadow-xl shrink-0 group"
                    >
                      <span className="absolute -top-1 right-0 px-2 py-0.5 rounded-md bg-cyan-500 text-[9px] font-extrabold text-black">
                        SHORT
                      </span>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {autoPublishStatus && (
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold text-center animate-pulse">
                      {autoPublishStatus}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 lg:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs lg:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {manualPostMode ? 'Upload to Manual Vault' : 'Upload & Auto-Post to Shorts Feed'}
                    </span>
                  </button>
                </div>

                <div className="p-4 lg:p-6 rounded-[28px] bg-gradient-to-br from-[#231042] via-[#150b29] to-[#0c1428] border border-pink-500/50 flex flex-col justify-between space-y-3 shadow-[0_0_25px_rgba(236,72,153,0.22)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl bg-pink-500/25 border border-pink-400/50 flex items-center justify-center shrink-0">
                        <Scissors className="w-5 h-5 text-pink-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm lg:text-base font-extrabold text-white truncate">
                            AI Engaging Clips
                          </h3>
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/30 text-[8.5px] font-extrabold text-pink-200">
                            AUTO CUT
                          </span>
                        </div>
                        <p className="text-[10.5px] lg:text-xs text-slate-300">
                          Cut 1, 3, or 5 clips from any long video
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSplitterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-extrabold cursor-pointer shadow-md shrink-0"
                    >
                      Open Cutter
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setClipSplitCount(num)}
                        className={`py-2 lg:py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                          clipSplitCount === num
                            ? 'bg-pink-500/30 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.35)]'
                            : 'bg-[#0b0718] border-slate-800 text-slate-400'
                        }`}
                      >
                        {num} {num === 1 ? 'Clip' : 'Clips'}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => splitterInputRef.current?.click()}
                    className="w-full py-2.5 lg:py-3.5 px-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs lg:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>
                      Select Long Video & Cut {clipSplitCount} {clipSplitCount === 1 ? 'Clip' : 'Clips'} Now
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5">
                <div className="p-4 rounded-[24px] bg-gradient-to-r from-[#0e1a2b] to-[#1a0c2e] border border-cyan-500/40 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">9:16 Auto Thumbnail</h3>
                      <p className="text-[10.5px] text-slate-300">
                        Active Hook:{' '}
                        <span className="text-amber-300 font-bold">
                          {selectedThumbConcept?.hookText}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThumbnailModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-[11px] font-extrabold cursor-pointer shadow-md"
                  >
                    Choose Style
                  </button>
                </div>

                <div className="p-4 rounded-[24px] bg-[#130c26] border border-purple-400/35 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Posting Control</h3>
                      <p className="text-[10.5px] text-slate-300">Auto-Post is ON by default</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setManualPostMode(!manualPostMode)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-extrabold cursor-pointer transition-all ${
                      manualPostMode
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                        : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                    }`}
                  >
                    {manualPostMode ? '⚡ Manual Post Active' : '🤖 Auto-Post ON'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:gap-5">
                <div
                  onClick={() => {
                    setSelectedBilling('monthly');
                    setIsPricingOpen(true);
                  }}
                  className="p-3.5 lg:p-5 rounded-2xl bg-gradient-to-b from-[#16102b] to-[#0c0818] border border-cyan-500/50 space-y-2 cursor-pointer hover:border-cyan-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-xs font-extrabold text-cyan-300 uppercase">
                      Monthly Pro
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[8.5px] font-extrabold text-cyan-300">
                      80% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base lg:text-2xl font-extrabold text-white">
                      ₹{globalConfig.monthlyPrice || '99'}
                    </span>
                    <span className="text-[11px] lg:text-sm text-slate-400 line-through">
                      ₹{globalConfig.monthlyOriginalPrice || '499'}
                    </span>
                    <span className="text-[9px] lg:text-xs text-slate-400">/mo</span>
                  </div>
                  <div className="text-xs lg:text-sm font-extrabold text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>50K+ Views</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedBilling('yearly');
                    setIsPricingOpen(true);
                  }}
                  className="p-3.5 lg:p-5 rounded-2xl bg-gradient-to-b from-[#221033] to-[#11081f] border border-amber-500/60 space-y-2 shadow-lg cursor-pointer hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-xs font-extrabold text-amber-300 uppercase">
                      Yearly VIP
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[8.5px] font-extrabold text-amber-300">
                      43% OFF
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base lg:text-2xl font-extrabold text-amber-400">
                      ₹{globalConfig.yearlyPrice || '3999'}
                    </span>
                    <span className="text-[11px] lg:text-sm text-slate-400 line-through">
                      ₹{globalConfig.yearlyOriginalPrice || '6999'}
                    </span>
                    <span className="text-[9px] lg:text-xs text-slate-400">/yr</span>
                  </div>
                  <div className="text-xs lg:text-sm font-extrabold text-white flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>100K+ Views</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setActiveTab('projects')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-blue-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-white">
                    {totalPostedCount}
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Queued Shorts</div>
                </div>
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-purple-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-purple-300">
                    {clipSplitCount} Clips
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Split Mode</div>
                </div>
                <div className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-amber-500/35 text-center">
                  <div className="text-sm lg:text-lg font-extrabold text-amber-400">10/10</div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Pro Score</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs lg:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-pink-400" /> Your Published & Cut Shorts
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    className="text-[11px] lg:text-xs font-bold text-cyan-300 cursor-pointer"
                  >
                    View Vault ({videoQueue.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {videoQueue.slice(0, 6).map((clip) => (
                    <div
                      key={clip.id}
                      className="p-3.5 rounded-2xl bg-[#120c24] border border-purple-500/35 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewClip(clip)}
                            className={`w-12 h-16 rounded-xl bg-gradient-to-b ${
                              clip.thumbnailGradient || 'from-pink-600 to-slate-950'
                            } border border-purple-400/40 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center overflow-hidden`}
                          >
                            {clip.thumbnailDataUrl ? (
                              <img
                                src={sanitizeMediaUrl(clip.thumbnailDataUrl)}
                                alt={clip.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <>
                                <span className="text-[6.5px] font-black text-white leading-tight uppercase">
                                  {clip.thumbnailHook || 'SHORT'}
                                </span>
                                <Play className="w-3.5 h-3.5 text-white fill-white mt-0.5" />
                              </>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4
                              onClick={() => setPreviewClip(clip)}
                              className="text-xs font-extrabold text-white truncate cursor-pointer hover:text-pink-300"
                            >
                              {clip.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                {clip.status}
                              </span>
                              <span className="text-[9px] text-amber-300 font-bold">
                                Hook: {clip.hookScore}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClip(clip.id)}
                          className="p-1.5 text-rose-400 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[9.5px] text-cyan-300/90 font-mono truncate bg-[#080512] px-2.5 py-1.5 rounded-lg border border-slate-800">
                        {clip.hashtags}
                      </div>
                      <ClipActionShortcuts
                        clip={clip}
                        onPreview={setPreviewClip}
                        onCopyDescription={handleCopyDescription}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4 pt-2 max-w-3xl mx-auto">
              <h2 className="text-base lg:text-xl font-extrabold text-white">Channel Analytics</h2>
              <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-1.5 text-xs">
                <div>
                  Google Account: <b>{googleUser?.email || 'Not Connected'}</b>
                </div>
                <div>
                  Google Status:{' '}
                  <b className={isGoogleConnected ? 'text-emerald-400' : 'text-amber-300'}>
                    {isGoogleConnected ? 'Connected ✅' : 'Not Connected'}
                  </b>
                </div>
                <div>
                  YouTube Token:{' '}
                  <b className={youtubeAccessToken ? 'text-emerald-400' : 'text-slate-400'}>
                    {youtubeAccessToken ? 'Active' : 'Not Issued'}
                  </b>
                </div>
                <div>
                  Instagram:{' '}
                  <b className={igData.connected ? 'text-emerald-400' : 'text-amber-300'}>
                    {igData.connected ? `Connected ✅ (${igData.username})` : 'Pending ⏳'}
                  </b>
                </div>
                <div>
                  Total Queued Clips: <b>{totalPostedCount}</b>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base lg:text-xl font-extrabold text-white">
                  Queue Vault ({videoQueue.length})
                </h2>
                {videoQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllClips}
                    className="text-xs text-rose-400 underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {videoQueue.length === 0 ? (
                <div className="p-10 rounded-3xl bg-[#110c22] border border-dashed border-purple-500/30 text-center space-y-3">
                  <p className="text-xs lg:text-sm text-slate-400">Queue Vault is currently empty.</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-xs font-bold text-purple-200 cursor-pointer"
                  >
                    + Upload Short
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {videoQueue.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            onClick={() => setPreviewClip(clip)}
                            className={`w-11 h-14 rounded-lg bg-gradient-to-b ${
                              clip.thumbnailGradient || 'from-pink-600 to-slate-950'
                            } border border-purple-400/30 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center overflow-hidden`}
                          >
                            {clip.thumbnailDataUrl ? (
                              <img
                                src={sanitizeMediaUrl(clip.thumbnailDataUrl)}
                                alt={clip.title}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <>
                                <span className="text-[6px] font-black text-white leading-tight uppercase">
                                  {clip.thumbnailHook || 'SHORT'}
                                </span>
                                <Play className="w-3 h-3 text-white fill-white mt-0.5" />
                              </>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => setPreviewClip(clip)}
                              className="text-xs lg:text-sm font-bold text-white truncate cursor-pointer"
                            >
                              {clip.title}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold">
                              {clip.status} • {clip.duration}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClip(clip.id)}
                          className="p-1.5 text-rose-400 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-sans bg-[#070412] p-2.5 rounded-xl border border-slate-800 max-h-28 overflow-y-auto">
                        {clip.description}
                      </pre>
                      <ClipActionShortcuts
                        clip={clip}
                        onPreview={setPreviewClip}
                        onCopyDescription={handleCopyDescription}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 pt-2 max-w-2xl mx-auto">
              <h2 className="text-base lg:text-xl font-extrabold text-white">
                Profile & Settings
              </h2>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-cyan-500/40 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  {isGoogleConnected
                    ? `Google Connected ✅ (${googleUser?.email})`
                    : 'Connect Google Account with one click.'}
                </div>
                <button
                  type="button"
                  onClick={startGoogleLogin}
                  disabled={isLoggingIn}
                  className="px-4 py-2 rounded-xl bg-[#4285F4] text-white text-xs font-extrabold cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isLoggingIn
                    ? 'Connecting...'
                    : isGoogleConnected
                    ? 'Switch Google'
                    : 'Connect Google'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#110c22] border border-pink-500/35 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5 text-pink-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs lg:text-sm font-extrabold text-white truncate">
                      {igData.connected ? igData.username : 'Instagram Token Connect'}
                    </div>
                    <div className="text-[10px] lg:text-xs text-slate-400 truncate">
                      {igData.connected
                        ? 'Connected ✅'
                        : 'Pending ⏳ — add token easily anytime'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIgModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-extrabold cursor-pointer shrink-0"
                >
                  {igData.connected ? 'Update Token' : 'Add Token'}
                </button>
              </div>

              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={logoutGoogle}
                  className="w-full py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Google Account</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPricingOpen(true)}
                className="w-full py-3 rounded-2xl bg-amber-500 text-black text-xs font-extrabold cursor-pointer shadow-lg"
              >
                🔥 View Offer Plans (₹{globalConfig.monthlyPrice}/mo & ₹{globalConfig.yearlyPrice}/yr)
              </button>

              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                className="w-full py-3 rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer shadow-lg"
              >
                🔐 Open Owner Master Admin Console
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAiSupport(true)}
          aria-label="Floating AI Support"
          className="fixed bottom-22 lg:bottom-6 right-5 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        >
          <Bot className="w-6 h-6" />
        </button>

        <MobileBottomNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      </div>

      {isGoogleAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualGoogleEmail.trim()) return;
              applyConnectedGoogleProfile({
                name: manualGoogleName.trim() || manualGoogleEmail.trim().split('@')[0],
                email: manualGoogleEmail.trim()
              });
              setManualGoogleEmail('');
              setManualGoogleName('');
              setIsGoogleAccountModalOpen(false);
            }}
            className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-cyan-500/50 p-6 space-y-3"
          >
            <button
              type="button"
              onClick={() => setIsGoogleAccountModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white">Connect Google Account</h3>
            <input
              type="text"
              value={manualGoogleName}
              onChange={(e) => setManualGoogleName(e.target.value)}
              placeholder="Channel / Creator Name"
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
            />
            <input
              type="email"
              required
              value={manualGoogleEmail}
              onChange={(e) => setManualGoogleEmail(e.target.value)}
              placeholder="Enter Google Gmail ID"
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#4285F4] text-white font-extrabold text-xs cursor-pointer"
            >
              Save & Connect Google
            </button>
          </form>
        </div>
      )}

      {isIgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <form
            onSubmit={handleSaveInstagramToken}
            className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-pink-500/50 p-6 space-y-3"
          >
            <button
              type="button"
              onClick={() => setIsIgModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-300" /> Instagram Token Connect
            </h3>
            <input
              type="text"
              required
              value={igUsernameDraft}
              onChange={(e) => setIgUsernameDraft(e.target.value)}
              placeholder="@your_instagram"
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-pink-300 font-mono"
            />
            <input
              type="text"
              required
              value={igTokenDraft}
              onChange={(e) => setIgTokenDraft(e.target.value)}
              placeholder="Paste Instagram Token..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-cyan-300 font-mono"
            />
            {igError && <p className="text-xs text-rose-400 font-bold">{igError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Save & Connect Instagram
            </button>
          </form>
        </div>
      )}

      {isThumbnailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/50 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsThumbnailModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-300" />
              <h3 className="text-base font-extrabold text-white">9:16 Shorts Thumbnail Preset</h3>
            </div>

            <form onSubmit={handleGenerateThumbnails} className="flex gap-2">
              <input
                type="text"
                value={thumbTopicInput}
                onChange={(e) => setThumbTopicInput(e.target.value)}
                placeholder="Enter cover label..."
                className="flex-1 px-3 py-2.5 rounded-xl bg-[#06040c] border border-cyan-500/40 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Generate
              </button>
            </form>

            <div className="grid grid-cols-3 gap-2.5">
              {thumbConcepts.map((item) => {
                const isSelected = selectedThumbConcept?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedThumbConcept(item)}
                    className={`aspect-[9/16] rounded-2xl bg-gradient-to-b ${item.gradient} p-2.5 flex flex-col justify-between border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-400 scale-[1.02] shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                        : 'border-white/15 opacity-85'
                    }`}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-[7px] font-extrabold text-white self-start">
                      {item.badge}
                    </span>
                    <div className="text-center space-y-1 my-auto">
                      <div className="text-xs font-black text-white leading-tight drop-shadow">
                        {item.hookText}
                      </div>
                      <div className={`text-[8.5px] font-extrabold ${item.accentText} truncate`}>
                        {item.subText}
                      </div>
                    </div>
                    <div className="text-[7.5px] font-extrabold text-emerald-300 bg-black/50 rounded px-1.5 py-0.5 text-center">
                      {item.ctrScore}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsThumbnailModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Apply Selected 9:16 Thumbnail ({selectedThumbConcept?.hookText})
            </button>
          </div>
        </div>
      )}

      {isSplitterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-pink-500/50 p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsSplitterModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-extrabold text-white">AI Engaging Clips Auto-Splitter</h3>
            </div>
            <p className="text-xs text-slate-300">
              Select how many viral clips you want AI to cut from your full-length video:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setClipSplitCount(count)}
                  className={`py-3 rounded-2xl border text-xs font-extrabold cursor-pointer ${
                    clipSplitCount === count
                      ? 'bg-pink-600 border-pink-400 text-white shadow-lg'
                      : 'bg-[#130c26] border-slate-700 text-slate-300'
                  }`}
                >
                  {count} {count === 1 ? 'Clip' : 'Clips'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => splitterInputRef.current?.click()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-lg"
            >
              Select Full Video & Cut {clipSplitCount} {clipSplitCount === 1 ? 'Clip' : 'Clips'}
            </button>
          </div>
        </div>
      )}

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsPricingOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold">
                LIMITED TIME LAUNCH OFFER
              </span>
              <h3 className="text-base font-extrabold text-white">
                Choose Your ShortsPilot Offer Plan
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedBilling('monthly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer ${
                  selectedBilling === 'monthly'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-[#120d24] border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-extrabold text-cyan-300">MONTHLY PRO</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-extrabold text-white">
                    ₹{globalConfig.monthlyPrice || '99'}
                  </span>
                  <span className="text-xs line-through text-slate-500">₹499</span>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-bold mt-1">
                  50K+ Views Guarantee
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBilling('yearly')}
                className={`p-3 rounded-2xl border text-left cursor-pointer ${
                  selectedBilling === 'yearly'
                    ? 'bg-amber-500/20 border-amber-400 text-white'
                    : 'bg-[#120d24] border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-extrabold text-amber-300">YEARLY VIP</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-extrabold text-amber-400">
                    ₹{globalConfig.yearlyPrice || '3999'}
                  </span>
                  <span className="text-xs line-through text-slate-500">₹6999</span>
                </div>
                <div className="text-[9.5px] text-amber-200 font-bold mt-1">
                  100K+ Views Guarantee
                </div>
              </button>
            </div>

            {upgradeReason && <p className="text-xs text-amber-200">{upgradeReason}</p>}

            <form onSubmit={handleVerifyPayment} className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#120d24] border border-emerald-500/30 text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Pay UPI: <b className="text-emerald-400 font-mono">{globalConfig.receiverUpi}</b>
                </span>
                <span className="font-extrabold text-white">
                  ₹
                  {selectedBilling === 'yearly'
                    ? globalConfig.yearlyPrice || '3999'
                    : globalConfig.monthlyPrice || '99'}
                </span>
              </div>
              <input
                type="email"
                value={checkoutEmail}
                onChange={(e) => setCheckoutEmail(e.target.value)}
                placeholder="Enter Your Gmail ID"
                className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
              />
              <input
                type="tel"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-Digit Payment UTR Number"
                className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white font-mono"
              />
              {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
              {checkoutPendingMsg && <p className="text-xs text-amber-300">{checkoutPendingMsg}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-xs cursor-pointer shadow-lg"
              >
                Submit UTR & Unlock ₹
                {selectedBilling === 'yearly'
                  ? globalConfig.yearlyPrice || '3999'
                  : globalConfig.monthlyPrice || '99'}{' '}
                Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {isSettingsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/75 lg:hidden">
          <div className="w-68 bg-[#0b0818] border-r border-purple-500/30 h-full p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-extrabold text-sm text-white">ShortsPilot AI</span>
                <button
                  type="button"
                  onClick={() => setIsSettingsDrawerOpen(false)}
                  className="text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('home');
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-slate-200 cursor-pointer"
                >
                  Home Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsDrawerOpen(false);
                    startGoogleLogin();
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-[#4285F4] cursor-pointer"
                >
                  {isGoogleConnected ? '✅ Google Connected' : 'Connect Google'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsIgModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-pink-300 flex items-center justify-between cursor-pointer"
                >
                  <span>📸 Instagram</span>
                  <span className="text-[10px] text-amber-300">
                    {igData.connected ? 'Connected ✅' : 'Pending ⏳'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSplitterModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-pink-300 cursor-pointer"
                >
                  ✂️ AI Engaging Clips (1, 3, 5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsThumbnailModalOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-cyan-300 cursor-pointer"
                >
                  🎨 9:16 Shorts Thumbnail Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPricingOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-amber-300 cursor-pointer"
                >
                  🔥 Offer Plans (₹99 / ₹3,999)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('settings');
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-slate-300 cursor-pointer"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-rose-400 cursor-pointer"
                >
                  🔐 Owner Admin Console
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={() => {
                    logoutGoogle();
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              )}
              <div className="text-[10px] text-slate-500">Developed by shortspilot.in</div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsSettingsDrawerOpen(false)} />
        </div>
      )}

      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-6 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-extrabold text-white">Notifications</h3>
            {notificationsList.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-[#130d26] text-xs space-y-1">
                <div className="font-bold text-white">{n.title}</div>
                <p className="text-slate-300 text-[11px]">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[420px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
              <span className="text-xs font-extrabold text-white">ShortsPilot AI Support</span>
              <button
                type="button"
                onClick={() => setShowAiSupport(false)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-3 text-xs">
              {supportMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl ${
                    m.role === 'user'
                      ? 'bg-purple-600 text-white ml-6'
                      : 'bg-[#140e28] text-slate-200 mr-6'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendSupport} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-4 space-y-3 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setPreviewClip(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900 text-white cursor-pointer z-20"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs font-extrabold text-white text-center pr-6 truncate">
              {previewClip.title}
            </div>

            <div className="relative w-full max-w-[230px] mx-auto rounded-2xl overflow-hidden border border-purple-500/40">
              <video
                src={sanitizeMediaUrl(previewClip.croppedUrl)}
                controls
                autoPlay
                playsInline
                className="w-full aspect-[9/16] bg-black"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/65 border border-white/15 text-[8.5px] font-extrabold text-cyan-300 pointer-events-none">
                {previewClip.watermarkText || 'Developed by shortspilot.in'}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="text-[10px] font-extrabold text-pink-300">Description & #Tags:</div>
              <pre className="text-[10px] text-slate-200 whitespace-pre-wrap font-sans bg-[#06040c] p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                {previewClip.description}
              </pre>
            </div>

            <ClipActionShortcuts
              clip={previewClip}
              onPreview={setPreviewClip}
              onCopyDescription={handleCopyDescription}
            />
          </div>
        </div>
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-purple-500/50 p-6 space-y-3 max-h-[88vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-extrabold text-white">🔐 Owner Admin Console</h3>

            {!adminUnlocked ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (adminPinInput.trim() === (globalConfig.adminPin || '9767905729')) {
                    setAdminUnlocked(true);
                    setAdminError('');
                    fetchFirebaseData();
                  } else {
                    setAdminError('Invalid Admin PIN.');
                  }
                }}
                className="space-y-2.5"
              >
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="Enter Admin PIN"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white"
                />
                {adminError && <p className="text-xs text-rose-400">{adminError}</p>}
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  Unlock Admin
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#120d24] border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-300">Pricing & UPI</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={globalConfig.monthlyPrice}
                      onChange={(e) =>
                        setGlobalConfig((prev) => ({ ...prev, monthlyPrice: e.target.value }))
                      }
                      placeholder="Monthly Price"
                      className="px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      value={globalConfig.yearlyPrice}
                      onChange={(e) =>
                        setGlobalConfig((prev) => ({ ...prev, yearlyPrice: e.target.value }))
                      }
                      placeholder="Yearly Price"
                      className="px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={globalConfig.receiverUpi}
                    onChange={(e) =>
                      setGlobalConfig((prev) => ({ ...prev, receiverUpi: e.target.value }))
                    }
                    placeholder="Receiver UPI"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white font-mono"
                  />
                  <input
                    type="text"
                    value={liveDbUrl}
                    onChange={(e) => setLiveDbUrl(e.target.value)}
                    placeholder="Firebase RTDB URL"
                    className="w-full px-2.5 py-2 rounded-lg bg-[#06040c] border border-slate-700 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
                      localStorage.setItem('sp_firebase_url', liveDbUrl);
                      setTier('pro');
                      if (dbBase) {
                        try {
                          await fetch(`${dbBase}/siteConfig.json`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(globalConfig)
                          });
                        } catch {}
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold cursor-pointer"
                  >
                    Save Config
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-amber-300">
                    Transactions ({transactions.length})
                  </div>
                  {transactions.slice(0, 8).map((t, idx) => (
                    <div
                      key={t.firebaseKey || t.id || idx}
                      className="p-2.5 rounded-xl bg-[#120d24] border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <div className="truncate">
                        <b>{t.user}</b> • {t.amount} • UTR: <span className="font-mono">{t.utr}</span>
                      </div>
                      <span className="text-amber-300 font-bold ml-2">{t.status || 'Pending'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
