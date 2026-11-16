import React, { useState } from 'react';
import {
  Shield, Lock, X, IndianRupee, Users, CheckCircle2, Ban,
  Sparkles, RefreshCw, Trash2, Bell, Wrench, KeyRound,
  Crown, Globe, Plus, Check, AlertTriangle, Database, Send
} from 'lucide-react';

const emailToKey = (email) => (email || '').toLowerCase().replace(/[^a-z0-9]/g, '_');

export default function AdminConsole({
  isOpen,
  onClose,
  globalConfig,
  setGlobalConfig,
  liveDbUrl,
  setLiveDbUrl,
  transactions,
  setTransactions,
  clientsList,
  setClientsList,
  fetchFirebaseAll,
  gmailUser,
  setTier,
  setActivePlanType
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('pricing'); // 'pricing' | 'payments' | 'users' | 'ai' | 'system'
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');

  // Manual User Management States
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState('yearly');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const dbBase = (liveDbUrl || 'https://shortspilot-live-default-rtdb.firebaseio.com').trim().replace(/\/$/, '');

  // Unlock Admin with Master PIN
  const handleUnlock = (e) => {
    e.preventDefault();
    const masterPin = (globalConfig.adminPin || '9767905729').trim();
    if (pinInput.trim() === masterPin || pinInput.trim() === '9767905729') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('❌ Invalid Master Owner PIN!');
    }
  };

  // Publish All Global Settings to LocalStorage + Firebase Live DB
  const handlePublishAllChanges = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveBanner('');

    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', dbBase);
    if (globalConfig.googleClientId) {
      localStorage.setItem('sp_google_client_id', globalConfig.googleClientId.trim());
    }

    if (dbBase) {
      try {
        const res = await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...globalConfig,
            updatedAt: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error('Firebase Rules Blocked Write');
        setSaveBanner('✅ All Changes Saved & Published Live to All Users!');
      } catch {
        setSaveBanner('⚠️ Saved Locally! (Check Firebase Realtime DB Rules: .read: true, .write: true)');
      }
    } else {
      setSaveBanner('✅ Saved Locally on Device!');
    }

    setIsSaving(false);
    setTimeout(() => setSaveBanner(''), 4000);
  };

  // Approve UTR Transaction & Grant VIP Pro
  const handleApproveTransaction = async (txn) => {
    if (!dbBase) return;
    const planType = txn.plan || 'yearly';
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Verified', verifiedAt: new Date().toLocaleTimeString() })
        });
      }
      if (txn.userKey) {
        await fetch(`${dbBase}/proUsers/${txn.userKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: txn.user,
            tier: 'pro',
            plan: planType,
            status: 'verified',
            utr: txn.utr,
            verifiedAt: new Date().toISOString()
          })
        });
        await fetch(`${dbBase}/clients/${txn.userKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: `pro (${planType})` })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('pro');
        setActivePlanType(planType);
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`✅ UTR Approved! ${txn.user} is now VIP Pro (${planType}).`);
    } catch {
      alert('Failed to approve transaction.');
    }
  };

  // Reject UTR Transaction
  const handleRejectTransaction = async (txn) => {
    if (!dbBase) return;
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Rejected' })
        });
      }
      if (txn.userKey) {
        await fetch(`${dbBase}/proUsers/${txn.userKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: txn.user, tier: 'free', status: 'rejected' })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('free');
        setActivePlanType('');
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`❌ Rejected UTR for ${txn.user}`);
    } catch {}
  };

  // Delete Single Transaction Record
  const handleDeleteTransaction = async (txn) => {
    if (!dbBase || !txn.firebaseKey) return;
    try {
      await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, { method: 'DELETE' });
      setTransactions((prev) => prev.filter((item) => item.firebaseKey !== txn.firebaseKey));
    } catch {}
  };

  // Set Any User Tier (Pro Yearly / Pro Monthly / Free)
  const handleSetClientTier = async (clientObj, targetTier, planType = 'yearly') => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await Promise.all([
        fetch(`${dbBase}/proUsers/${uKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clientObj.email,
            tier: targetTier,
            plan: targetTier === 'pro' ? planType : '',
            status: targetTier === 'pro' ? 'verified' : 'free',
            updatedAt: new Date().toISOString()
          })
        }),
        fetch(`${dbBase}/clients/${uKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: clientObj.email,
            tier: targetTier === 'pro' ? `pro (${planType})` : 'free',
            lastActive: new Date().toLocaleString()
          })
        })
      ]);
      if (gmailUser?.email === clientObj.email) {
        setTier(targetTier);
        setActivePlanType(targetTier === 'pro' ? planType : '');
      }
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`✅ ${clientObj.email} updated to ${targetTier.toUpperCase()} (${planType})!`);
    } catch {
      alert('Failed to update client tier.');
    }
  };

  // Ban / Unban Any User
  const handleToggleBanUser = async (clientObj) => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await fetch(`${dbBase}/clients/${uKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned: !clientObj.banned })
      });
      if (fetchFirebaseAll) fetchFirebaseAll();
      setSaveBanner(`${!clientObj.banned ? '🚫 Banned' : '✅ Unbanned'} ${clientObj.email}`);
    } catch {}
  };

  // Delete Client from DB
  const handleDeleteClient = async (clientObj) => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await Promise.all([
        fetch(`${dbBase}/clients/${uKey}.json`, { method: 'DELETE' }),
        fetch(`${dbBase}/proUsers/${uKey}.json`, { method: 'DELETE' })
      ]);
      setClientsList((prev) => prev.filter((c) => c.id !== uKey));
    } catch {}
  };

  // Manually Add / Grant VIP by Gmail
  const handleManualGrantSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = manualEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return alert('Enter a valid Gmail address.');
    const uKey = emailToKey(cleanEmail);
    await handleSetClientTier({ id: uKey, email: cleanEmail }, 'pro', manualPlan);
    setManualEmail('');
  };

  // Revenue Calculations
  const totalVerifiedRevenue = (transactions || [])
    .filter((t) => t.status === 'Verified')
    .reduce((sum, t) => sum + (Number(t.numericAmount) || 499), 0);

  const pendingCount = (transactions || []).filter((t) => t.status === 'Pending').length;
  const filteredClients = (clientsList || []).filter(
    (c) =>
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.youtubeHandle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#080612] border border-pink-500/50 shadow-[0_0_60px_rgba(236,72,153,0.3)] flex flex-col max-h-[94vh] overflow-hidden text-white">

        {/* TOP ADMIN HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1a0b2e] via-[#110822] to-[#0b1329] border-b border-purple-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>Owner Master Admin Console</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Full Control
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Modify Pricing, UTR Payments, Users, AI Prompts & System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={fetchFirebaseAll}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN LOCK SCREEN */}
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="p-8 space-y-4 text-center max-w-sm mx-auto my-auto">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/15 border border-pink-500/40 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Protected Owner Area</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your Master Security PIN to unlock full app controls</p>
            </div>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Master PIN"
              className="w-full px-4 py-3 rounded-2xl bg-[#05030a] border border-purple-500/50 text-center text-sm font-mono tracking-[0.3em] text-white outline-none focus:border-pink-400"
              autoFocus
            />

            {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-extrabold text-xs shadow-lg cursor-pointer"
            >
              Unlock Full Admin Control
            </button>
          </form>
        ) : (
          <>
            {/* QUICK REVENUE & STATS BAR */}
            <div className="grid grid-cols-4 gap-2 px-4 pt-3">
              <div className="p-2.5 rounded-2xl bg-[#110c22] border border-emerald-500/30 text-center">
                <div className="text-[10px] text-slate-400">Verified Revenue</div>
                <div className="text-sm font-extrabold text-emerald-400">₹{totalVerifiedRevenue.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#110c22] border border-amber-500/30 text-center">
                <div className="text-[10px] text-slate-400">Pending UTRs</div>
                <div className="text-sm font-extrabold text-amber-300">{pendingCount}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#110c22] border border-cyan-500/30 text-center">
                <div className="text-[10px] text-slate-400">Total Users</div>
                <div className="text-sm font-extrabold text-cyan-300">{(clientsList || []).length}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#110c22] border border-purple-500/30 text-center">
                <div className="text-[10px] text-slate-400">Yearly VIP Price</div>
                <div className="text-sm font-extrabold text-purple-300">₹{globalConfig.yearlyPrice}</div>
              </div>
            </div>

            {/* 5 NAVIGATION SUB-TABS */}
            <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
              {[
                { id: 'pricing', label: '💰 Pricing & UPI' },
                { id: 'payments', label: `🧾 UTR Approvals (${pendingCount})` },
                { id: 'users', label: `👥 Users (${(clientsList || []).length})` },
                { id: 'ai', label: '🤖 AI & Prompts' },
                { id: 'system', label: '⚙️ System & DB' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-[#120d24] text-slate-400 hover:text-white border border-purple-500/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {saveBanner && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-xs text-emerald-300 font-bold text-center">
                {saveBanner}
              </div>
            )}

            {/* SCROLLABLE BODY FOR EACH ADMIN TAB */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">

              {/* ================= TAB 1: PRICING, UPI, COUPONS & BANNERS ================= */}
              {activeSubTab === 'pricing' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-3">
                    <h3 className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4" /> Modify All Plans, Prices & UPI ID
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Receiver UPI ID (For QR & Payments)</label>
                        <input
                          type="text"
                          value={globalConfig.receiverUpi || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, receiverUpi: e.target.value })}
                          placeholder="e.g. 9767905729@paytm"
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-emerald-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Monthly Pro Price (₹)</label>
                        <input
                          type="number"
                          value={globalConfig.monthlyPrice || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, monthlyPrice: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-amber-300">Yearly Studio VIP Price (₹) — Main</label>
                        <input
                          type="number"
                          value={globalConfig.yearlyPrice || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-amber-400/60 text-amber-300 font-extrabold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Yearly Original Strike Price (₹)</label>
                        <input
                          type="number"
                          value={globalConfig.yearlyOriginalPrice || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, yearlyOriginalPrice: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-slate-300"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Active Coupon Code</label>
                        <input
                          type="text"
                          value={globalConfig.couponCode || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, couponCode: e.target.value.toUpperCase() })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-cyan-300 font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Coupon Discount Amount (₹)</label>
                        <input
                          type="number"
                          value={globalConfig.couponDiscount || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, couponDiscount: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Free User Upload Quota Limit</label>
                        <input
                          type="number"
                          value={globalConfig.freeLimit || 3}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, freeLimit: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300">Free Video Watermark Text</label>
                        <input
                          type="text"
                          value={globalConfig.watermarkText || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, watermarkText: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Offer Banner & Live Broadcast */}
                  <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-3">
                    <h3 className="text-xs font-extrabold text-pink-400">📢 Top Offer Banner & Live Popup Alert</h3>
                    <div>
                      <label className="text-[10px] text-slate-300">Top Offer Strip Text</label>
                      <input
                        type="text"
                        value={globalConfig.bannerText || ''}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, bannerText: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Live Broadcast Popup Alert Message (For All Online Users)</label>
                      <input
                        type="text"
                        value={globalConfig.broadcastAlertText || ''}
                        onChange={(e) =>
                          setGlobalConfig({
                            ...globalConfig,
                            broadcastAlertText: e.target.value,
                            broadcastAlertActive: Boolean(e.target.value.trim())
                          })
                        }
                        placeholder="Type message to show popup on all users' screens..."
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-amber-300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-extrabold text-xs shadow-lg cursor-pointer"
                  >
                    {isSaving ? 'Publishing Live...' : '💾 Save & Publish All Pricing & Offer Changes'}
                  </button>
                </form>
              )}

              {/* ================= TAB 2: UTR PAYMENTS APPROVALS ================= */}
              {activeSubTab === 'payments' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-white">Submitted UPI UTR Payments</h3>
                    <span className="text-[11px] text-emerald-400 font-bold">Total Verified: ₹{totalVerifiedRevenue}</span>
                  </div>

                  {(!transactions || transactions.length === 0) ? (
                    <div className="p-8 rounded-2xl bg-[#110c22] border border-slate-800 text-center text-slate-400">
                      No UTR transactions submitted yet.
                    </div>
                  ) : (
                    transactions.map((txn, idx) => (
                      <div
                        key={txn.firebaseKey || idx}
                        className="p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">{txn.user}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                txn.status === 'Verified'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : txn.status === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300 animate-pulse'
                              }`}
                            >
                              {txn.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-mono">
                            UTR: <b>{txn.utr}</b> • Plan: <b className="uppercase">{txn.plan}</b> • {txn.amount}
                          </div>
                          <div className="text-[10px] text-slate-400">Submitted at: {txn.time}</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApproveTransaction(txn)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] cursor-pointer"
                          >
                            ✓ Approve VIP
                          </button>
                          <button
                            onClick={() => handleRejectTransaction(txn)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(txn)}
                            className="p-1.5 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ================= TAB 3: USER MANAGEMENT & INSTANT VIP GRANT ================= */}
              {activeSubTab === 'users' && (
                <div className="space-y-4">
                  {/* Manual VIP Activation Box */}
                  <form onSubmit={handleManualGrantSubmit} className="p-3.5 rounded-2xl bg-[#110c22] border border-emerald-500/40 space-y-2.5">
                    <div className="text-xs font-extrabold text-emerald-300">⚡ Instant VIP Pro Activation (By Gmail ID)</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Enter User Gmail ID (e.g. user@gmail.com)"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                      />
                      <select
                        value={manualPlan}
                        onChange={(e) => setManualPlan(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-amber-300 font-bold"
                      >
                        <option value="yearly">Yearly VIP (₹3,999)</option>
                        <option value="monthly">Monthly Pro (₹499)</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer"
                      >
                        Activate Pro
                      </button>
                    </div>
                  </form>

                  {/* Search Filter */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Search users by Gmail or @YouTubeHandle..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#110c22] border border-slate-800 text-white"
                  />

                  {/* Registered Clients List */}
                  <div className="space-y-2">
                    {filteredClients.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No matching users found.</p>
                    ) : (
                      filteredClients.map((cli) => (
                        <div
                          key={cli.id}
                          className="p-3 rounded-2xl bg-[#110c22] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div>
                            <div className="font-extrabold text-white flex items-center gap-2">
                              <span>{cli.email}</span>
                              {cli.banned && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px]">BANNED</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Channel: <span className="text-cyan-300">{cli.youtubeHandle || 'Not Linked'}</span> • Plan:{' '}
                              <span className="text-amber-300 font-bold uppercase">{cli.tier || 'free'}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => handleSetClientTier(cli, 'pro', 'yearly')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] cursor-pointer"
                            >
                              Make Yearly VIP
                            </button>
                            <button
                              onClick={() => handleSetClientTier(cli, 'pro', 'monthly')}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Monthly Pro
                            </button>
                            <button
                              onClick={() => handleSetClientTier(cli, 'free', '')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                            >
                              Set Free
                            </button>
                            <button
                              onClick={() => handleToggleBanUser(cli)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                                cli.banned ? 'bg-emerald-600 text-white' : 'bg-rose-600/30 text-rose-300'
                              }`}
                            >
                              {cli.banned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => handleDeleteClient(cli)}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 4: AI KEYS & MASTER VIRAL PROMPT ================= */}
              {activeSubTab === 'ai' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-3">
                    <h3 className="text-xs font-extrabold text-cyan-300">🤖 AI Engine Keys & Master SEO Prompt</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400">Primary AI API Key (DeepSeek / OpenAI)</label>
                        <input
                          type="password"
                          value={globalConfig.primaryAiKey || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, primaryAiKey: e.target.value })}
                          placeholder="sk-..."
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Claude API Key (Optional Backup)</label>
                        <input
                          type="password"
                          value={globalConfig.claudeApiKey || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, claudeApiKey: e.target.value })}
                          placeholder="sk-ant-..."
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-300">Master Viral SEO Prompt (Used for all Video Uploads)</label>
                      <textarea
                        rows={7}
                        value={globalConfig.customAiPrompt || ''}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, customAiPrompt: e.target.value })}
                        className="w-full mt-1 p-3 rounded-xl bg-[#06040c] border border-slate-700 text-slate-200 font-mono text-[11px] leading-relaxed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs cursor-pointer"
                  >
                    💾 Save & Publish AI Engine Config
                  </button>
                </form>
              )}

              {/* ================= TAB 5: SYSTEM SWITCHES, PIN & FIREBASE DB ================= */}
              {activeSubTab === 'system' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-3">
                    <h3 className="text-xs font-extrabold text-white">⚙️ System Switches, Security PIN & Firebase URL</h3>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#06040c] border border-slate-800">
                      <div>
                        <div className="font-bold text-white">YouTube Auto-Upload Engine</div>
                        <div className="text-[10px] text-slate-400">Allow users to auto-post Shorts to YouTube</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGlobalConfig({ ...globalConfig, ytAutoUploadActive: !globalConfig.ytAutoUploadActive })}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer ${
                          globalConfig.ytAutoUploadActive ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {globalConfig.ytAutoUploadActive ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#06040c] border border-slate-800">
                      <div>
                        <div className="font-bold text-white">App Maintenance Mode</div>
                        <div className="text-[10px] text-slate-400">Show upgrade screen to regular visitors</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGlobalConfig({ ...globalConfig, maintenanceMode: !globalConfig.maintenanceMode })}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] cursor-pointer ${
                          globalConfig.maintenanceMode ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {globalConfig.maintenanceMode ? 'MAINTENANCE ON' : 'OFF (LIVE)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Master Admin Security PIN</label>
                        <input
                          type="text"
                          value={globalConfig.adminPin || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, adminPin: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-pink-400 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Default System Google Client ID</label>
                        <input
                          type="text"
                          value={globalConfig.googleClientId || ''}
                          onChange={(e) => setGlobalConfig({ ...globalConfig, googleClientId: e.target.value })}
                          className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400">Firebase Realtime Database URL</label>
                      <input
                        type="text"
                        value={liveDbUrl || ''}
                        onChange={(e) => setLiveDbUrl(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-cyan-300 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-extrabold text-xs cursor-pointer"
                  >
                    💾 Save System & Database Configuration
                  </button>
                </form>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
