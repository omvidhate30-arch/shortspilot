export const USER_API_MAP_KEY = 'sp_gmail_api_registry';
export const FIREBASE_DB_URL = 'https://shortspilot-live-default-rtdb.firebaseio.com';
const IDB_NAME = 'ShortsPilotClipsDB';
const IDB_STORE = 'clips';

export const emailToKey = (email) =>
  (email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

export const sanitizeMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (rawUrl.startsWith('blob:')) return rawUrl;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {}
  return '';
};

export const formatClockTime = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
};

export const readGmailApiRegistry = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(USER_API_MAP_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
};

export const saveGmailApiRecord = (email, record) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  const current = readGmailApiRegistry();
  current[cleanEmail] = {
    ...(current[cleanEmail] || {}),
    ...record,
    email: cleanEmail,
    updatedAt: Date.now()
  };
  localStorage.setItem(USER_API_MAP_KEY, JSON.stringify(current));
};

export const removeGmailApiRecord = (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  const current = readGmailApiRegistry();
  delete current[cleanEmail];
  localStorage.setItem(USER_API_MAP_KEY, JSON.stringify(current));
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

export const idbSaveClip = async (clipObj) => {
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

export const idbGetAllClips = async () => {
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
            const baseUrl =
              item.blob instanceof Blob ? URL.createObjectURL(item.blob) : null;
            const trimHash =
              baseUrl &&
              typeof item.startSec === 'number' &&
              typeof item.endSec === 'number'
                ? `#t=${Math.floor(item.startSec)},${Math.floor(item.endSec)}`
                : '';
            return {
              ...item,
              croppedUrl: baseUrl ? `${baseUrl}${trimHash}` : null
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

export const idbDeleteClip = async (clipId) => {
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

export const idbClearAllClips = async () => {
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

export const analyzeVideoDeeply = (file) =>
  new Promise((resolve) => {
    if (!(file instanceof Blob)) {
      return resolve({
        duration: 30,
        width: 1080,
        height: 1920,
        orientation: '9:16'
      });
    }
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'auto';
    vid.muted = true;
    vid.playsInline = true;
    vid.src = url;

    const finish = (info) => {
      URL.revokeObjectURL(url);
      resolve(info);
    };

    vid.onloadedmetadata = () => {
      const rawDur = vid.duration;
      const duration = Number.isFinite(rawDur) && rawDur > 0 ? rawDur : 30;
      const width = vid.videoWidth || 1080;
      const height = vid.videoHeight || 1920;
      const orientation = height >= width ? '9:16' : '16:9';
      finish({ duration, width, height, orientation });
    };

    vid.onerror = () => {
      finish({
        duration: 30,
        width: 1080,
        height: 1920,
        orientation: '9:16'
      });
    };
  });
export const buildDeepAiVideoPackage = (
  rawName,
  _videoAnalysis = {},
  clipIndex = 0,
  partLabel = '',
  watermarkLabel = 'Developed by shortspilot.in'
) => {
  const cleanName = (rawName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(
      /^(vid|img|pxl|screen|recording|whatsapp|video|clip|short|movie|edit|new|output|compressed|final)[\s_-]*/gi,
      ''
    )
    .replace(/\b\d{5,}\b/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = cleanName.toLowerCase();
  const displayTopic = cleanName.length > 1 ? cleanName : 'Viral Moment';
  const partNote = partLabel ? ` (${partLabel})` : '';

  let category = 'Viral';
  let hookTitle = '';
  let storyBody = '';
  let tagList = [];

  if (/\bgta\s?6\b/i.test(lower)) {
    category = 'GTA 6';
    const gta6Titles = [
      `GTA 6 Gameplay Looks Insane! 😱🔥${partNote} #Shorts`,
      `Next-Level GTA 6 Action You Can't Miss ⚡${partNote} #Shorts`,
      `GTA 6 Viral Moment — Watch Till End 😱${partNote} #Shorts`
    ];
    hookTitle = gta6Titles[clipIndex % gta6Titles.length];
    storyBody =
      'Crazy GTA 6 action and next-gen details in action. Drop your thoughts in the comments below and subscribe for more daily Shorts!';
    tagList = [
      '#GTA6', '#GrandTheftAuto6', '#GTA6Gameplay',
      '#RockstarGames', '#GTA', '#GamingShorts',
      '#OpenWorldGames', '#NextGenGaming',
      '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else if (/(free\s?fire|\bff\b|booyah|headshot|clash\s?squad)/i.test(lower)) {
    category = 'Free Fire';
    const ffTitles = [
      `Insane Free Fire Headshot & Clutch! 🔥⚡${partNote} #Shorts`,
      `One Tap Madness in Free Fire 😱🔥${partNote} #Shorts`
    ];
    hookTitle = ffTitles[clipIndex % ffTitles.length];
    storyBody =
      'Fast-paced Free Fire gameplay highlights with clean shots and intense moments. Comment your favorite moment below!';
    tagList = [
      '#FreeFire', '#FreeFireIndia', '#FreeFireShorts',
      '#FFShorts', '#Headshot', '#GamingShorts',
      '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else if (/(bgmi|pubg|clutch|squad)/i.test(lower)) {
    category = 'BGMI';
    hookTitle = `Wild BGMI Squad Wipe & Clutch! 😱🔥${partNote} #Shorts`;
    storyBody =
      'High-pressure BGMI fight and clutch gameplay. Like and subscribe for daily gaming Shorts!';
    tagList = [
      '#BGMI', '#BGMIShorts', '#BGMIIndia', '#PUBGM',
      '#ClutchMoment', '#GamingShorts',
      '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else if (/(anime|naruto|goku|luffy|gojo|sukuna|amv|otaku|edit)/i.test(lower)) {
    category = 'Anime';
    hookTitle = `Chills Every Time in This ${displayTopic} Scene 😭🔥${partNote} #Shorts`;
    storyBody = `Unforgettable ${displayTopic} moment edited for pure hype and emotion. Comment your favorite character below!`;
    tagList = [
      '#Anime', '#AnimeEdit', '#AnimeShorts', '#AMV',
      '#AnimeIndia', '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else if (
    /(car|bmw|supra|gtr|lamborghini|ferrari|porsche|bike|zx10r|kawasaki|duke|thar|scorpio|drift|exhaust)/i.test(lower)
  ) {
    category = 'Automobiles';
    hookTitle = `Listen To That ${displayTopic} Sound 🔊🔥${partNote} #Shorts`;
    storyBody = `Clean shots of ${displayTopic} turning heads everywhere. Which ride is your pick? Comment below!`;
    tagList = [
      '#Cars', '#Supercars', '#CarShorts', '#Superbikes',
      '#CarLovers', '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else if (
    /(tech|ai|mobile|iphone|android|laptop|coding|app|website|gadget|trick|tips)/i.test(lower)
  ) {
    category = 'Tech';
    hookTitle = `Smart ${displayTopic} Trick You Should Try Today ⚡${partNote} #Shorts`;
    storyBody = `Helpful ${displayTopic} tip made simple in under a minute. Save and share with a friend!`;
    tagList = [
      '#Tech', '#TechShorts', '#TechTips', '#AITools',
      '#Shorts', '#YouTubeShorts', '#ViralShorts'
    ];
  } else {
    category = 'Viral';
    const viralTitles = [
      `${displayTopic} 😱 Wait For The End!${partNote} #Shorts`,
      `You Won't Expect What Happens Next 🔥${partNote} #Shorts`,
      `Best Moment From ${displayTopic} ⚡${partNote} #Shorts`
    ];
    hookTitle = viralTitles[clipIndex % viralTitles.length];
    storyBody = `Watch ${displayTopic} till the end and share your reaction in the comments!`;
    tagList = [
      '#Shorts', '#YouTubeShorts', '#ViralShorts',
      '#Trending', '#MustWatch', '#Viral'
    ];
  }

  const finalTitle = hookTitle.slice(0, 90);
  const hashtagsString = tagList.join(' ');
  const brandCredit = (watermarkLabel || 'Developed by shortspilot.in').trim();

  const cleanDescription = [
    storyBody,
    '',
    'Website: https://shortspilot.in',
    brandCredit,
    '',
    hashtagsString
  ].join('\n');

  return {
    category,
    title: finalTitle,
    hashtags: hashtagsString,
    tagArray: tagList.map((t) => t.replace(/^#/, '')),
    description: cleanDescription,
    watermarkText: brandCredit,
    websiteUrl: 'https://shortspilot.in',
    hookScore: clipIndex === 0 ? '9.9/10' : clipIndex === 1 ? '9.8/10' : '9.6/10'
  };
};

export const buildShortsThumbnailConcepts = (topicInput) => {
  const base = (topicInput || '').trim() || 'GTA 6';
  const upperTopic = base.toUpperCase().slice(0, 24);

  return [
    {
      id: 't1',
      hookText: 'WAIT FOR END 😱',
      subText: upperTopic,
      badge: '9:16 VIRAL HOOK',
      gradient: 'from-pink-600 via-purple-900 to-slate-950',
      accentText: 'text-amber-300',
      ctrScore: '9.9/10 CTR'
    },
    {
      id: 't2',
      hookText: 'INSANE MOMENT 🔥',
      subText: upperTopic,
      badge: 'HIGH CONTRAST',
      gradient: 'from-amber-500 via-rose-800 to-slate-950',
      accentText: 'text-cyan-300',
      ctrScore: '9.7/10 CTR'
    },
    {
      id: 't3',
      hookText: 'WATCH TILL END ⚡',
      subText: upperTopic,
      badge: 'SHORTS FEED PRO',
      gradient: 'from-cyan-500 via-indigo-900 to-slate-950',
      accentText: 'text-pink-300',
      ctrScore: '9.6/10 CTR'
    }
  ];
};
