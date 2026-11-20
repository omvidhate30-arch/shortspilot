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
  UserCheck,
  Phone,
  Instagram,
  LogOut
} from 'lucide-react';
import {
  openGoogleAccountPopup,
  fetchGoogleAndYouTubeProfile
} from './googleAuth';
import {
  FIREBASE_DB_URL,
  emailToKey,
  sanitizeMediaUrl,
  formatClockTime,
  readGmailApiRegistry,
  saveGmailApiRecord,
  removeGmailApiRecord,
  idbSaveClip,
  idbGetAllClips,
  idbDeleteClip,
  idbClearAllClips,
  analyzeVideoDeeply,
  buildDeepAiVideoPackage,
  buildShortsThumbnailConcepts
} from './videoUtils';
import AdminConsoleModal from './AdminConsoleModal';

const ChannelAvatarBadge = React.memo(({ ytStats, sizeClass = 'w-10 h-10' }) => {
  const safeAvatar = sanitizeMediaUrl(ytStats?.avatar);
  if (ytStats?.isConnected && safeAvatar) {
    return (
      <div className="relative shrink-0">
        <img
          src={safeAvatar}
          alt={ytStats?.title || 'User Channel'}
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

const GoogleUserLogo = React.memo(({ gmailUser, ytStats, onClick }) => {
  const safeAvatar = sanitizeMediaUrl(ytStats?.avatar || gmailUser?.avatar);
  return (
    <button
      type="button"
      onClick={onClick}
      title={gmailUser?.email ? `${gmailUser.email} (Google Account)` : 'Connect Google'}
      className="w-9 h-9 rounded-full bg-white p-[1.5px] flex items-center justify-center cursor-pointer overflow-hidden shadow shrink-0"
    >
      {safeAvatar ? (
        <img
          src={safeAvatar}
          alt="Google Profile"
          className="w-full h-full rounded-full object-cover"
        />
      ) : gmailUser?.email ? (
        <span className="w-full h-full rounded-full bg-[#4285F4] text-white text-xs font-black flex items-center justify-center uppercase">
          {gmailUser.email[0]}
        </span>
      ) : (
        <span className="text-sm font-black text-[#4285F4] leading-none">G</span>
      )}
    </button>
  );
});

const DesktopSidebar = React.memo(({
  activeTab,
  setActiveTab,
  onTriggerUpload,
  onOpenSplitter,
  onOpenThumbnail,
  onOpenPricing,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  isLoggedIn,
  monthlyPrice,
  yearlyPrice,
  videoCount,
  ytStats,
  onOpenApiConnect
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
        onClick={() => (isLoggedIn ? onOpenApiConnect() : onOpenLogin())}
        className={`p-2.5 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
          ytStats?.isConnected
            ? 'bg-emerald-500/10 border-emerald-400/50'
            : 'bg-[#120c24] border-amber-400/50 hover:border-cyan-400/60'
        }`}
      >
        <ChannelAvatarBadge ytStats={ytStats} sizeClass="w-10 h-10" />
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-white truncate">
            {ytStats?.isConnected
              ? ytStats.title
              : isLoggedIn
              ? 'Phone Required'
              : 'Connect Google'}
          </div>
          <div
            className={`text-[10px] font-bold truncate ${
              ytStats?.isConnected ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {ytStats?.isConnected
              ? '✅ Connected'
              : isLoggedIn
              ? '⚠️ Mandatory on Publish'
              : 'Click for Google Popup'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onTriggerUpload}
        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:opacity-95 active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>Upload & Publish Short</span>
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
          <span>9:16 Thumbnail Gen</span>
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

      {isLoggedIn && (
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/25"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
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
));

const TopHeader = React.memo(({
  tier,
  hasUnread,
  ytStats,
  gmailUser,
  isLoggedIn,
  onOpenDrawer,
  onGoHome,
  onOpenPricing,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  onOpenApiConnect
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
            ytStats?.isConnected
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
              : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
          }`}
        >
          {ytStats?.isConnected
            ? '● Connected ✅'
            : isLoggedIn
            ? '● Phone Required on Publish'
            : '● Connect Google Popup'}
        </span>
        <span className="text-xs text-slate-400">
          Brand: <b className="text-cyan-300 font-mono">Developed by shortspilot.in</b>
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {!isLoggedIn ? (
        <button
          type="button"
          onClick={onOpenLogin}
          className="px-3 py-1.5 rounded-full bg-[#4285F4] text-white font-extrabold text-xs cursor-pointer shadow"
        >
          Connect Google
        </button>
      ) : (
        <button
          type="button"
          onClick={onLogout}
          title="Logout"
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

      <GoogleUserLogo
        gmailUser={gmailUser}
        ytStats={ytStats}
        onClick={() => (isLoggedIn ? onOpenApiConnect() : onOpenLogin())}
      />
    </div>
  </header>
));

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

  const [gmailUser, setGmailUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sp_gmail_user') || 'null');
    } catch {
      return null;
    }
  });

  const [igData, setIgData] = useState(() => {
    try {
      const email = JSON.parse(localStorage.getItem('sp_gmail_user') || 'null')?.email?.toLowerCase();
      const reg = email ? readGmailApiRegistry()[email] : null;
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

  const [profileEmailDraft, setProfileEmailDraft] = useState(() => gmailUser?.email || '');
  const [profilePhoneDraft, setProfilePhoneDraft] = useState(() => gmailUser?.phone || '');
  const [apiSavedMsg, setApiSavedMsg] = useState('');

  const [isYtSetupPopupOpen, setIsYtSetupPopupOpen] = useState(false);
  const [setupPhoneInput, setSetupPhoneInput] = useState(() => gmailUser?.phone || '');
  const [setupPopupError, setSetupPopupError] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [tier, setTier] = useState('pro');
  const [videoQueue, setVideoQueue] = useState([]);

  const [clipSplitCount, setClipSplitCount] = useState(3);
  const [isSplitterModalOpen, setIsSplitterModalOpen] = useState(false);

  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [thumbTopicInput, setThumbTopicInput] = useState('');
  const [selectedThumbConcept, setSelectedThumbConcept] = useState(
    () => buildShortsThumbnailConcepts('GTA 6')[0]
  );
  const [thumbConcepts, setThumbConcepts] = useState(() => buildShortsThumbnailConcepts('GTA 6'));

  const [selectedTimeSlot] = useState(() => {
    const h = new Date().getHours();
    if (h < 13) return '9:00 AM (Nearest VIP Slot)';
    if (h < 18) return '2:00 PM (Nearest VIP Slot)';
    return '7:30 PM (Nearest VIP Slot)';
  });

  const [customVideoTopic, setCustomVideoTopic] = useState('');
  const [autoPublishStatus, setAutoPublishStatus] = useState('');
  const [manualPostMode, setManualPostMode] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 1,
      title: 'Automatic Google Connect ✅',
      desc: 'Clicking Connect Google opens Google account popup directly.',
      unread: true
    },
    {
      id: 2,
      title: 'Phone Number Popup ✨',
      desc: 'Opens after Google connect. Skippable now, mandatory on publish.',
      unread: true
    }
  ]);

  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    {
      role: 'ai',
      text: 'Namaste! Connect Google par click karein; connect hote hi Phone Number ka popup aayega.'
    }
  ]);
  const [supportInput, setSupportInput] = useState('');

  const [ytChannel, setYtChannel] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sp_yt_channel') || 'null');
    } catch {
      return null;
    }
  });

  const [ytStats, setYtStats] = useState(() => {
    try {
      const savedCh = JSON.parse(localStorage.getItem('sp_yt_channel') || 'null');
      if (savedCh?.isConnected) {
        return {
          title: savedCh.title || 'Connected Channel',
          customUrl: savedCh.customUrl || '@channel',
          avatar: savedCh.avatar || '',
          subscribers: savedCh.subscribers || '0',
          totalViews: savedCh.totalViews || '0',
          videoCount: savedCh.videoCount || '0',
          country: 'IN',
          recentVideos: [],
          loading: false,
          isConnected: true
        };
      }
    } catch {}
    return {
      title: '',
      customUrl: '',
      avatar: '',
      subscribers: '0',
      totalViews: '0',
      videoCount: '0',
      country: 'IN',
      recentVideos: [],
      loading: false,
      isConnected: false
    };
  });

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState('yearly');
  const [upgradeReason, setUpgradeReason] = useState('');

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [previewClip, setPreviewClip] = useState(null);

  const [utrNumber, setUtrNumber] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutPendingMsg, setCheckoutPendingMsg] = useState('');

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [liveDbUrl, setLiveDbUrl] = useState(
    () => localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL
  );
  const [transactions, setTransactions] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [remoteUserApis, setRemoteUserApis] = useState([]);

  const fileInputRef = useRef(null);
  const splitterInputRef = useRef(null);
  const ytChannelRef = useRef(ytChannel);
  const oauthHandledRef = useRef(false);

  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');
  const isLoggedIn = Boolean(gmailUser?.email || ytStats.isConnected);

  const isSetupComplete = useMemo(() => {
    const cleanPhone = (gmailUser?.phone || profilePhoneDraft || setupPhoneInput || '').replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }, [gmailUser?.phone, profilePhoneDraft, setupPhoneInput]);

  const triggerNextSetupPopupAfterGoogle = useCallback((connectedEmail = '') => {
    const cleanEmail = (connectedEmail || '').trim().toLowerCase();
    const regRecord = cleanEmail ? readGmailApiRegistry()[cleanEmail] : null;
    const savedPhone = regRecord?.phone || gmailUser?.phone || profilePhoneDraft || '';

    setSetupPhoneInput(savedPhone);
    setSetupPopupError('');

    if (savedPhone.replace(/\D/g, '').length < 10) {
      setIsYtSetupPopupOpen(true);
    }
  }, [gmailUser?.phone, profilePhoneDraft]);

  const applyGoogleSession = useCallback((token, userObj, channelObj) => {
    const savedDraft = JSON.parse(localStorage.getItem('sp_gmail_user') || 'null') || {};
    const resolvedEmail = (userObj?.email || savedDraft?.email || '').toLowerCase();
    const updatedUser = {
      ...savedDraft,
      ...userObj,
      email: resolvedEmail || savedDraft.email || ''
    };

    if (updatedUser.email) {
      setGmailUser(updatedUser);
      setProfileEmailDraft(updatedUser.email);
      localStorage.setItem('sp_gmail_user', JSON.stringify(updatedUser));
    }

    const chObj = {
      ...channelObj,
      isConnected: true,
      accessToken: token
    };

    setYtChannel(chObj);
    ytChannelRef.current = chObj;
    localStorage.setItem('sp_yt_channel', JSON.stringify(chObj));
    setYtStats({ ...chObj, loading: false });

    return updatedUser.email;
  }, []);

  useEffect(() => {
    if (oauthHandledRef.current) return;

    const processToken = async (token) => {
      if (!token || oauthHandledRef.current) return;
      oauthHandledRef.current = true;
      localStorage.setItem('sp_yt_access_token', token);

      try {
        const { userObj, channelObj } = await fetchGoogleAndYouTubeProfile(token);
        const emailUsed = applyGoogleSession(token, userObj, channelObj);

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              { type: 'SP_GOOGLE_OAUTH_SUCCESS', token, userObj, channelObj },
              window.location.origin
            );
          } catch {}
          window.close();
          return;
        }

        triggerNextSetupPopupAfterGoogle(emailUsed);
      } catch (err) {
        console.error('Google OAuth token processing error:', err);
      }
    };

    const hash = window.location.hash || '';
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('access_token');
      if (token) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        processToken(token);
      }
    }

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'SP_GOOGLE_OAUTH_SUCCESS' && event.data?.token) {
        if (oauthHandledRef.current) return;
        oauthHandledRef.current = true;
        const emailUsed = applyGoogleSession(
          event.data.token,
          event.data.userObj || {},
          event.data.channelObj || {}
        );
        triggerNextSetupPopupAfterGoogle(emailUsed);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const syncUserApiToOwner = async (
    email,
    clientId = '',
    phone = '',
    igUsername = '',
    igToken = '',
    extra = {}
  ) => {
    const cleanEmail = (email || gmailUser?.email || 'guest@shortspilot.in').trim().toLowerCase();
    const existing = readGmailApiRegistry()[cleanEmail] || {};
    const payload = {
      email: cleanEmail,
      phone: phone !== undefined && phone !== '' ? phone : existing.phone || '',
      clientId: clientId !== undefined && clientId !== '' ? clientId : existing.clientId || '',
      igUsername: igUsername !== undefined && igUsername !== '' ? igUsername : existing.igUsername || '',
      igToken: igToken !== undefined && igToken !== '' ? igToken : existing.igToken || '',
      connected: true,
      channelTitle: extra.channelTitle || existing.channelTitle || cleanEmail.split('@')[0],
      channelHandle: extra.channelHandle || existing.channelHandle || `@${cleanEmail.split('@')[0]}`,
      updatedAt: Date.now()
    };
    saveGmailApiRecord(cleanEmail, payload);

    if (dbBase) {
      try {
        await fetch(`${dbBase}/userApis/${emailToKey(cleanEmail)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            updatedAtIso: new Date().toISOString()
          })
        });
      } catch {}
    }
  };

  useEffect(() => {
    const cleanEmail = (profileEmailDraft || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;
    const reg = readGmailApiRegistry();
    if (reg[cleanEmail]) {
      if (reg[cleanEmail].phone) setProfilePhoneDraft(reg[cleanEmail].phone);
      if (reg[cleanEmail].igToken) {
        setIgData({
          username: reg[cleanEmail].igUsername || '@instagram_user',
          token: reg[cleanEmail].igToken,
          connected: true
        });
      }
    }
  }, [profileEmailDraft]);

  const fetchFirebaseAll = useCallback(async () => {
    if (!dbBase) return;
    try {
      const [cfgRes, txnRes, cliRes, apiRes] = await Promise.all([
        fetch(`${dbBase}/siteConfig.json`),
        fetch(`${dbBase}/transactions.json`),
        fetch(`${dbBase}/clients.json`),
        fetch(`${dbBase}/userApis.json`)
      ]);
      const cfgData = await cfgRes.json();
      if (cfgData && typeof cfgData === 'object') {
        setGlobalConfig((prev) => ({
          ...prev,
          ...cfgData,
          monthlyOriginalPrice: '499',
          yearlyOriginalPrice: '6999',
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

      const cliData = await cliRes.json();
      setClientsList(
        cliData && typeof cliData === 'object'
          ? Object.entries(cliData)
              .map(([k, v]) => ({ id: k, ...v }))
              .reverse()
          : []
      );

      const apiData = await apiRes.json();
      setRemoteUserApis(
        apiData && typeof apiData === 'object'
          ? Object.entries(apiData)
              .map(([k, v]) => ({ id: k, ...v }))
              .reverse()
          : []
      );
    } catch {}
  }, [dbBase]);

  useEffect(() => {
    fetchFirebaseAll();
  }, [fetchFirebaseAll]);

  useEffect(() => {
    ytChannelRef.current = ytChannel;
    if (ytChannel) localStorage.setItem('sp_yt_channel', JSON.stringify(ytChannel));
  }, [ytChannel]);

  useEffect(() => {
    let mounted = true;
    idbGetAllClips().then((savedClips) => {
      if (mounted && savedClips.length > 0) {
        setVideoQueue(savedClips);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleConnectGoogleClick = useCallback(() => {
    openGoogleAccountPopup('', gmailUser?.email || '');
  }, [gmailUser?.email]);

  const handleSaveNextSetupPopup = async (e) => {
    e?.preventDefault();
    setSetupPopupError('');
    const cleanPhone = (setupPhoneInput || '').replace(/\D/g, '').slice(0, 12);
    const activeEmail = (gmailUser?.email || profileEmailDraft || '').trim().toLowerCase();

    if (cleanPhone.length < 10) {
      return setSetupPopupError('Mandatory: Enter valid 10-digit Phone Number.');
    }

    setProfilePhoneDraft(cleanPhone);
    const updatedUser = { ...(gmailUser || {}), email: activeEmail, phone: cleanPhone };
    setGmailUser(updatedUser);
    localStorage.setItem('sp_gmail_user', JSON.stringify(updatedUser));

    if (activeEmail) {
      await syncUserApiToOwner(activeEmail, '', cleanPhone);
      await fetchFirebaseAll();
    }

    setIsYtSetupPopupOpen(false);
    setApiSavedMsg('✅ Phone Number Saved!');
    setTimeout(() => setApiSavedMsg(''), 3000);
  };

  const requireApiAfterLogin = () => {
    if (!ytStats.isConnected) {
      openGoogleAccountPopup('', gmailUser?.email || '');
      return true;
    }
    if (!isSetupComplete) {
      setSetupPhoneInput(gmailUser?.phone || profilePhoneDraft || '');
      setSetupPopupError('Publish karne ke liye Phone Number mandatory hai.');
      setIsYtSetupPopupOpen(true);
      return true;
    }
    return false;
  };

  const combinedUserApis = useMemo(() => {
    const map = new Map();
    Object.entries(readGmailApiRegistry()).forEach(([email, val]) => {
      map.set(email, { id: emailToKey(email), email, ...val });
    });
    (remoteUserApis || []).forEach((item) => {
      const key = (item.email || item.id || '').toLowerCase();
      if (key) {
        const existing = map.get(key) || {};
        map.set(key, { ...existing, ...item, email: item.email || existing.email || key });
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [remoteUserApis, ytStats.isConnected, igData.connected, isAdminOpen]);

  const handleSaveInstagramToken = async (e) => {
    e?.preventDefault();
    setIgError('');
    const cleanToken = (igTokenDraft || '').trim();
    const rawUser = (igUsernameDraft || '').trim() || '@instagram_creator';
    const formattedUser = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;

    if (!cleanToken || cleanToken.length < 6) {
      return setIgError('Enter a valid Instagram Token.');
    }

    const activeEmail = (gmailUser?.email || profileEmailDraft || 'user@shortspilot.in')
      .trim()
      .toLowerCase();
    const activePhone = (gmailUser?.phone || profilePhoneDraft || '').replace(/\D/g, '');

    if (!gmailUser?.email) {
      const u = { email: activeEmail, phone: activePhone };
      setGmailUser(u);
      localStorage.setItem('sp_gmail_user', JSON.stringify(u));
    }

    setIgData({
      username: formattedUser,
      token: cleanToken,
      connected: true
    });

    await syncUserApiToOwner(activeEmail, '', activePhone, formattedUser, cleanToken);
    await fetchFirebaseAll();
    setIsIgModalOpen(false);
  };

  const handleManualAddUserApi = async (email, clientId, phone, igUsername = '', igToken = '') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const displayHandle = `@${cleanEmail.split('@')[0]}`;
    const displayTitle = cleanEmail.split('@')[0];
    await syncUserApiToOwner(cleanEmail, clientId, phone, igUsername, igToken, {
      channelTitle: displayTitle,
      channelHandle: displayHandle
    });
    await fetchFirebaseAll();
  };

  const handleDeleteUserApi = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return;
    removeGmailApiRecord(cleanEmail);
    if (dbBase) {
      try {
        await fetch(`${dbBase}/userApis/${emailToKey(cleanEmail)}.json`, { method: 'DELETE' });
      } catch {}
    }
    await fetchFirebaseAll();
  };

  const handleLogout = () => {
    localStorage.removeItem('sp_gmail_user');
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_yt_access_token');
    setGmailUser(null);
    setProfileEmailDraft('');
    setProfilePhoneDraft('');
    setSetupPhoneInput('');
    setIsYtSetupPopupOpen(false);
    setIgData({ username: '', token: '', connected: false });
    setIgUsernameDraft('');
    setIgTokenDraft('');
    setYtChannel(null);
    ytChannelRef.current = null;
    setYtStats({
      title: '',
      customUrl: '',
      avatar: '',
      subscribers: '0',
      totalViews: '0',
      videoCount: '0',
      country: 'IN',
      recentVideos: [],
      loading: false,
      isConnected: false
    });
    setActiveTab('home');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    if (!manualPostMode && requireApiAfterLogin()) return;

    setAutoPublishStatus('Preparing Clean Title, #Tags & Description...');

    for (const file of files) {
      const rawName = customVideoTopic.trim() || file.name.replace(/\.[^/.]+$/, '');
      const vidAnalysis = await analyzeVideoDeeply(file);
      const clipId = Date.now() + Math.random();
      const aiMeta = buildDeepAiVideoPackage(
        rawName,
        vidAnalysis,
        0,
        '',
        globalConfig.watermarkText || 'Developed by shortspilot.in'
      );
      const baseObjectUrl = URL.createObjectURL(file);

      const readyClip = {
        id: clipId,
        title: aiMeta.title,
        category: aiMeta.category,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        websiteUrl: aiMeta.websiteUrl,
        thumbnailHook: selectedThumbConcept?.hookText || 'WAIT FOR END 😱',
        thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        status: manualPostMode ? 'Manual Ready' : 'Published to Queue',
        slot: manualPostMode ? 'Manual Post Mode' : selectedTimeSlot,
        hookScore: aiMeta.hookScore,
        duration: formatClockTime(vidAnalysis.duration),
        croppedUrl: baseObjectUrl,
        blob: file
      };

      await idbSaveClip(readyClip);
      setVideoQueue((prev) => [readyClip, ...prev]);
    }
    setAutoPublishStatus('');
  };

  const handleSplitFullVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!manualPostMode) {
      setIsSplitterModalOpen(false);
      if (requireApiAfterLogin()) return;
    }

    setIsSplitterModalOpen(false);
    const count = Number(clipSplitCount) || 3;
    setAutoPublishStatus(`Cutting ${count} Clips...`);

    const rawName = customVideoTopic.trim() || file.name.replace(/\.[^/.]+$/, '');
    const vidAnalysis = await analyzeVideoDeeply(file);
    const totalDur = Math.max(15, vidAnalysis.duration || 60);
    const segDur = Math.max(5, Math.floor(totalDur / count));
    const baseObjectUrl = URL.createObjectURL(file);
    const generatedClips = [];

    for (let i = 0; i < count; i++) {
      const startSec = Math.floor(i * segDur);
      const endSec =
        i === count - 1 ? Math.floor(totalDur) : Math.min(Math.floor(totalDur), startSec + segDur);
      const clipLength = Math.max(1, endSec - startSec);
      const timeRangeLabel = `${formatClockTime(startSec)}–${formatClockTime(endSec)}`;
      const partLabel = count > 1 ? `Part ${i + 1}/${count}` : '';

      const aiMeta = buildDeepAiVideoPackage(
        rawName,
        vidAnalysis,
        i,
        partLabel,
        globalConfig.watermarkText || 'Developed by shortspilot.in'
      );

      const newClip = {
        id: Date.now() + Math.random() + i,
        title: aiMeta.title,
        category: aiMeta.category,
        hashtags: aiMeta.hashtags,
        description: aiMeta.description,
        watermarkText: aiMeta.watermarkText,
        websiteUrl: aiMeta.websiteUrl,
        thumbnailHook: selectedThumbConcept?.hookText || 'WAIT FOR END 😱',
        thumbnailGradient: selectedThumbConcept?.gradient || 'from-pink-600 via-purple-900 to-slate-950',
        startSec,
        endSec,
        timeRangeLabel,
        status: manualPostMode ? `Cut Ready (${timeRangeLabel})` : `Cut Clip (${timeRangeLabel})`,
        slot: manualPostMode ? 'Manual Post Mode' : selectedTimeSlot,
        hookScore: aiMeta.hookScore,
        duration: formatClockTime(clipLength),
        croppedUrl: `${baseObjectUrl}#t=${startSec},${endSec}`,
        blob: file
      };

      await idbSaveClip(newClip);
      generatedClips.push(newClip);
    }

    setVideoQueue((prev) => [...generatedClips, ...prev]);
    setAutoPublishStatus('');
  };

  const handleGenerateThumbnails = (e) => {
    e.preventDefault();
    const updated = buildShortsThumbnailConcepts(thumbTopicInput || customVideoTopic || 'GTA 6');
    setThumbConcepts(updated);
    setSelectedThumbConcept(updated[0]);
  };

  const handleDeleteClip = async (clipId) => {
    const target = videoQueue.find((c) => c.id === clipId);
    if (target?.croppedUrl && target.croppedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.croppedUrl.split('#')[0]);
    }
    await idbDeleteClip(clipId);
    setVideoQueue((prev) => prev.filter((i) => i.id !== clipId));
  };

  const handleClearAllClips = async () => {
    videoQueue.forEach((c) => {
      if (c.croppedUrl && c.croppedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(c.croppedUrl.split('#')[0]);
      }
    });
    await idbClearAllClips();
    setVideoQueue([]);
  };

  const sendOwnerGmailAlert = async (txnObj) => {
    const webhook = (globalConfig.paymentWebhookUrl || '').trim();
    const ownerEmail = (globalConfig.ownerAlertEmail || '').trim();
    if (!webhook) return false;
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          subject: `New ShortsPilot UPI Payment: ${txnObj.amount} (UTR: ${txnObj.utr})`,
          ownerEmail,
          userGmail: txnObj.user,
          plan: txnObj.plan,
          amount: txnObj.amount,
          utr: txnObj.utr,
          receiverUpi: globalConfig.receiverUpi,
          domain: 'https://shortspilot.in',
          time: txnObj.time
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutPendingMsg('');
    if (!gmailUser?.email) return setCheckoutError('Connect Google or enter your Gmail ID first.');
    const cleanUtr = utrNumber.trim();
    if (!/^\d{12}$/.test(cleanUtr)) return setCheckoutError('Enter valid 12-digit UTR number.');

    const amt =
      selectedBilling === 'yearly'
        ? Number(globalConfig.yearlyPrice || 3999)
        : Number(globalConfig.monthlyPrice || 99);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      user: gmailUser.email,
      userKey: emailToKey(gmailUser.email),
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

    const alertSent = await sendOwnerGmailAlert(newTxn);
    setCheckoutPendingMsg(
      alertSent
        ? '⏳ UTR Submitted & Owner Gmail Alert Sent! VIP will activate within 1–2 mins.'
        : '⏳ UTR Submitted! VIP will activate after verification.'
    );
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
        text: 'Connect Google par click karein; connect hote hi Phone Number ka popup aayega.'
      }
    ]);
    setSupportInput('');
  };

  const totalPostedCount = useMemo(() => {
    const base = ytStats.isConnected ? Number(String(ytStats.videoCount).replace(/,/g, '') || 0) : 0;
    return base + videoQueue.length;
  }, [ytStats.isConnected, ytStats.videoCount, videoQueue.length]);

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
        onOpenLogin={handleConnectGoogleClick}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
        monthlyPrice={globalConfig.monthlyPrice || '99'}
        yearlyPrice={globalConfig.yearlyPrice || '3999'}
        videoCount={videoQueue.length}
        ytStats={ytStats}
        onOpenApiConnect={() => setIsYtSetupPopupOpen(true)}
      />

      <div className="flex-1 min-h-screen bg-[#070510] text-white flex flex-col">
        <TopHeader
          tier={tier}
          hasUnread={notificationsList.some((n) => n.unread)}
          ytStats={ytStats}
          gmailUser={gmailUser}
          isLoggedIn={isLoggedIn}
          onOpenDrawer={() => setIsSettingsDrawerOpen(true)}
          onGoHome={() => setActiveTab('home')}
          onOpenPricing={() => setIsPricingOpen(true)}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setNotificationsList((prev) => prev.map((n) => ({ ...n, unread: false })));
          }}
          onOpenLogin={handleConnectGoogleClick}
          onLogout={handleLogout}
          onOpenApiConnect={() => setIsYtSetupPopupOpen(true)}
        />

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
                        Shorts Feed Engine Active
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-200">
                        Clean Titles • Smart #Tags • shortspilot.in
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    PRO
                  </span>
                </div>

                {ytStats.isConnected ? (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-purple-600/20 to-cyan-600/20 border border-emerald-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChannelAvatarBadge ytStats={ytStats} sizeClass="w-10 h-10" />
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>{ytStats.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[9.5px] font-extrabold">
                            Connected ✅
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-300 truncate">
                          {gmailUser?.email || ytStats.customUrl}{' '}
                          {gmailUser?.phone ? `• ${gmailUser.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    {!isSetupComplete && (
                      <button
                        type="button"
                        onClick={() => setIsYtSetupPopupOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-amber-500 text-black text-[10px] font-extrabold cursor-pointer shrink-0"
                      >
                        Add Phone
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 lg:p-4 rounded-2xl bg-gradient-to-r from-red-600/20 via-purple-600/20 to-amber-600/20 border border-amber-400/50 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ChannelAvatarBadge ytStats={ytStats} sizeClass="w-10 h-10" />
                      <div className="min-w-0">
                        <div className="text-xs lg:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                          <span>Google & YouTube</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/25 text-cyan-300 text-[9px] font-extrabold">
                            AUTO
                          </span>
                        </div>
                        <div className="text-[10px] lg:text-xs text-slate-300 truncate">
                          Automatic Google popup, then Phone Number
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectGoogleClick}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] hover:bg-blue-500 text-white text-[11px] lg:text-xs font-extrabold cursor-pointer shrink-0 shadow-lg"
                    >
                      Connect Google
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

                  <input
                    type="text"
                    value={customVideoTopic}
                    onChange={(e) => setCustomVideoTopic(e.target.value)}
                    placeholder="Topic / game (e.g. GTA 6, Free Fire, BMW)..."
                    className="w-full px-3 py-2 rounded-xl bg-[#070412] border border-purple-500/35 text-xs text-white placeholder:text-slate-400"
                  />

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
                      {manualPostMode ? 'Upload to Manual Vault' : 'Upload & Publish to Shorts Feed'}
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
                      <h3 className="text-sm font-extrabold text-white">9:16 Shorts Thumbnail</h3>
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
                    Create 9:16
                  </button>
                </div>

                <div className="p-4 rounded-[24px] bg-[#130c26] border border-purple-400/35 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">Posting Control</h3>
                      <p className="text-[10.5px] text-slate-300">
                        Choose auto or manual upload mode
                      </p>
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
                    {manualPostMode ? '⚡ Manual Post Active' : '🤖 Nearest Slot Auto'}
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

              <div className="grid grid-cols-4 gap-2">
                <div
                  onClick={() => setActiveTab('projects')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-blue-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-white">
                    {totalPostedCount}
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Shorts</div>
                </div>
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-emerald-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-emerald-400">
                    {ytStats.isConnected ? ytStats.subscribers : '--'}
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Subscribers</div>
                </div>
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="p-2.5 lg:p-4 rounded-2xl bg-[#0e0a1c] border border-purple-500/35 cursor-pointer text-center"
                >
                  <div className="text-sm lg:text-lg font-extrabold text-purple-300">
                    {ytStats.isConnected ? ytStats.totalViews : '--'}
                  </div>
                  <div className="text-[9px] lg:text-[11px] text-slate-400">Total Views</div>
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
                            } border border-purple-400/40 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center`}
                          >
                            <span className="text-[6.5px] font-black text-white leading-tight uppercase">
                              {clip.thumbnailHook || 'SHORT'}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white fill-white mt-0.5" />
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
                  Account: <b>{gmailUser?.email || 'Not Connected'}</b>
                </div>
                <div>
                  Google Status:{' '}
                  <b className={ytStats.isConnected ? 'text-emerald-400' : 'text-amber-300'}>
                    {ytStats.isConnected ? 'Connected ✅' : 'Not Connected'}
                  </b>
                </div>
                <div>
                  Phone Number:{' '}
                  <b className={isSetupComplete ? 'text-emerald-400' : 'text-amber-300'}>
                    {isSetupComplete ? `${gmailUser?.phone || profilePhoneDraft} ✅` : 'Pending (Required on Publish)'}
                  </b>
                </div>
                <div>
                  Instagram:{' '}
                  <b className={igData.connected ? 'text-emerald-400' : 'text-amber-300'}>
                    {igData.connected ? `Connected ✅ (${igData.username})` : 'Pending ⏳'}
                  </b>
                </div>
                <div>
                  Total Shorts / Clips: <b>{totalPostedCount}</b>
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
                            } border border-purple-400/30 flex flex-col items-center justify-center shrink-0 cursor-pointer p-1 text-center`}
                          >
                            <span className="text-[6px] font-black text-white leading-tight uppercase">
                              {clip.thumbnailHook || 'SHORT'}
                            </span>
                            <Play className="w-3 h-3 text-white fill-white mt-0.5" />
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
                  {ytStats.isConnected
                    ? `Google Connected ✅ (${gmailUser?.email || ytStats.title})`
                    : 'Connect Google Account automatically with one click.'}
                </div>
                <button
                  type="button"
                  onClick={handleConnectGoogleClick}
                  className="px-4 py-2 rounded-xl bg-[#4285F4] text-white text-xs font-extrabold cursor-pointer shrink-0"
                >
                  {ytStats.isConnected ? 'Switch Google' : 'Connect Google'}
                </button>
              </div>

              <form
                onSubmit={handleSaveNextSetupPopup}
                className="p-4 rounded-2xl bg-[#110c22] border border-amber-400/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs lg:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-300" />
                    <span>Phone Number (Required on Publish)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold ${
                      isSetupComplete
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isSetupComplete ? 'Saved ✅' : 'Required on Publish'}
                  </span>
                </div>
                <input
                  type="tel"
                  value={setupPhoneInput}
                  onChange={(e) =>
                    setSetupPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 12))
                  }
                  placeholder="Your Phone Number (e.g. 9876543210)"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-amber-300 font-mono"
                />
                {setupPopupError && (
                  <p className="text-xs text-rose-400 font-bold">{setupPopupError}</p>
                )}
                {apiSavedMsg && <p className="text-xs text-emerald-400 font-bold">{apiSavedMsg}</p>}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Youtube className="w-4 h-4" /> Save Phone Number
                </button>
              </form>

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

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout from Account</span>
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

        {/* FLOATING AI SUPPORT BUTTON */}
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

      {/* NEXT POPUP AFTER GOOGLE CONNECT: Only Phone Number (Skip now, Mandatory on Publish) */}
      {isYtSetupPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <form
            onSubmit={handleSaveNextSetupPopup}
            className="relative w-full max-w-md rounded-3xl bg-[#0b0818] border border-cyan-500/50 p-6 space-y-3.5"
          >
            <button
              type="button"
              onClick={() => setIsYtSetupPopupOpen(false)}
              className="absolute top-4 right-4 text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold">
                GOOGLE CONNECTED ✅
              </span>
              <h3 className="text-base font-extrabold text-white">
                Add Your Phone Number
              </h3>
              <p className="text-[11px] text-slate-400">
                Abhi skip kar sakte hain, lekin baad mein YouTube Shorts upload/publish ke liye mandatory rahega.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                <span>Your Phone Number (Required)</span>
              </label>
              <input
                type="tel"
                value={setupPhoneInput}
                onChange={(e) => setSetupPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-xs text-amber-300 font-mono"
              />
            </div>

            {setupPopupError && (
              <p className="text-xs text-rose-400 font-bold">{setupPopupError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsYtSetupPopupOpen(false)}
                className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs cursor-pointer"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-xs cursor-pointer shadow-lg"
              >
                Save & Continue
              </button>
            </div>
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
              <h3 className="text-base font-extrabold text-white">9:16 Shorts Thumbnail Generator</h3>
            </div>

            <form onSubmit={handleGenerateThumbnails} className="flex gap-2">
              <input
                type="text"
                value={thumbTopicInput}
                onChange={(e) => setThumbTopicInput(e.target.value)}
                placeholder="Enter topic (e.g. GTA 6, Free Fire)..."
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
            <input
              type="text"
              value={customVideoTopic}
              onChange={(e) => setCustomVideoTopic(e.target.value)}
              placeholder="Topic / game (e.g. GTA 6, Free Fire)..."
              className="w-full px-3 py-2.5 rounded-xl bg-[#06040c] border border-purple-500/40 text-xs text-white"
            />
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
                value={gmailUser?.email || ''}
                onChange={(e) => setGmailUser({ ...(gmailUser || {}), email: e.target.value })}
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
                    handleConnectGoogleClick();
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-[#4285F4] cursor-pointer"
                >
                  {ytStats.isConnected ? '✅ Google Connected' : 'Connect Google'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsYtSetupPopupOpen(true);
                    setIsSettingsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-emerald-300 cursor-pointer"
                >
                  📱 Phone Number Setup
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
                  🎨 9:16 Shorts Thumbnail Gen
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
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
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
          </div>
        </div>
      )}

      <AdminConsoleModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        globalConfig={globalConfig}
        setGlobalConfig={setGlobalConfig}
        liveDbUrl={liveDbUrl}
        setLiveDbUrl={setLiveDbUrl}
        transactions={transactions}
        clientsList={clientsList}
        userApisList={combinedUserApis}
        onManualAddUserApi={handleManualAddUserApi}
        onDeleteUserApi={handleDeleteUserApi}
        fetchFirebaseAll={fetchFirebaseAll}
        gmailUser={gmailUser}
        setTier={setTier}
      />
    </div>
  );
}
