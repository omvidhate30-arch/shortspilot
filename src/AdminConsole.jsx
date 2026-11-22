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

  const combinedUsers = useMemo(() => {
    const map = new Map();
    try {
      const raw = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      Object.entries(raw || {}).forEach(([key, val]) => {
        const em = String(val?.email || key).trim().toLowerCase();
        if (!em) return;
        map.set(em, {
          email: em,
          name: val?.name || 'Creator',
          plan: val?.plan || 'pro',
          status: val?.status || 'active',
          isBlocked: cfg.blockedEmails.includes(em) || val?.status === 'blocked'
        });
      });
    } catch {}

    cfg.blockedEmails.forEach((em) => {
      if (!map.has(em)) {
        map.set(em, { email: em, name: em.split('@')[0], plan: 'free', status: 'blocked', isBlocked: true });
      }
    });

    if (Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const em = String(t?.user || '').trim().toLowerCase();
        if (!em) return;
        const prev = map.get(em) || { email: em, name: em.split('@')[0], plan: 'pro', status: 'active' };
        map.set(em, {
          ...prev,
          plan: t?.plan || prev.plan,
          lastAmount: t?.amount || prev.lastAmount || '',
          isBlocked: cfg.blockedEmails.includes(em) || prev.status === 'blocked'
        });
      });
    }

    const q = userSearch.trim().toLowerCase();
    const arr = Array.from(map.values());
    if (!q) return arr;
    return arr.filter(
      (u) =>
        u.email.includes(q) ||
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.plan || '').toLowerCase().includes(q) ||
        (u.isBlocked ? 'blocked' : 'active').includes(q)
    );
  }, [cfg.blockedEmails, transactions, userSearch]);

  const totalRevenue = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.reduce((sum, item) => {
      const direct = Number(item?.numericAmount);
      if (Number.isFinite(direct) && direct > 0) return sum + direct;
      const m = String(item?.amount || '').match(/(\d+(?:\.\d+)?)/);
      return sum + (m ? Number(m[1]) || 0 : 0);
    }, 0);
  }, [transactions]);

  const persistConfig = async (nextConfig, noticeText = '✅ Config Saved') => {
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
    const shouldBlock = typeof forceBlock === 'boolean' ? forceBlock : !cfg.blockedEmails.includes(cleanEmail);
    const nextBlocked = shouldBlock
      ? Array.from(new Set([...cfg.blockedEmails, cleanEmail]))
      : cfg.blockedEmails.filter((x) => x !== cleanEmail);

    try {
      const reg = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      reg[cleanEmail] = {
        ...(reg[cleanEmail] || {}),
        email: cleanEmail,
        status: shouldBlock ? 'blocked' : 'active',
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
          body: JSON.stringify({ email: cleanEmail, status: shouldBlock ? 'blocked' : 'active', blocked: shouldBlock, updatedAt: Date.now() })
        });
      } catch {}
    }

    await persistConfig({ ...cfg, blockedEmails: nextBlocked }, shouldBlock ? `🚫 Blocked: ${cleanEmail}` : `✅ Unblocked: ${cleanEmail}`);
  };

  const handleUpdateUserPlan = async (email, nextPlan) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return;
    try {
      const reg = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      reg[cleanEmail] = { ...(reg[cleanEmail] || {}), email: cleanEmail, plan: nextPlan, updatedAt: Date.now() };
      localStorage.setItem('sp_user_registry', JSON.stringify(reg));
    } catch {}
    if (dbBase) {
      try {
        const safeKey = cleanEmail.replace(/[.#$[\]@]/g, '_');
        await fetch(`${dbBase}/users/${safeKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, plan: nextPlan, updatedAt: Date.now() })
        });
      } catch {}
    }
    onSavedNotice?.(`✅ ${cleanEmail} -> ${nextPlan.toUpperCase()}`);
  };

  const handleDeleteTransaction = async (txn) => {
    if (!txn) return;
    setTransactions?.((prev) =>
      Array.isArray(prev) ? prev.filter((item) => (item.firebaseKey || item.id) !== (txn.firebaseKey || txn.id)) : []
    );
    if (dbBase && txn.firebaseKey) {
      try {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, { method: 'DELETE' });
      } catch {}
    }
  };

  if (!adminUnlocked) {
    return (
      <div className="rounded-3xl bg-[#110c22] border border-purple-500/40 p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">Full Website Control Console</div>
            <div className="text-[11px] text-slate-400">Enter Owner PIN to unlock controls</div>
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
          <button type="submit" className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold cursor-pointer">
            Unlock Admin Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-xs">
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-2xl bg-[#120d24] border border-cyan-500/35 text-center">
          <div className="text-sm font-extrabold text-cyan-300">{Array.isArray(transactions) ? transactions.length : 0}</div>
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
            <Globe className="w-4 h-4" /> Website Controls
          </span>
          <button type="button" onClick={() => fetchFirebaseData?.()} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Sync RTDB
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" /> YT Auto-Upload
          </span>
          <button
            type="button"
            onClick={() => setGlobalConfig((prev) => ({ ...prev, ytAutoUploadActive: prev?.ytAutoUploadActive === false ? true : false }))}
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.ytAutoUploadActive !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {cfg.ytAutoUploadActive !== false ? 'ENABLED' : 'PAUSED'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Shorts-Only (#Shorts)
          </span>
          <button
            type="button"
            onClick={() => setGlobalConfig((prev) => ({ ...prev, shortsOnlyMode: prev?.shortsOnlyMode === false ? true : false }))}
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.shortsOnlyMode !== false ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700/40 text-slate-300'
            }`}
          >
            {cfg.shortsOnlyMode !== false ? 'ACTIVE' : 'STANDARD'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#080512] border border-slate-800">
          <span className="flex items-center gap-1.5 font-bold text-slate-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Maintenance Lock
          </span>
          <button
            type="button"
            onClick={() => setGlobalConfig((prev) => ({ ...prev, maintenanceMode: !prev?.maintenanceMode }))}
            className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer ${
              cfg.maintenanceMode ? 'bg-rose-500/25 text-rose-300' : 'bg-white/5 text-slate-300'
            }`}
          >
            {cfg.maintenanceMode ? 'LOCKED ON' : 'OFF'}
          </button>
        </div>

        <input
          type="text"
          value={cfg.announcementBanner || ''}
          onChange={(e) => setGlobalConfig((prev) => ({ ...prev, announcementBanner: e.target.value }))}
          placeholder="Site banner notice..."
          className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
        />
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-rose-500/35 space-y-2.5">
        <div className="font-extrabold text-rose-300 flex items-center gap-1.5">
          <Ban className="w-4 h-4" /> Block / Unblock Users ({cfg.blockedEmails.length} Blocked)
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const em = blockEmailInput.trim().toLowerCase();
            if (!em) return;
            setBlockEmailInput('');
            await handleToggleBlockUser(em, true);
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            value={blockEmailInput}
            onChange={(e) => setBlockEmailInput(e.target.value)}
            placeholder="Enter user email to block..."
            className="flex-1 px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
          <button type="submit" className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] cursor-pointer">
            Block
          </button>
        </form>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-extrabold text-purple-300 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Users ({combinedUsers.length})
          </span>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search user..."
            className="px-2.5 py-1 rounded-lg bg-[#06040c] border border-slate-700 text-[10.5px] text-white w-32"
          />
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {combinedUsers.map((u) => (
            <div key={u.email} className="p-2.5 rounded-xl bg-[#080512] border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{u.email}</div>
                <div className="text-[10px] text-slate-400">
                  Plan: <b className="text-cyan-300 uppercase">{u.plan || 'pro'}</b> •{' '}
                  <b className={u.isBlocked ? 'text-rose-400' : 'text-emerald-400'}>
                    {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                  </b>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => handleUpdateUserPlan(u.email, 'monthly')} className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[9.5px] font-extrabold cursor-pointer">
                  Monthly
                </button>
                <button type="button" onClick={() => handleUpdateUserPlan(u.email, 'yearly')} className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[9.5px] font-extrabold cursor-pointer">
                  VIP
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleBlockUser(u.email)}
                  className={`px-2 py-1 rounded-lg text-[9.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer ${
                    u.isBlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {u.isBlocked ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  <span>{u.isBlocked ? 'Unblock' : 'Block'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-purple-500/35 space-y-2.5">
        <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4" /> Pricing, Coupon, Watermark, UPI & RTDB
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={cfg.monthlyPrice || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, monthlyPrice: e.target.value }))} placeholder="Monthly Price" className="px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
          <input type="text" value={cfg.yearlyPrice || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, yearlyPrice: e.target.value }))} placeholder="Yearly Price" className="px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
          <input type="text" value={cfg.couponCode || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, couponCode: e.target.value }))} placeholder="Coupon Code" className="px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono" />
          <input type="text" value={cfg.couponDiscount || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, couponDiscount: e.target.value }))} placeholder="Discount ₹" className="px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
        </div>
        <input type="text" value={cfg.watermarkText || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, watermarkText: e.target.value }))} placeholder="Watermark / Credit" className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white" />
        <input type="text" value={cfg.receiverUpi || ''} onChange={(e) => setGlobalConfig((p) => ({ ...p, receiverUpi: e.target.value }))} placeholder="Receiver UPI" className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono" />
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Database className="w-3 h-3 text-purple-300" /> Firebase RTDB URL
        </div>
        <input type="text" value={liveDbUrl || ''} onChange={(e) => setLiveDbUrl(e.target.value)} placeholder="https://..." className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono" />
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setTier?.('pro');
            await persistConfig(cfg, '✅ All Config Saved & Synced');
            setSaving(false);
          }}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Config & Sync'}</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-slate-800 space-y-2">
        <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Transactions ({Array.isArray(transactions) ? transactions.length : 0})
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {(Array.isArray(transactions) ? transactions : []).slice(0, 20).map((t, idx) => (
            <div key={t.firebaseKey || t.id || idx} className="p-2.5 rounded-xl bg-[#080512] border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <div className="min-w-0 truncate">
                <b className="text-white">{t.user || 'user@gmail.com'}</b> • <span className="text-emerald-300 font-bold">{t.amount}</span> • <span className="font-mono text-cyan-300">{t.id}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px]">{t.status || 'Checkout Opened'}</span>
                <button type="button" onClick={() => handleDeleteTransaction(t)} className="p-1 text-rose-400 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
