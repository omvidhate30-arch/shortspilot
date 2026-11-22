import React from 'react';
import { X } from 'lucide-react';
import AdminConsole from './AdminConsole';

export default function AdminConsoleModal({ isOpen = false, onClose = () => {}, ...props }) {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl bg-[#0b0818] border border-purple-500/50 p-5 sm:p-6 space-y-3 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close Admin Console" className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="pr-8">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold">SHORTSPILOT.IN OWNER PANEL</span>
          <h3 className="text-base font-extrabold text-white mt-1">🔐 Owner Master Admin Console</h3>
        </div>
        <AdminConsole {...props} />
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles, Play, Youtube, X, Trash2, Calendar, Clock, Bot, Crown, Bell, Home,
  BarChart2 as ChartIcon, Plus, FolderKanban, Settings, Menu, Zap, TrendingUp,
  Scissors, Image as ImageIcon, Instagram, LogOut, ExternalLink, Copy, FileText, Lock
} from 'lucide-react';
import AdminConsoleModal from './AdminConsoleModal';
import { detectTopicFromFile, buildClipPackage, sendThumbnailPromptToAI } from './aiSeoEngine';

const DEFAULT_FIREBASE_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
const FIXED_OAUTH_ORIGIN = 'https://www.shortspilot.in';
const IDB_NAME = 'ShortsPilotClipsDB';
const IDB_STORE = 'clips';
const RAZORPAY_MONTHLY_LINK = 'https://rzp.io/rzp/MwaHJEUU';
const RAZORPAY_YEARLY_LINK = '';

const DAILY_AUTO_SLOTS = [
  { hour: 9, minute: 0, label: '09:00 AM' },
  { hour: 13, minute: 30, label: '01:30 PM' },
  { hour: 17, minute: 30, label: '05:30 PM' },
  { hour: 21, minute: 0, label: '09:00 PM' }
];

const getNextSlotLabel = (index = 0) => {
  const safeIdx = Math.abs(Number(index) || 0) % DAILY_AUTO_SLOTS.length;
  return `${DAILY_AUTO_SLOTS[safeIdx].label} (Slot ${safeIdx + 1}/4)`;
};

const emailToKey = (email = '') =>
  String(email || '').trim().toLowerCase().replace(/[.#$[\]@]/g, '_');

const sanitizeMediaUrl = (url = '') => {
  if (!url || typeof url !== 'string') return '';
  return url.startsWith('blob:') || url.startsWith('https://') || url.startsWith('http://') || url.startsWith('data:image/') ? url : '';
};

const formatClockTime = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const readVideoMetadata = (file) =>
  new Promise((resolve) => {
    try {
      if (!(file instanceof Blob)) return resolve({ duration: 30, width: 1080, height: 1920 });
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1920;
        URL.revokeObjectURL(url);
        resolve({ duration: dur, width, height });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ duration: 30, width: 1080, height: 1920 });
      };
      video.src = url;
    } catch {
      resolve({ duration: 30, width: 1080, height: 1920 });
    }
  });

const generateThumbnailBlob = async ({
  hookText = 'WAIT FOR END 😱',
  subText = 'VIRAL SHORT',
  watermarkText = 'Developed by shortspilot.in',
  palette = ['#ec4899', '#22d3ee', '#070510'],
  videoBlob = null,
  seekSec = 2
}) => {
  try {
    if (typeof document === 'undefined') return { blob: null, dataUrl: '' };
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { blob: null, dataUrl: '' };

    const [accentA = '#ec4899', accentB = '#22d3ee', baseDark = '#070510'] = palette || [];
    let videoEl = null;
    let vidUrl = '';

    if (videoBlob instanceof Blob && videoBlob.size > 0) {
      try {
        vidUrl = URL.createObjectURL(videoBlob);
        const vid = document.createElement('video');
        vid.muted = true;
        vid.playsInline = true;
        vid.preload = 'auto';
        vid.src = vidUrl;
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 2500);
          vid.onloadedmetadata = () => {
            vid.currentTime = Math.min(Math.max(0.6, Number(seekSec) || 2), Math.max(0.6, (vid.duration || 6) * 0.3));
          };
          vid.onseeked = () => { clearTimeout(timer); resolve(); };
          vid.onerror = () => { clearTimeout(timer); resolve(); };
        });
        if (vid.videoWidth > 0 && vid.videoHeight > 0) videoEl = vid;
        else { URL.revokeObjectURL(vidUrl); vidUrl = ''; }
      } catch {
        if (vidUrl) URL.revokeObjectURL(vidUrl);
        vidUrl = '';
      }
    }

    if (videoEl) {
      ctx.save();
      ctx.filter = 'blur(18px) brightness(0.45) saturate(1.35)';
      const s = Math.max(canvas.width / videoEl.videoWidth, canvas.height / videoEl.videoHeight);
      ctx.drawImage(videoEl, (canvas.width - videoEl.videoWidth * s) / 2, (canvas.height - videoEl.videoHeight * s) / 2, videoEl.videoWidth * s, videoEl.videoHeight * s);
      ctx.restore();
    } else {
      const g = ctx.createRadialGradient(540, 650, 120, 540, 960, 1250);
      g.addColorStop(0, '#2b1055'); g.addColorStop(0.5, '#120826'); g.addColorStop(1, baseDark);
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const orbL = ctx.createRadialGradient(180, 380, 20, 180, 380, 480);
    orbL.addColorStop(0, `${accentA}55`); orbL.addColorStop(1, 'transparent');
    ctx.fillStyle = orbL; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const orbR = ctx.createRadialGradient(900, 1380, 20, 900, 1380, 520);
    orbR.addColorStop(0, `${accentB}4d`); orbR.addColorStop(1, 'transparent');
    ctx.fillStyle = orbR; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pill = ctx.createLinearGradient(76, 92, 366, 158);
    pill.addColorStop(0, '#ff1e56'); pill.addColorStop(1, '#ff7700');
    ctx.fillStyle = pill; ctx.beginPath(); ctx.roundRect(76, 92, 290, 64, 32); ctx.fill();
    ctx.font = '900 30px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚡ TRENDING', 221, 125);

    const fx = 64, fy = 235, fw = 952, fh = 780;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 36); ctx.fillStyle = '#090d16'; ctx.fill(); ctx.clip();
    if (videoEl) {
      const fs = Math.max(fw / videoEl.videoWidth, fh / videoEl.videoHeight);
      ctx.drawImage(videoEl, fx + (fw - videoEl.videoWidth * fs) / 2, fy + (fh - videoEl.videoHeight * fs) / 2, videoEl.videoWidth * fs, videoEl.videoHeight * fs);
    }
    ctx.restore();

    const ban = ctx.createLinearGradient(76, 1110, 1004, 1255);
    ban.addColorStop(0, '#fde047'); ban.addColorStop(0.5, '#facc15'); ban.addColorStop(1, '#fb923c');
    ctx.fillStyle = ban; ctx.beginPath(); ctx.roundRect(76, 1115, 928, 128, 28); ctx.fill();

    ctx.font = '900 64px sans-serif'; ctx.fillStyle = '#070912';
    ctx.fillText(String(hookText || 'WAIT FOR END 😱').trim().toUpperCase().slice(0, 22), 540, 1181);

    ctx.font = '900 54px sans-serif'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(5,7,17,0.95)';
    const subClean = String(subText || 'VIRAL HIGHLIGHT').trim().toUpperCase().slice(0, 28);
    ctx.strokeText(subClean, 540, 1345); ctx.fillStyle = '#fff'; ctx.fillText(subClean, 540, 1345);

    ctx.font = '700 28px monospace'; ctx.fillStyle = 'rgba(226,232,240,0.72)';
    ctx.fillText(watermarkText, 540, 1815);

    if (vidUrl) { try { URL.revokeObjectURL(vidUrl); } catch {} }
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return { blob, dataUrl };
  } catch {
    return { blob: null, dataUrl: '' };
  }
};

const readLocalRegistry = () => {
  try { return JSON.parse(localStorage.getItem('sp_user_registry') || '{}') || {}; } catch { return {}; }
};

const saveLocalRegistry = (email, record) => {
  try {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean) return;
    const curr = readLocalRegistry();
    curr[clean] = { ...(curr[clean] || {}), ...record, email: clean, updatedAt: Date.now() };
    localStorage.setItem('sp_user_registry', JSON.stringify(curr));
  } catch {}
};

let cachedDbPromise = null;
const openClipsDB = () => {
  if (cachedDbPromise) return cachedDbPromise;
  cachedDbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) return reject(new Error('No IDB'));
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { cachedDbPromise = null; reject(req.error); };
  });
  return cachedDbPromise;
};

const idbSaveClip = async (clipObj) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const { croppedUrl, ...persistable } = clipObj;
      tx.objectStore(IDB_STORE).put({ ...persistable, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
};

const idbGetAllClips = async () => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () => {
        const items = (req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        resolve(items.map((item) => {
          const baseUrl = item.blob instanceof Blob ? URL.createObjectURL(item.blob) : '';
          const hash = baseUrl && typeof item.startSec === 'number' && typeof item.endSec === 'number'
            ? `#t=${Math.floor(item.startSec)},${Math.floor(item.endSec)}` : '';
          return { ...item, croppedUrl: baseUrl ? `${baseUrl}${hash}` : '' };
        }));
      };
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
};

const idbDeleteClip = async (id) => {
  try {
    const db = await openClipsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
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

const buildThumbnailConcepts = (topic = 'VIRAL') => {
  const clean = (topic || 'VIRAL').trim().toUpperCase().slice(0, 18);
  return [
    { id: 't1', badge: 'HIGH CTR', hookText: 'WAIT FOR END 😱', subText: clean, accentText: 'text-amber-300', ctrScore: '9.6 CTR', gradient: 'from-pink-600 via-purple-900 to-slate-950', palette: ['#db2777', '#22d3ee', '#070510'] },
    { id: 't2', badge: 'TRENDING', hookText: 'INSANE CLUTCH 🔥', subText: clean, accentText: 'text-cyan-300', ctrScore: '9.4 CTR', gradient: 'from-cyan-600 via-blue-950 to-slate-950', palette: ['#0891b2', '#ec4899', '#070510'] },
    { id: 't3', badge: 'VIRAL', hookText: 'NO WAY!! 🤯', subText: clean, accentText: 'text-rose-300', ctrScore: '9.2 CTR', gradient: 'from-amber-500 via-rose-900 to-slate-950', palette: ['#f59e0b', '#a855f7', '#070510'] }
  ];
};

const ClipActionShortcuts = React.memo(({ clip, onPreview, onCopyDescription, onSendThumbAI }) => (
  <div className="pt-2 mt-1 border-t border-white/10 space-y-1.5">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <button type="button" onClick={() => onPreview?.(clip)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/40 text-purple-200 text-[10.5px] font-extrabold cursor-pointer">
        <Play className="w-3 h-3 fill-purple-200" /><span>Watch Clip</span>
      </button>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onCopyDescription?.(clip)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-cyan-300 text-[10.5px] font-bold cursor-pointer">
          <Copy className="w-3 h-3" /><span>Copy Desc</span>
        </button>
        <a
          href={clip?.youtubeVideoId ? `https://www.youtube.com/shorts/${clip.youtubeVideoId}` : 'https://studio.youtube.com/channel/UC/videos'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600/25 hover:bg-red-600/40 border border-red-400/40 text-red-200 text-[10.5px] font-extrabold"
        >
          <Youtube className="w-3.5 h-3.5 text-red-400" /><span>{clip?.youtubeVideoId ? 'Open Short' : 'YouTube'}</span><ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onSendThumbAI?.(clip, 'gemini')} className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-[10px] font-extrabold cursor-pointer">✨ Gemini Thumb</button>
      <button type="button" onClick={() => onSendThumbAI?.(clip, 'chatgpt')} className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-[10px] font-extrabold cursor-pointer">🤖 ChatGPT Thumb</button>
    </div>
  </div>
));

export default function App() {
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const s = localStorage.getItem('sp_google_user') || localStorage.getItem('shortspilot_google_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [youtubeAccessToken, setYoutubeAccessToken] = useState(() => localStorage.getItem('sp_yt_access_token') || '');
  const [youtubeRefreshToken, setYoutubeRefreshToken] = useState(() => localStorage.getItem('sp_yt_refresh_token') || '');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isAuthGateModalOpen, setIsAuthGateModalOpen] = useState(false);

  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sp_global_config') || 'null');
      if (saved && typeof saved === 'object') {
        return {
          ...saved,
          monthlyOriginalPrice: '499',
          monthlyPrice: saved.monthlyPrice || '99',
          yearlyOriginalPrice: '6999',
          yearlyPrice: saved.yearlyPrice || '1499',
          watermarkText: saved.watermarkText || 'Developed by shortspilot.in',
          blockedEmails: Array.isArray(saved.blockedEmails) ? saved.blockedEmails : [],
          maintenanceMode: Boolean(saved.maintenanceMode),
          announcementBanner: saved.announcementBanner || ''
        };
      }
    } catch {}
    return {
      receiverUpi: '9767905729@paytm',
      monthlyOriginalPrice: '499',
      monthlyPrice: '99',
      yearlyOriginalPrice: '6999',
      yearlyPrice: '1499',
      couponCode: 'SAVE200',
      couponDiscount: '200',
      freeLimit: 3,
      watermarkText: 'Developed by shortspilot.in',
      ytAutoUploadActive: true,
      shortsOnlyMode: true,
      maintenanceMode: false,
      announcementBanner: '',
      blockedEmails: [],
      adminPin: '9767905729'
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('pro');
  const [videoQueue, setVideoQueue] = useState([]);
  const [clipSplitCount, setClipSplitCount] = useState(3);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbTopicInput, setThumbTopicInput] = useState('');
  const [thumbConcepts, setThumbConcepts] = useState(() => buildThumbnailConcepts('VIRAL'));
  const [selectedThumbConcept, setSelectedThumbConcept] = useState(() => buildThumbnailConcepts('VIRAL')[0]);
  const [autoPublishStatus, setAutoPublishStatus] = useState('');
  const [manualPostMode, setManualPostMode] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [checkoutEmail, setCheckoutEmail] = useState(() => googleUser?.email || '');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');
  const [previewClip, setPreviewClip] = useState(null);
  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportInput, setSupportInput] = useState('');
  const [supportMessages, setSupportMessages] = useState([{ role: 'ai', text: 'Namaste! ShortsPilot Shorts (#Shorts) mode par set hai.' }]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [liveDbUrl, setLiveDbUrl] = useState(() => localStorage.getItem('sp_firebase_url') || DEFAULT_FIREBASE_URL);
  const [transactions, setTransactions] = useState([]);

  const fileInputRef = useRef(null);
  const splitterInputRef = useRef(null);
  const isGoogleConnected = Boolean(googleUser?.email);
  const dbBase = (liveDbUrl || DEFAULT_FIREBASE_URL).trim().replace(/\/$/, '');

  const isCurrentUserBlocked = useMemo(() => {
    const em = String(googleUser?.email || '').trim().toLowerCase();
    const blocked = Array.isArray(globalConfig?.blockedEmails)
      ? globalConfig.blockedEmails.map((x) => String(x).trim().toLowerCase())
      : [];
    return Boolean(em && blocked.includes(em));
  }, [googleUser?.email, globalConfig?.blockedEmails]);

  const startGoogleLogin = useCallback(() => {
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : FIXED_OAUTH_ORIGIN;
      const payload = { cid: GOOGLE_CLIENT_ID, origin };
      if (GOOGLE_CLIENT_SECRET) payload.csec = GOOGLE_CLIENT_SECRET;
      const statePayload = btoa(JSON.stringify(payload));
      const redirectUri = encodeURIComponent(`${origin}/api/youtube/callback`);
      const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/youtube.upload');
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&prompt=consent&scope=${scope}&state=${encodeURIComponent(statePayload)}`;
    } catch { setIsLoggingIn(false); }
  }, []);

  const logoutGoogle = useCallback(() => {
    setGoogleUser(null); setYoutubeAccessToken(''); setYoutubeRefreshToken(''); setActiveTab('home');
    ['sp_google_user', 'shortspilot_google_user', 'sp_yt_access_token', 'sp_yt_refresh_token'].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!youtubeRefreshToken) return '';
    try {
      const res = await fetch('/api/youtube/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: youtubeRefreshToken, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET })
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setYoutubeAccessToken(data.access_token);
        try { localStorage.setItem('sp_yt_access_token', data.access_token); } catch {}
        return data.access_token;
      }
    } catch {}
    return '';
  }, [youtubeRefreshToken]);

  const uploadClipToYouTube = useCallback(async (clip) => {
    let token = youtubeAccessToken || (youtubeRefreshToken ? await refreshAccessToken() : '');
    if (!token) return { uploaded: false, videoId: '', error: 'YouTube token missing — Google login karein' };
    const fileBlob = clip?.blob instanceof Blob ? clip.blob : null;
    if (!fileBlob || fileBlob.size === 0) return { uploaded: false, videoId: '', error: 'Video file missing' };

    const cleanTitle = `${String(clip?.title || 'Viral Short').trim()} #Shorts`.replace(/\s+/g, ' ').slice(0, 100);
    const metadata = {
      snippet: { title: cleanTitle, description: String(clip?.description || cleanTitle).slice(0, 4900), categoryId: '22' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
    };

    const sendUpload = async (bearer) => {
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' }));
      form.append('file', fileBlob, 'short.mp4');
      return fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart', {
        method: 'POST', headers: { Authorization: `Bearer ${bearer}` }, body: form
      });
    };

    try {
      let res = await sendUpload(token);
      if (res.status === 401) {
        const fresh = await refreshAccessToken();
        if (fresh) { token = fresh; res = await sendUpload(fresh); }
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) return { uploaded: false, videoId: '', error: data?.error?.message || `YouTube API Error (${res.status})` };
      if (clip?.thumbnailBlob instanceof Blob && clip.thumbnailBlob.size > 0) {
        try {
          await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(data.id)}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' }, body: clip.thumbnailBlob
          });
        } catch {}
      }
      return { uploaded: true, videoId: String(data.id), error: '' };
    } catch (err) {
      return { uploaded: false, videoId: '', error: err?.message || 'Upload error' };
    }
  }, [youtubeAccessToken, youtubeRefreshToken, refreshAccessToken]);

  const handleRetryYouTubeUpload = useCallback(async (clip) => {
    if (!clip?.id) return;
    setAutoPublishStatus(`Uploading Short: ${clip.title}...`);
    setVideoQueue((prev) => prev.map((item) => (item.id === clip.id ? { ...item, status: 'Uploading Short...' } : item)));
    const ytRes = await uploadClipToYouTube(clip);
    setVideoQueue((prev) => prev.map((item) => item.id !== clip.id ? item : ytRes.uploaded && ytRes.videoId
      ? { ...item, youtubeVideoId: ytRes.videoId, uploadError: '', status: `Uploaded SHORT (${ytRes.videoId}) ✅` }
      : { ...item, uploadError: ytRes.error || 'Failed', status: `Not Uploaded: ${ytRes.error || 'Failed'}` }));
    if (!ytRes.uploaded) setLoginError(`YouTube Upload Error: ${ytRes.error}`);
    setAutoPublishStatus('');
  }, [uploadClipToYouTube]);

  useEffect(() => {
    idbGetAllClips().then((clips) => { if (clips.length > 0) setVideoQueue(clips); });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('access_token') || '';
    const queryRefresh = params.get('refresh_token') || '';
    if (queryToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoggingIn(true);
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${queryToken}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((info) => {
          if (info?.email) {
            const u = { name: info.name || info.email.split('@')[0], email: info.email, avatar: info.picture || '' };
            setGoogleUser(u); setCheckoutEmail((p) => p || info.email);
            setYoutubeAccessToken(queryToken);
            if (queryRefresh) setYoutubeRefreshToken(queryRefresh);
            try {
              localStorage.setItem('sp_google_user', JSON.stringify(u));
              localStorage.setItem('sp_yt_access_token', queryToken);
              if (queryRefresh) localStorage.setItem('sp_yt_refresh_token', queryRefresh);
            } catch {}
            saveLocalRegistry(info.email, u);
          }
        }).finally(() => setIsLoggingIn(false));
    }
  }, []);

  const fetchFirebaseData = useCallback(async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes] = await Promise.all([fetch(`${dbBase}/siteConfig.json`), fetch(`${dbBase}/transactions.json`)]);
      const cfgData = await cfgRes.json();
      if (cfgData && typeof cfgData === 'object') {
        setGlobalConfig((prev) => ({
          ...prev, ...cfgData,
          monthlyPrice: cfgData.monthlyPrice || '99',
          yearlyPrice: cfgData.yearlyPrice || '1499',
          watermarkText: cfgData.watermarkText || 'Developed by shortspilot.in',
          blockedEmails: Array.isArray(cfgData.blockedEmails) ? cfgData.blockedEmails : prev.blockedEmails || []
        }));
      }
      const txnData = await txnRes.json();
      setTransactions(txnData && typeof txnData === 'object' ? Object.entries(txnData).map(([k, v]) => ({ firebaseKey: k, ...v })).reverse() : []);
    } catch {}
  }, [dbBase]);

  useEffect(() => { fetchFirebaseData(); }, [fetchFirebaseData]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setLoginError('');
    setAutoPublishStatus('Generating Thumbnail, Description & Auto-Posting Short...');
    const watermark = globalConfig.watermarkText || 'Developed by shortspilot.in';
    const hookLabel = selectedThumbConcept?.hookText || 'WAIT FOR END 😱';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const slotLabel = getNextSlotLabel(videoQueue.length + i);
      const topic = detectTopicFromFile(file.name);
      const meta = await readVideoMetadata(file);
      const durLabel = formatClockTime(meta.duration);
      const aiMeta = buildClipPackage(topic, i, '', watermark, durLabel, hookLabel);
      const thumb = await generateThumbnailBlob({ hookText: hookLabel, subText: topic, watermarkText: watermark, palette: selectedThumbConcept?.palette, videoBlob: file, seekSec: 2 });
      const objectUrl = URL.createObjectURL(file);

      let clipStatus = manualPostMode ? `Manual (SHORT) • ${slotLabel}` : `Queued (SHORT) • ${slotLabel}`;
      let youtubeVideoId = '';
      let uploadError = '';

      if (!manualPostMode && globalConfig.ytAutoUploadActive !== false) {
        const ytRes = await uploadClipToYouTube({ ...aiMeta, blob: file, thumbnailBlob: thumb.blob });
        if (ytRes.uploaded && ytRes.videoId) {
          youtubeVideoId = ytRes.videoId;
          clipStatus = `Uploaded SHORT (${youtubeVideoId}) • ${slotLabel} ✅`;
        } else {
          uploadError = ytRes.error || 'Token missing';
          clipStatus = `Not Uploaded (${slotLabel}): ${uploadError}`;
          setLoginError(`YouTube Upload Nahi Hua: ${uploadError}`);
        }
      }

      const clip = {
        id: `${Date.now()}-${Math.random()}`, title: aiMeta.title, mediaFormat: 'short',
        hashtags: aiMeta.hashtags, description: aiMeta.description, watermarkText: aiMeta.watermarkText,
        thumbnailHook: hookLabel, thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        thumbnailDataUrl: thumb.dataUrl, thumbnailBlob: thumb.blob, slotLabel, youtubeVideoId, uploadError,
        status: clipStatus, hookScore: aiMeta.hookScore, duration: durLabel, croppedUrl: objectUrl, blob: file
      };
      setVideoQueue((prev) => [clip, ...prev]);
      await idbSaveClip(clip);
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
    setAutoPublishStatus(`Cutting ${count} Shorts...`);
    const topic = detectTopicFromFile(file.name);
    const meta = await readVideoMetadata(file);
    const totalDur = Math.max(15, meta.duration || 60);
    const segDur = Math.max(5, Math.floor(totalDur / count));
    const baseUrl = URL.createObjectURL(file);
    const watermark = globalConfig.watermarkText || 'Developed by shortspilot.in';
    const hookLabel = selectedThumbConcept?.hookText || 'WAIT FOR END 😱';
    const generated = [];

    for (let i = 0; i < count; i++) {
      const slotLabel = getNextSlotLabel(videoQueue.length + i);
      const startSec = Math.floor(i * segDur);
      const endSec = i === count - 1 ? Math.floor(totalDur) : Math.min(Math.floor(totalDur), startSec + segDur);
      const durLabel = formatClockTime(Math.max(1, endSec - startSec));
      const partLabel = count > 1 ? `Part ${i + 1}/${count}` : '';
      const aiMeta = buildClipPackage(topic, i, partLabel, watermark, durLabel, hookLabel);
      const thumb = await generateThumbnailBlob({ hookText: hookLabel, subText: `${topic} ${partLabel}`.trim(), watermarkText: watermark, palette: selectedThumbConcept?.palette, videoBlob: file, seekSec: startSec + 1 });

      let clipStatus = manualPostMode ? `Cut Ready (SHORT) • ${slotLabel}` : `Scheduled (SHORT) • ${slotLabel}`;
      let youtubeVideoId = '';
      let uploadError = '';

      if (!manualPostMode && globalConfig.ytAutoUploadActive !== false && i < 4) {
        const ytRes = await uploadClipToYouTube({ ...aiMeta, blob: file, thumbnailBlob: thumb.blob });
        if (ytRes.uploaded && ytRes.videoId) {
          youtubeVideoId = ytRes.videoId;
          clipStatus = `Uploaded SHORT (${youtubeVideoId}) • ${slotLabel} ✅`;
        } else {
          uploadError = ytRes.error || 'Token missing';
          clipStatus = `Not Uploaded (${slotLabel}): ${uploadError}`;
          setLoginError(`YouTube Upload Nahi Hua: ${uploadError}`);
        }
      }

      const clipItem = {
        id: `${Date.now()}-${Math.random()}-${i}`, title: aiMeta.title, mediaFormat: 'short',
        hashtags: aiMeta.hashtags, description: aiMeta.description, watermarkText: aiMeta.watermarkText,
        thumbnailHook: hookLabel, thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        thumbnailDataUrl: thumb.dataUrl, thumbnailBlob: thumb.blob, slotLabel, youtubeVideoId, uploadError,
        status: clipStatus, hookScore: aiMeta.hookScore, duration: durLabel, croppedUrl: `${baseUrl}#t=${startSec},${endSec}`,
        blob: file, startSec, endSec
      };
      generated.push(clipItem);
      await idbSaveClip(clipItem);
    }
    setVideoQueue((prev) => [...generated, ...prev]);
    setAutoPublishStatus('');
  };

  const handleOpenRazorpayCheckout = useCallback(async () => {
    setCheckoutError(''); setCheckoutPendingMsg('');
    const cleanEmail = (checkoutEmail || googleUser?.email || '').trim().toLowerCase();
    if (!cleanEmail) return setCheckoutError('Pehle apna Gmail ID enter karein.');
    const amt = selectedBilling === 'yearly' ? Number(globalConfig.yearlyPrice || 1499) : Number(globalConfig.monthlyPrice || 99);
    const targetUrl = selectedBilling === 'yearly' ? RAZORPAY_YEARLY_LINK : RAZORPAY_MONTHLY_LINK;
    if (!targetUrl) return setCheckoutError('Yearly plan ki Razorpay link set nahi hai.');

    const loggedTxn = {
      id: `RZP-${Date.now()}`, user: cleanEmail, userKey: emailToKey(cleanEmail),
      plan: selectedBilling, numericAmount: amt, amount: `₹${amt} (${selectedBilling})`,
      status: 'Checkout Opened', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    if (dbBase) {
      try { await fetch(`${dbBase}/transactions.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loggedTxn) }); } catch {}
    }
    setTransactions((prev) => [loggedTxn, ...prev]);
    setCheckoutPendingMsg('Razorpay payment page open ho raha hai...');
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }, [checkoutEmail, googleUser?.email, selectedBilling, globalConfig, dbBase]);

  if (!isAdminOpen && (globalConfig?.maintenanceMode || isCurrentUserBlocked)) {
    return (
      <div className="min-h-screen w-full bg-[#05030a] text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-3xl bg-[#110c22] border border-rose-500/40 p-6 space-y-3">
          <h2 className="text-lg font-extrabold text-rose-300">
            {isCurrentUserBlocked ? 'Access Restricted' : 'Site Under Maintenance'}
          </h2>
          <p className="text-xs text-slate-300">
            {isCurrentUserBlocked
              ? 'Aapka account owner admin dwara block kiya gaya hai.'
              : globalConfig?.announcementBanner || 'Website abhi maintenance mode mein hai.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#05030a] text-slate-100 font-sans flex selection:bg-pink-500 selection:text-white">
      <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[#090614] border-r border-purple-500/20 p-5 sticky top-0 h-screen z-30">
        <div className="space-y-4">
          <div onClick={() => setActiveTab('home')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-[#140d2a] border border-pink-500/40 flex items-center justify-center"><Sparkles className="w-5 h-5 text-pink-400" /></div>
            <div>
              <div className="text-lg font-extrabold leading-none">Shorts<span className="text-pink-400">Pilot AI</span></div>
              <p className="text-[11px] text-slate-400 mt-1">shortspilot.in</p>
            </div>
          </div>

          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /><span>Upload & Auto-Post Shorts</span>
          </button>

          <div className="space-y-1 text-xs font-bold">
            <button type="button" onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${activeTab === 'home' ? 'bg-pink-500/20 text-pink-300' : 'text-slate-300'}`}>
              <Home className="w-4 h-4" /><span>Dashboard</span>
            </button>
            <button type="button" onClick={() => setActiveTab('projects')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer ${activeTab === 'projects' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300'}`}>
              <span className="flex items-center gap-3"><FolderKanban className="w-4 h-4" />Queue Vault</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-[10px]">{videoQueue.length}</span>
            </button>
            <button type="button" onClick={() => setIsSplitterModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-pink-300 cursor-pointer">
              <Scissors className="w-4 h-4" /><span>AI Clip Cutter</span>
            </button>
            <button type="button" onClick={() => setIsThumbnailModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cyan-300 cursor-pointer">
              <ImageIcon className="w-4 h-4" /><span>9:16 Thumbnail</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-purple-500/20">
          {isGoogleConnected && (
            <button type="button" onClick={logoutGoogle} className="w-full py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /><span>Disconnect Google</span>
            </button>
          )}
          <button type="button" onClick={() => setIsAdminOpen(true)} className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer">
            🔐 Owner Admin Console
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-screen bg-[#070510] text-white flex flex-col">
        <header className="flex items-center justify-between px-4 lg:px-8 py-3.5 bg-[#090614]/95 border-b border-purple-500/15 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${isGoogleConnected ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-amber-500/15 border-amber-400/40 text-amber-300'}`}>
              {isGoogleConnected ? `✅ ${googleUser.email}` : 'Google Not Connected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isGoogleConnected && (
              <button type="button" onClick={startGoogleLogin} disabled={isLoggingIn} className="px-3 py-1.5 rounded-full bg-[#4285F4] text-white font-extrabold text-xs cursor-pointer">
                {isLoggingIn ? 'Connecting...' : 'Connect Google'}
              </button>
            )}
            <button type="button" onClick={() => setIsPricingOpen(true)} className="px-3 py-1.5 rounded-full bg-[#1f1608] border border-amber-400/70 text-amber-300 font-extrabold text-xs flex items-center gap-1 cursor-pointer">
              <Crown className="w-3.5 h-3.5 fill-amber-400" /><span>{tier === 'pro' ? 'VIP Active' : `₹${globalConfig.monthlyPrice}`}</span>
            </button>
            <button type="button" onClick={() => setIsAdminOpen(true)} className="lg:hidden px-2.5 py-1.5 rounded-full bg-purple-600/25 border border-purple-500/40 text-purple-300 text-xs font-extrabold cursor-pointer">
              Admin
            </button>
          </div>
        </header>

        {globalConfig?.announcementBanner && (
          <div className="mx-4 lg:mx-8 mt-2 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-xs text-cyan-200 font-bold">
            {globalConfig.announcementBanner}
          </div>
        )}

        {loginError && (
          <div className="mx-4 lg:mx-8 mt-2 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-bold">
            {loginError}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileUpload} className="hidden" />
        <input ref={splitterInputRef} type="file" accept="video/*" onChange={handleSplitFullVideo} className="hidden" />

        <div className="flex-1 w-full max-w-[460px] lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4 pb-28 space-y-4">
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-[28px] p-5 bg-gradient-to-br from-[#2a104e] via-[#150a2e] to-[#0c071d] border border-purple-500/40 space-y-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-[9.5px] font-extrabold text-pink-300">
                    <Zap className="w-3 h-3" /> Shorts Auto-Post Engine (#Shorts)
                  </span>
                  <h2 className="text-2xl font-extrabold text-white">Publish to YouTube <span className="text-pink-400">Shorts</span></h2>
                  {autoPublishStatus && <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold text-center">{autoPublishStatus}</div>}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer">
                    <Play className="w-4 h-4 fill-white" /><span>{manualPostMode ? 'Upload Short to Manual Vault' : 'Upload & Auto-Post Shorts'}</span>
                  </button>
                </div>

                <div className="rounded-[28px] p-5 bg-gradient-to-br from-[#231042] via-[#150b29] to-[#0c1428] border border-pink-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2"><Scissors className="w-4 h-4 text-pink-300" /> AI Engaging Shorts Cutter</h3>
                    <button type="button" onClick={() => setIsSplitterModalOpen(true)} className="px-3 py-1 rounded-xl bg-pink-600 text-white text-xs font-extrabold cursor-pointer">Open</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map((num) => (
                      <button key={num} type="button" onClick={() => setClipSplitCount(num)} className={`py-2 rounded-xl border text-xs font-extrabold cursor-pointer ${clipSplitCount === num ? 'bg-pink-500/30 border-pink-400 text-pink-200' : 'bg-[#0b0718] border-slate-800 text-slate-400'}`}>
                        {num} {num === 1 ? 'Short' : 'Shorts'}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => splitterInputRef.current?.click()} className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer">
                    Select Video & Cut {clipSplitCount} {clipSplitCount === 1 ? 'Short' : 'Shorts'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#110c22] border border-cyan-500/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-white">9:16 Thumbnail Hook</div>
                    <div className="text-xs text-amber-300 font-bold">{selectedThumbConcept?.hookText}</div>
                  </div>
                  <button type="button" onClick={() => setIsThumbnailModalOpen(true)} className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-extrabold cursor-pointer">Style</button>
                </div>
                <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/35 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-white">Posting Mode</div>
                    <div className="text-xs text-slate-300">Shorts Only (#Shorts)</div>
                  </div>
                  <button type="button" onClick={() => setManualPostMode(!manualPostMode)} className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer ${manualPostMode ? 'bg-amber-500/25 text-amber-300' : 'bg-emerald-500/25 text-emerald-300'}`}>
                    {manualPostMode ? '⚡ Manual' : '🤖 Auto-Post ON'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {videoQueue.slice(0, 8).map((clip) => (
                  <div key={clip.id} className="p-3.5 rounded-2xl bg-[#120c24] border border-purple-500/35 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div onClick={() => setPreviewClip(clip)} className="w-11 h-14 rounded-lg bg-slate-900 border border-purple-400/40 overflow-hidden shrink-0 cursor-pointer">
                          {clip.thumbnailDataUrl && <img src={sanitizeMediaUrl(clip.thumbnailDataUrl)} alt={clip.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <h4 onClick={() => setPreviewClip(clip)} className="text-xs font-extrabold text-white truncate cursor-pointer">{clip.title}</h4>
                          <div className="text-[10px] text-emerald-300 font-bold">{clip.status} • {clip.duration}</div>
                        </div>
                      </div>
                      <button type="button" onClick={async () => { setVideoQueue((p) => p.filter((x) => x.id !== clip.id)); await idbDeleteClip(clip.id); }} className="p-1.5 text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-[9.5px] text-cyan-300 font-mono truncate bg-[#080512] px-2.5 py-1.5 rounded-lg">{clip.hashtags}</div>
                    {!clip.youtubeVideoId && (
                      <button type="button" onClick={() => handleRetryYouTubeUpload(clip)} className="w-full py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[10.5px] font-extrabold cursor-pointer">
                        ↻ Retry YouTube Upload
                      </button>
                    )}
                    <ClipActionShortcuts
                      clip={clip}
                      onPreview={setPreviewClip}
                      onCopyDescription={(c) => c?.description && navigator.clipboard?.writeText(c.description)}
                      onSendThumbAI={(c, target) => sendThumbnailPromptToAI({ clip: c, target, watermarkText: globalConfig.watermarkText })}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">Queue Vault ({videoQueue.length})</h2>
                {videoQueue.length > 0 && (
                  <button type="button" onClick={async () => { setVideoQueue([]); await idbClearAllClips(); }} className="text-xs text-rose-400 underline cursor-pointer">Clear All</button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {videoQueue.map((clip) => (
                  <div key={clip.id} className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2">
                    <div className="text-xs font-bold text-white">{clip.title}</div>
                    <div className="text-[10px] text-emerald-400">{clip.status}</div>
                    <pre className="text-[10px] text-slate-300 whitespace-pre-wrap bg-[#070412] p-2.5 rounded-xl">{clip.description}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090614] border-t border-purple-500/25 flex items-center justify-around z-30">
          <button type="button" onClick={() => setActiveTab('home')} className="text-xs font-bold text-pink-400 cursor-pointer">Home</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-full bg-pink-600 text-white text-xs font-extrabold cursor-pointer">+ Shorts</button>
          <button type="button" onClick={() => setActiveTab('projects')} className="text-xs font-bold text-purple-300 cursor-pointer">Vault ({videoQueue.length})</button>
        </nav>
      </div>

      {isSplitterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-pink-500/50 p-6 space-y-3">
            <button type="button" onClick={() => setIsSplitterModalOpen(false)} className="absolute top-4 right-4 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold">Cut Shorts (1, 3, 5)</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((n) => (
                <button key={n} type="button" onClick={() => setClipSplitCount(n)} className={`py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer ${clipSplitCount === n ? 'bg-pink-600 border-pink-400 text-white' : 'bg-[#130c26] border-slate-700 text-slate-300'}`}>{n}</button>
              ))}
            </div>
            <button type="button" onClick={() => splitterInputRef.current?.click()} className="w-full py-3 rounded-2xl bg-pink-600 text-white font-extrabold text-xs cursor-pointer">Select Video & Cut</button>
          </div>
        </div>
      )}

      {isThumbnailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/50 p-5 space-y-3">
            <button type="button" onClick={() => setIsThumbnailModalOpen(false)} className="absolute top-4 right-4 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold">9:16 Thumbnail Preset</h3>
            <form onSubmit={(e) => { e.preventDefault(); const next = buildThumbnailConcepts(thumbTopicInput || 'VIRAL'); setThumbConcepts(next); setSelectedThumbConcept(next[0]); }} className="flex gap-2">
              <input type="text" value={thumbTopicInput} onChange={(e) => setThumbTopicInput(e.target.value)} placeholder="Hook text..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
              <button type="submit" className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer">Apply</button>
            </form>
            <div className="grid grid-cols-3 gap-2">
              {thumbConcepts.map((item) => (
                <div key={item.id} onClick={() => setSelectedThumbConcept(item)} className={`p-3 rounded-2xl bg-gradient-to-b ${item.gradient} border-2 cursor-pointer text-center ${selectedThumbConcept?.id === item.id ? 'border-amber-400' : 'border-white/15'}`}>
                  <div className="text-[11px] font-black text-white">{item.hookText}</div>
                  <div className="text-[9px] text-emerald-300 mt-1">{item.ctrScore}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-amber-400/50 p-6 space-y-3">
            <button type="button" onClick={() => setIsPricingOpen(false)} className="absolute top-4 right-4 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold">Offer Plans</h3>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setSelectedBilling('monthly')} className={`p-3 rounded-2xl border text-left cursor-pointer ${selectedBilling === 'monthly' ? 'bg-cyan-500/20 border-cyan-400' : 'border-slate-800'}`}>
                <div className="text-xs font-extrabold text-cyan-300">Monthly ₹{globalConfig.monthlyPrice}</div>
              </button>
              <button type="button" onClick={() => setSelectedBilling('yearly')} className={`p-3 rounded-2xl border text-left cursor-pointer ${selectedBilling === 'yearly' ? 'bg-amber-500/20 border-amber-400' : 'border-slate-800'}`}>
                <div className="text-xs font-extrabold text-amber-300">Yearly ₹{globalConfig.yearlyPrice}</div>
              </button>
            </div>
            <input type="email" value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} placeholder="Gmail ID" className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
            {checkoutError && <p className="text-xs text-rose-400">{checkoutError}</p>}
            {checkoutPendingMsg && <p className="text-xs text-emerald-300">{checkoutPendingMsg}</p>}
            <button type="button" onClick={handleOpenRazorpayCheckout} className="w-full py-3 rounded-2xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer">Pay via Razorpay</button>
          </div>
        </div>
      )}

      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b0818] border border-purple-500/40 p-4 space-y-3">
            <button type="button" onClick={() => setPreviewClip(null)} className="absolute top-3 right-3 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="text-xs font-extrabold truncate pr-6">{previewClip.title}</div>
            <video src={sanitizeMediaUrl(previewClip.croppedUrl)} controls autoPlay playsInline className="w-full aspect-[9/16] rounded-2xl bg-black" />
            <pre className="text-[10px] text-slate-200 whitespace-pre-wrap bg-[#06040c] p-2.5 rounded-xl">{previewClip.description}</pre>
          </div>
        </div>
      )}

      {showAiSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="relative w-full max-w-sm h-[380px] rounded-3xl bg-[#0b0818] border border-cyan-500/40 p-4 flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-extrabold">AI Support</span>
              <button type="button" onClick={() => setShowAiSupport(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs">
              {supportMessages.map((m, i) => (
                <div key={i} className={`p-2 rounded-xl ${m.role === 'user' ? 'bg-purple-600 ml-6' : 'bg-[#140e28] mr-6'}`}>{m.text}</div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (!supportInput.trim()) return; setSupportMessages((p) => [...p, { role: 'user', text: supportInput.trim() }, { role: 'ai', text: 'ShortsPilot abhi Shorts (#Shorts) mode par hai.' }]); setSupportInput(''); }} className="flex gap-2">
              <input type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)} placeholder="Ask..." className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-white" />
              <button type="submit" className="px-3 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs cursor-pointer">Send</button>
            </form>
          </div>
        </div>
      )}

      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminUnlocked={adminUnlocked}
        setAdminUnlocked={setAdminUnlocked}
        adminPinInput={adminPinInput}
        setAdminPinInput={setAdminPinInput}
        adminError={adminError}
        setAdminError={setAdminError}
        globalConfig={globalConfig}
        setGlobalConfig={setGlobalConfig}
        liveDbUrl={liveDbUrl}
        setLiveDbUrl={setLiveDbUrl}
        transactions={transactions}
        setTransactions={setTransactions}
        fetchFirebaseData={fetchFirebaseData}
        dbBase={dbBase}
        setTier={setTier}
        onSavedNotice={(msg) => setAutoPublishStatus(msg)}
      />
    </div>
  );
}
