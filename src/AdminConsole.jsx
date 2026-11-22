import React, { useState, useMemo } from 'react';
import {
  Lock,
  RefreshCw,
  Save,
  CreditCard,
  Database,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sliders,
  Trash2,
  Ban,
  UserCheck,
  Globe,
  AlertTriangle
} from 'lucide-react';

const DEFAULT_CONFIG = {
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
  shortsOnlyMode: true,
  maintenanceMode: false,
  announcementBanner: '',
  blockedEmails: [],
  adminPin: '9767905729'
};

export default function AdminConsole({
  adminUnlocked = false,
  setAdminUnlocked = () => {},
  adminPinInput = '',
  setAdminPinInput = () => {},
  adminError = '',
  setAdminError = () => {},
  globalConfig = DEFAULT_CONFIG,
  setGlobalConfig = () => {},
  liveDbUrl = '',
  setLiveDbUrl = () => {},
  transactions = [],
  setTransactions = () => {},
  fetchFirebaseData = () => {},
  dbBase = '',
  setTier = () => {},
  onSavedNotice = () => {}
}) {
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [blockEmailInput, setBlockEmailInput] = useState('');

  const cfg = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...(globalConfig && typeof globalConfig === 'object' ? globalConfig : {}),
      blockedEmails: Array.isArray(globalConfig?.blockedEmails)
        ? globalConfig.blockedEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
        : []
    }),
    [globalConfig]
  );

  const localUsers = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      if (!raw || typeof raw !== 'object') return [];
      return Object.entries(raw).map(([key, val]) => ({
        key,
        email: String(val?.email || key).trim().toLowerCase(),
        name: val?.name || 'Creator',
        plan: val?.plan || 'pro',
        status: val?.status || 'active',
        updatedAt: val?.updatedAt || 0
      }));
    } catch {
      return [];
    }
  }, [adminUnlocked, transactions.length, cfg.blockedEmails.length]);

  const combinedUsers = useMemo(() => {
    const map = new Map();

    localUsers.forEach((u) => {
      if (!u.email) return;
      map.set(u.email, {
        ...u,
        isBlocked: cfg.blockedEmails.includes(u.email) || u.status === 'blocked'
      });
    });

    cfg.blockedEmails.forEach((em) => {
      if (!map.has(em)) {
        map.set(em, {
          key: em,
          email: em,
          name: em.split('@')[0] || 'Blocked User',
          plan: 'free',
          status: 'blocked',
          isBlocked: true,
          updatedAt: 0
        });
      }
    });

    if (Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const em = String(t?.user || '').trim().toLowerCase();
        if (!em) return;
        const existing = map.get(em) || {
          key: em,
          email: em,
          name: em.split('@')[0] || 'Creator',
          plan: t?.plan || 'pro',
          status: 'active',
          updatedAt: 0
        };
        map.set(em, {
          ...existing,
          plan: t?.plan || existing.plan,
          lastAmount: t?.amount || existing.lastAmount || '',
          lastTxnId: t?.id || existing.lastTxnId || '',
          isBlocked: cfg.blockedEmails.includes(em) || existing.status === 'blocked'
        });
      });
    }

    const q = userSearch.trim().toLowerCase();
    const list = Array.from(map.values());
    if (!q) return list;
    return list.filter(
      (item) =>
        item.email.toLowerCase().includes(q) ||
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.plan || '').toLowerCase().includes(q) ||
        (item.isBlocked ? 'blocked' : 'active').includes(q)
    );
  }, [localUsers, transactions, cfg.blockedEmails, userSearch]);

  const totalRevenue = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.reduce((sum, item) => {
      const direct = Number(item?.numericAmount);
      if (Number.isFinite(direct) && direct > 0) return sum + direct;
      const match = String(item?.amount || '').match(/(\d+(?:\.\d+)?)/);
      return sum + (match ? Number(match[1]) || 0 : 0);
    }, 0);
  }, [transactions]);

  const persistConfig = async (nextConfig, noticeText = '✅ Full Website Config Saved') => {
    setGlobalConfig(nextConfig);
    try {
      localStorage.setItem('sp_global_config', JSON.stringify(nextConfig));
      localStorage.setItem('sp_firebase_url', liveDbUrl || '');
    } catch {}

    if (dbBase) {
      try {
        await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextConfig)
        });
      } catch {}
    }

    onSavedNotice?.(noticeText);
  };

  const handleToggleBlockUser = async (email, forceBlock = null) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    const currentlyBlocked = cfg.blockedEmails.includes(cleanEmail);
    const shouldBlock = typeof forceBlock === 'boolean' ? forceBlock : !currentlyBlocked;

    const nextBlocked = shouldBlock
      ? Array.from(new Set([...cfg.blockedEmails, cleanEmail]))
      : cfg.blockedEmails.filter((item) => item !== cleanEmail);

    const nextStatus = shouldBlock ? 'blocked' : 'active';

    try {
      const reg = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      reg[cleanEmail] = {
        ...(reg[cleanEmail] || {}),
        email: cleanEmail,
        status: nextStatus,
        blocked: shouldBlock,
        updatedAt: Date.now()
      };
      localStorage.setItem('sp_user_registry', JSON.stringify(reg));
    } catch {}

    if (dbBase) {
      try {
        const safeKey = cleanEmail.replace(/[.#$[\]@]/g, '_');
        await fetch(`${dbBase}/users/${safeKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            status: nextStatus,
            blocked: shouldBlock,
            updatedAt: Date.now()
          })
        });
      } catch {}
    }

    await persistConfig(
      { ...cfg, blockedEmails: nextBlocked },
      shouldBlock ? `🚫 Blocked: ${cleanEmail}` : `✅ Unblocked: ${cleanEmail}`
    );
  };

  const handleAddBlockEmail = async (e) => {
    e?.preventDefault();
    const clean = blockEmailInput.trim().toLowerCase();
    if (!clean) return;
    setBlockEmailInput('');
    await handleToggleBlockUser(clean, true);
  };

  const handleSaveAllConfig = async () => {
    setSaving(true);
    setTier?.('pro');
    await persistConfig(cfg, '✅ All Website Controls & Pricing Saved');
    setSaving(false);
  };

  const handleUpdateUserPlan = async (email, nextPlan) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      const reg = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      reg[cleanEmail] = {
        ...(reg[cleanEmail] || {}),
        email: cleanEmail,
        plan: nextPlan,
        status: cfg.blockedEmails.includes(cleanEmail) ? 'blocked' : 'active',
        updatedAt: Date.now()
      };
      localStorage.setItem('sp_user_registry', JSON.stringify(reg));
    } catch {}

    if (dbBase) {
      try {
        const safeKey = cleanEmail.replace(/[.#$[\]@]/g, '_');
        await fetch(`${dbBase}/users/${safeKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            plan: nextPlan,
            updatedAt: Date.now()
          })
        });
      } catch {}
    }

    onSavedNotice?.(`✅ Updated ${cleanEmail} -> ${nextPlan.toUpperCase()}`);
  };

  const handleDeleteTransaction = async (txn) => {
    if (!txn) return;
    setTransactions?.((prev) =>
      Array.isArray(prev)
        ? prev.filter(
            (item) => (item.firebaseKey || item.id) !== (txn.firebaseKey || txn.id)
          )
        : []
    );

    if (dbBase && txn.firebaseKey) {
      try {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'DELETE'
        });
      } catch {}
    }
  };

  if (!adminUnlocked) {
    return (
      <div className="rounded-3xl bg-[#110c22] border border-purple-500/40 p-5 space-y-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">Full Website Control Console</div>
            <div className="text-[11px] text-slate-400">
              Enter Owner PIN to block/unblock users, manage site switches & pricing
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (String(adminPinInput || '').trim() === String(cfg.adminPin || '9767905729')) {
              setAdminUnlocked(true);
              setAdminError('');
              fetchFirebaseData?.();
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
          {adminError && <p className="text-xs text-rose-400 font-bold">{adminError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold cursor-pointer transition"
          >
            Unlock Website Control
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-xs">
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-2xl bg-[#120d24] border border-cyan-500/35 text-center">
          <div className="text-sm font-extrabold text-cyan-300">
            {Array.isArray(transactions) ? transactions.length : 0}
          </div>
          <div className="text-[9.5px] text-slate-400">Txns</div>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#120d24] border border-emerald-500/35 text-center">
          <div className="text-sm font-extrabold text-emerald-400">₹{totalRevenue}</div>
          <div className="text-[9.5px] text-slate-400">Revenue</div>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#120d24] border border-purple-500/35 text-center">
          <div className="text-sm font-extrabold text-purple-300">{combinedUsers.length}</div>
          <div className="text-[9.5px] text-slate-400">Users</div>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#120d24] border border-rose-500/35 text-center">
          <div className="text-sm font-extrabold text-rose-400">{cfg.blockedEmails.length}</div>
          <div className="text-[9.5px] text-slate-400">Blocked</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-purple-500/35 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4" />
            <span>Master Website Switches</span>
          </span>
          <button
            type="button"
            onClick={() => fetchFirebaseData?.()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync RTDB</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>YT Auto-Upload Engine</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setGlobalConfig((prev) => ({
                ...prev,
                ytAutoUploadActive: prev?.ytAutoUploadActive === false ? true : false
              }))
            }
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.ytAutoUploadActive !== false
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}
          >
            {cfg.ytAutoUploadActive !== false ? 'ENABLED' : 'PAUSED'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shorts-Only Mode (#Shorts)</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setGlobalConfig((prev) => ({
                ...prev,
                shortsOnlyMode: prev?.shortsOnlyMode === false ? true : false
              }))
            }
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.shortsOnlyMode !== false
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'bg-slate-700/40 text-slate-300 border border-slate-600'
            }`}
          >
            {cfg.shortsOnlyMode !== false ? 'ACTIVE' : 'STANDARD'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Website Maintenance Lock</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setGlobalConfig((prev) => ({
                ...prev,
                maintenanceMode: !prev?.maintenanceMode
              }))
            }
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.maintenanceMode
                ? 'bg-rose-500/25 text-rose-300 border border-rose-400/50'
                : 'bg-white/5 text-slate-300 border border-slate-700'
            }`}
          >
            {cfg.maintenanceMode ? 'LOCKED ON' : 'OFF (LIVE)'}
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Live Site Banner Notice</label>
          <input
            type="text"
            value={cfg.announcementBanner || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, announcementBanner: e.target.value }))
            }
            placeholder="Optional notice shown to users on site..."
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-rose-500/35 space-y-2.5">
        <div className="font-extrabold text-rose-300 flex items-center gap-1.5">
          <Ban className="w-4 h-4" />
          <span>Block / Unblock Users ({cfg.blockedEmails.length} Blocked)</span>
        </div>

        <form onSubmit={handleAddBlockEmail} className="flex gap-2">
          <input
            type="email"
            value={blockEmailInput}
            onChange={(e) => setBlockEmailInput(e.target.value)}
            placeholder="Enter user email to block..."
            className="flex-1 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] cursor-pointer shrink-0"
          >
            Block Email
          </button>
        </form>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-extrabold text-purple-300 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>All Users ({combinedUsers.length})</span>
          </span>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search user or blocked..."
            className="px-2.5 py-1 rounded-lg bg-[#06040c] border border-slate-700 text-[10.5px] text-white w-36"
          />
        </div>

        {combinedUsers.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-1.5">No users found yet.</div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {combinedUsers.map((u) => (
              <div
                key={u.email}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                  u.isBlocked
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : 'bg-[#080512] border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                    <span className="truncate">{u.email}</span>
                    {u.isBlocked ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-300 text-[9px] font-extrabold shrink-0">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Plan: <b className="text-cyan-300 uppercase">{u.plan || 'pro'}</b>
                    {u.lastAmount ? ` • ${u.lastAmount}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateUserPlan(u.email, 'monthly')}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[9.5px] font-extrabold cursor-pointer"
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateUserPlan(u.email, 'yearly')}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[9.5px] font-extrabold cursor-pointer"
                  >
                    VIP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBlockUser(u.email)}
                    className={`px-2 py-1 rounded-lg text-[9.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                      u.isBlocked
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {u.isBlocked ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Unblock</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3" />
                        <span>Block</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-purple-500/35 space-y-3">
        <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
          <CreditCard className="w-4 h-4" />
          <span>Pricing, UPI, Coupons & RTDB Config</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Monthly Price (₹)</label>
            <input
              type="text"
              value={cfg.monthlyPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, monthlyPrice: e.target.value }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Yearly Price (₹)</label>
            <input
              type="text"
              value={cfg.yearlyPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, yearlyPrice: e.target.value }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Coupon Code</label>
            <input
              type="text"
              value={cfg.couponCode || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, couponCode: e.target.value }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Coupon Discount (₹)</label>
            <input
              type="text"
              value={cfg.couponDiscount || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, couponDiscount: e.target.value }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Watermark / Credit Text</label>
          <input
            type="text"
            value={cfg.watermarkText || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, watermarkText: e.target.value }))
            }
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Receiver UPI ID</label>
            <input
              type="text"
              value={cfg.receiverUpi || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, receiverUpi: e.target.value }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Free Clip Limit</label>
            <input
              type="number"
              value={cfg.freeLimit ?? 3}
              onChange={(e) =>
                setGlobalConfig((prev) => ({
                  ...prev,
                  freeLimit: Number(e.target.value) || 0
                }))
              }
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <Database className="w-3 h-3 text-purple-300" />
            <span>Firebase RTDB URL</span>
          </label>
          <input
            type="text"
            value={liveDbUrl || ''}
            onChange={(e) => setLiveDbUrl(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAllConfig}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Config & Sync'}</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Transactions History ({Array.isArray(transactions) ? transactions.length : 0})</span>
          </span>
        </div>

        {!Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-2">No transactions found yet.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {transactions.slice(0, 20).map((t, idx) => (
              <div
                key={t.firebaseKey || t.id || idx}
                className="p-2.5 rounded-xl bg-[#080512] border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="truncate">
                    <b className="text-white">{t.user || 'creator@shortspilot.in'}</b> •{' '}
                    <span className="text-emerald-300 font-bold">{t.amount}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    ID: <span className="font-mono text-cyan-300">{t.id}</span>
                    {t.time ? ` • ${t.time}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px]">
                    {t.status || 'Checkout Opened'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(t)}
                    title="Delete transaction"
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
