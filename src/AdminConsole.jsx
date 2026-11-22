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
  Trash2
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

  const cfg = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...(globalConfig && typeof globalConfig === 'object' ? globalConfig : {})
    }),
    [globalConfig]
  );

  const localUsers = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('sp_user_registry') || '{}');
      if (!raw || typeof raw !== 'object') return [];
      return Object.entries(raw).map(([key, val]) => ({
        key,
        email: val?.email || key,
        name: val?.name || 'Creator',
        plan: val?.plan || 'pro',
        status: val?.status || 'active',
        igUsername: val?.igUsername || '',
        updatedAt: val?.updatedAt || 0
      }));
    } catch {
      return [];
    }
  }, [adminUnlocked, transactions.length]);

  const combinedUsers = useMemo(() => {
    const map = new Map();

    localUsers.forEach((u) => {
      const k = String(u.email || u.key || '').toLowerCase();
      if (!k) return;
      map.set(k, { ...u, email: u.email || k });
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
          status: t?.status || 'active',
          igUsername: '',
          updatedAt: 0
        };
        map.set(em, {
          ...existing,
          plan: t?.plan || existing.plan,
          lastAmount: t?.amount || existing.lastAmount || '',
          lastTxnId: t?.id || existing.lastTxnId || '',
          lastStatus: t?.status || existing.lastStatus || ''
        });
      });
    }

    const q = userSearch.trim().toLowerCase();
    const list = Array.from(map.values());
    if (!q) return list;
    return list.filter(
      (item) =>
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.name || '').toLowerCase().includes(q) ||
        String(item.plan || '').toLowerCase().includes(q)
    );
  }, [localUsers, transactions, userSearch]);

  const totalRevenue = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.reduce((sum, item) => {
      const direct = Number(item?.numericAmount);
      if (Number.isFinite(direct) && direct > 0) return sum + direct;
      const match = String(item?.amount || '').match(/(\d+(?:\.\d+)?)/);
      return sum + (match ? Number(match[1]) || 0 : 0);
    }, 0);
  }, [transactions]);

  const handleSaveAllConfig = async () => {
    setSaving(true);
    try {
      localStorage.setItem('sp_global_config', JSON.stringify(cfg));
      localStorage.setItem('sp_firebase_url', liveDbUrl || '');
    } catch {}

    setTier?.('pro');

    if (dbBase) {
      try {
        await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfg)
        });
      } catch {}
    }

    setSaving(false);
    onSavedNotice?.('✅ All Admin Config Saved & Synced');
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
        status: 'active',
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
            status: 'active',
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
            (item) =>
              (item.firebaseKey || item.id) !== (txn.firebaseKey || txn.id)
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
            <div className="text-sm font-extrabold text-white">Owner Master Admin Console</div>
            <div className="text-[11px] text-slate-400">
              Enter Owner PIN to access all pricing, RTDB, users & transactions data
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
            Unlock Master Admin Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-xs">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-[#120d24] border border-cyan-500/35 text-center">
          <div className="text-sm font-extrabold text-cyan-300">
            {Array.isArray(transactions) ? transactions.length : 0}
          </div>
          <div className="text-[10px] text-slate-400">Total Txns</div>
        </div>
        <div className="p-3 rounded-2xl bg-[#120d24] border border-emerald-500/35 text-center">
          <div className="text-sm font-extrabold text-emerald-400">₹{totalRevenue}</div>
          <div className="text-[10px] text-slate-400">Logged Volume</div>
        </div>
        <div className="p-3 rounded-2xl bg-[#120d24] border border-purple-500/35 text-center">
          <div className="text-sm font-extrabold text-purple-300">{combinedUsers.length}</div>
          <div className="text-[10px] text-slate-400">Known Users</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-purple-500/35 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
            <CreditCard className="w-4 h-4" />
            <span>Pricing, Offer & Brand Settings</span>
          </div>
          <button
            type="button"
            onClick={() => fetchFirebaseData?.()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10.5px] font-extrabold cursor-pointer transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync RTDB</span>
          </button>
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
              placeholder="99"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Monthly Strike (₹)</label>
            <input
              type="text"
              value={cfg.monthlyOriginalPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, monthlyOriginalPrice: e.target.value }))
              }
              placeholder="499"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Yearly Price (₹)</label>
            <input
              type="text"
              value={cfg.yearlyPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, yearlyPrice: e.target.value }))
              }
              placeholder="3999"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Yearly Strike (₹)</label>
            <input
              type="text"
              value={cfg.yearlyOriginalPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, yearlyOriginalPrice: e.target.value }))
              }
              placeholder="6999"
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
              placeholder="SAVE200"
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
              placeholder="200"
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
            placeholder="Developed by shortspilot.in"
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
              placeholder="9767905729@paytm"
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
          <label className="text-[10px] text-slate-400 font-semibold">Owner Alert Email</label>
          <input
            type="email"
            value={cfg.ownerAlertEmail || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, ownerAlertEmail: e.target.value }))
            }
            placeholder="owner@shortspilot.in"
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Payment Webhook URL</label>
          <input
            type="text"
            value={cfg.paymentWebhookUrl || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, paymentWebhookUrl: e.target.value }))
            }
            placeholder="https://..."
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
          />
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
            placeholder="https://shortspilot-live-default-rtdb.firebaseio.com"
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
          />
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
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-purple-300 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Users & Plan Access ({combinedUsers.length})</span>
          </span>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search user..."
            className="px-2.5 py-1 rounded-lg bg-[#06040c] border border-slate-700 text-[10.5px] text-white w-32"
          />
        </div>

        {combinedUsers.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-1.5">No users recorded yet.</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {combinedUsers.map((u) => (
              <div
                key={u.email}
                className="p-2.5 rounded-xl bg-[#080512] border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{u.email}</div>
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
                    Yearly VIP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Transactions History ({Array.isArray(transactions) ? transactions.length : 0})</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Live RTDB
          </span>
        </div>

        {!Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-2">No transactions found yet.</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
