import React from 'react';
import { Lock, RefreshCw, Save, CreditCard, Database, CheckCircle2 } from 'lucide-react';

export default function AdminConsole({
  adminUnlocked = false,
  setAdminUnlocked = () => {},
  adminPinInput = '',
  setAdminPinInput = () => {},
  adminError = '',
  setAdminError = () => {},
  globalConfig = {},
  setGlobalConfig = () => {},
  liveDbUrl = '',
  setLiveDbUrl = () => {},
  transactions = [],
  fetchFirebaseData = () => {},
  dbBase = '',
  setTier = () => {},
  onSavedNotice = () => {}
}) {
  const handleSaveConfig = async () => {
    try {
      localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
      localStorage.setItem('sp_firebase_url', liveDbUrl);
    } catch {}

    setTier?.('pro');

    if (dbBase) {
      try {
        await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(globalConfig)
        });
      } catch {}
    }

    onSavedNotice?.('✅ Admin Config Saved & Synced');
  };

  if (!adminUnlocked) {
    return (
      <div className="rounded-3xl bg-[#110c22] border border-purple-500/40 p-5 space-y-3.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center">
            <Lock className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white">Owner Admin Console</div>
            <div className="text-[11px] text-slate-400">
              Enter Owner PIN to manage pricing, UPI & RTDB
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (String(adminPinInput || '').trim() === String(globalConfig?.adminPin || '9767905729')) {
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
            Unlock Admin Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 text-xs">
      <div className="p-4 rounded-2xl bg-[#120d24] border border-purple-500/35 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
            <CreditCard className="w-4 h-4" />
            <span>Pricing, Offer & Brand Config</span>
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
              value={globalConfig?.monthlyPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, monthlyPrice: e.target.value }))
              }
              placeholder="99"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Yearly Price (₹)</label>
            <input
              type="text"
              value={globalConfig?.yearlyPrice || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, yearlyPrice: e.target.value }))
              }
              placeholder="3999"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold">Coupon Code</label>
            <input
              type="text"
              value={globalConfig?.couponCode || ''}
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
              value={globalConfig?.couponDiscount || ''}
              onChange={(e) =>
                setGlobalConfig((prev) => ({ ...prev, couponDiscount: e.target.value }))
              }
              placeholder="200"
              className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Watermark / Credit</label>
          <input
            type="text"
            value={globalConfig?.watermarkText || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, watermarkText: e.target.value }))
            }
            placeholder="Developed by shortspilot.in"
            className="w-full px-2.5 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-semibold">Receiver UPI ID</label>
          <input
            type="text"
            value={globalConfig?.receiverUpi || ''}
            onChange={(e) =>
              setGlobalConfig((prev) => ({ ...prev, receiverUpi: e.target.value }))
            }
            placeholder="9767905729@paytm"
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

        <button
          type="button"
          onClick={handleSaveConfig}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Config & Sync</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#120d24] border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-amber-300">
            Transactions ({Array.isArray(transactions) ? transactions.length : 0})
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
            <CheckCircle2 className="w-3 h-3" /> Live Feed
          </span>
        </div>

        {!Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-[11px] text-slate-400 py-2">No transactions found yet.</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {transactions.slice(0, 15).map((t, idx) => (
              <div
                key={t.firebaseKey || t.id || idx}
                className="p-2.5 rounded-xl bg-[#080512] border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
              >
                <div className="min-w-0 truncate">
                  <b className="text-white">{t.user || 'creator@shortspilot.in'}</b> •{' '}
                  <span className="text-emerald-300 font-bold">{t.amount}</span> • ID:{' '}
                  <span className="font-mono text-cyan-300">{t.id}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px] shrink-0">
                  {t.status || 'Checkout Opened'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
