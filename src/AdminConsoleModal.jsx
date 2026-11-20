import React, { useState } from 'react';
import {
  Shield,
  Lock,
  X,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Phone
} from 'lucide-react';
import { FIREBASE_DB_URL, emailToKey } from './videoUtils';

const AdminConsoleModal = React.memo(({
  isOpen,
  onClose,
  globalConfig,
  setGlobalConfig,
  liveDbUrl,
  setLiveDbUrl,
  transactions,
  clientsList,
  userApisList,
  onManualAddUserApi,
  onDeleteUserApi,
  fetchFirebaseAll,
  gmailUser,
  setTier
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('userApis');
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPlan, setManualPlan] = useState('yearly');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const [newApiEmail, setNewApiEmail] = useState('');
  const [newApiPhone, setNewApiPhone] = useState('');
  const [newApiClientId, setNewApiClientId] = useState('');
  const [newApiIgUser, setNewApiIgUser] = useState('');
  const [newApiIgToken, setNewApiIgToken] = useState('');

  if (!isOpen) return null;
  const dbBase = (liveDbUrl || FIREBASE_DB_URL).trim().replace(/\/$/, '');

  const handleCopyClientId = (key, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    const masterPin = (globalConfig.adminPin || '9767905729').trim();
    if (pinInput.trim() === masterPin || pinInput.trim() === '9767905729') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('❌ Invalid Master Security PIN!');
    }
  };

  const handleAddManualApiRow = async (e) => {
    e.preventDefault();
    const cleanEmail = newApiEmail.trim().toLowerCase();
    const cleanPhone = newApiPhone.replace(/\D/g, '').slice(0, 12);
    const cleanClient = newApiClientId.trim();
    if (!cleanEmail || !cleanClient) return;
    await onManualAddUserApi?.(
      cleanEmail,
      cleanClient,
      cleanPhone,
      newApiIgUser.trim(),
      newApiIgToken.trim()
    );
    setNewApiEmail('');
    setNewApiPhone('');
    setNewApiClientId('');
    setNewApiIgUser('');
    setNewApiIgToken('');
    setSaveBanner(`✅ Saved & Connected API for ${cleanEmail}`);
    setTimeout(() => setSaveBanner(''), 3000);
  };

  const handlePublishAllChanges = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('sp_global_config', JSON.stringify(globalConfig));
    localStorage.setItem('sp_firebase_url', dbBase);

    if (dbBase) {
      try {
        await fetch(`${dbBase}/siteConfig.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...globalConfig,
            updatedAt: new Date().toISOString()
          })
        });
        setSaveBanner('✅ All Changes Saved & Published Live!');
      } catch {
        setSaveBanner('✅ Saved Locally on Device!');
      }
    }
    setIsSaving(false);
    setTimeout(() => setSaveBanner(''), 3500);
  };

  const handleApproveTransaction = async (txn) => {
    if (!dbBase) return;
    const planType = txn.plan || 'yearly';
    try {
      if (txn.firebaseKey) {
        await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Verified' })
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
            utr: txn.utr
          })
        });
      }
      if (gmailUser?.email === txn.user) {
        setTier('pro');
      }
      fetchFirebaseAll?.();
      setSaveBanner(`✅ Approved VIP for ${txn.user}`);
    } catch {}
  };

  const handleRejectTransaction = async (txn) => {
    if (!dbBase || !txn.firebaseKey) return;
    try {
      await fetch(`${dbBase}/transactions/${txn.firebaseKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' })
      });
      fetchFirebaseAll?.();
    } catch {}
  };

  const handleSetClientTier = async (clientObj, targetTier, planType = 'yearly') => {
    if (!dbBase || !clientObj?.email) return;
    const uKey = clientObj.id || emailToKey(clientObj.email);
    try {
      await fetch(`${dbBase}/proUsers/${uKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientObj.email,
          tier: targetTier,
          plan: targetTier === 'pro' ? planType : '',
          status: targetTier === 'pro' ? 'verified' : 'free'
        })
      });
      if (gmailUser?.email === clientObj.email) {
        setTier(targetTier);
      }
      fetchFirebaseAll?.();
      setSaveBanner(`✅ ${clientObj.email} set to ${targetTier.toUpperCase()}!`);
    } catch {}
  };

  const totalVerifiedRevenue = (transactions || [])
    .filter((t) => t.status === 'Verified')
    .reduce((sum, t) => sum + (Number(t.numericAmount) || 99), 0);

  const pendingCount = (transactions || []).filter((t) => t.status === 'Pending').length;
  const filteredClients = (clientsList || []).filter((c) =>
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#090714] border border-pink-500/50 flex flex-col max-h-[92vh] overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#120b24] border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pink-400" />
            <h2 className="text-sm font-extrabold text-white">Owner Master Admin Console</h2>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={fetchFirebaseAll}
                className="p-1.5 rounded-lg bg-white/5 text-cyan-300 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="p-8 space-y-4 text-center max-w-sm mx-auto my-auto">
            <Lock className="w-10 h-10 text-pink-400 mx-auto" />
            <h3 className="text-base font-extrabold text-white">Enter Master Owner PIN</h3>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Master PIN"
              className="w-full px-4 py-2.5 rounded-xl bg-[#05030a] border border-purple-500/50 text-center text-sm font-mono text-white outline-none"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-extrabold text-xs cursor-pointer"
            >
              Unlock Full Control
            </button>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 px-4 pt-3 text-center">
              <div className="p-2 rounded-xl bg-[#110c22] border border-emerald-500/30">
                <div className="text-[9px] text-slate-400">Revenue</div>
                <div className="text-xs font-extrabold text-emerald-400">₹{totalVerifiedRevenue}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-amber-500/30">
                <div className="text-[9px] text-slate-400">Pending UTR</div>
                <div className="text-xs font-extrabold text-amber-300">{pendingCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-cyan-500/30">
                <div className="text-[9px] text-slate-400">Connected APIs</div>
                <div className="text-xs font-extrabold text-cyan-300">
                  {(userApisList || []).length}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#110c22] border border-purple-500/30">
                <div className="text-[9px] text-slate-400">Yearly Offer</div>
                <div className="text-xs font-extrabold text-purple-300">
                  ₹{globalConfig.yearlyPrice}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto">
              {[
                { id: 'userApis', label: `🔑 User APIs (${(userApisList || []).length})` },
                { id: 'pricing', label: '💰 Pricing & UPI' },
                { id: 'payments', label: `🧾 UTR (${pendingCount})` },
                { id: 'users', label: '👥 Users & VIP' },
                { id: 'ai', label: '🤖 AI Prompt' },
                { id: 'system', label: '⚙️ System & Gmail Alert' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-pink-600 text-white'
                      : 'bg-[#120d24] text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {saveBanner && (
              <div className="mx-4 mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-xs text-emerald-300 font-bold text-center">
                {saveBanner}
              </div>
            )}

            <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {activeSubTab === 'userApis' && (
                <div className="space-y-3">
                  <form
                    onSubmit={handleAddManualApiRow}
                    className="p-3.5 rounded-2xl bg-[#110c22] border border-emerald-500/40 space-y-2"
                  >
                    <div className="text-[11px] font-extrabold text-emerald-300">
                      + Manually Add User Gmail, Phone, Client ID & IG Token
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        required
                        value={newApiEmail}
                        onChange={(e) => setNewApiEmail(e.target.value)}
                        placeholder="User Gmail ID..."
                        className="px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                      />
                      <input
                        type="tel"
                        value={newApiPhone}
                        onChange={(e) =>
                          setNewApiPhone(e.target.value.replace(/\D/g, '').slice(0, 12))
                        }
                        placeholder="Phone No. (e.g. 9876543210)"
                        className="px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-amber-300 font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={newApiClientId}
                      onChange={(e) => setNewApiClientId(e.target.value)}
                      placeholder="Paste Google Client ID (*.apps.googleusercontent.com)..."
                      className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-cyan-300 font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newApiIgUser}
                        onChange={(e) => setNewApiIgUser(e.target.value)}
                        placeholder="IG @username (optional)"
                        className="w-1/2 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-pink-300 font-mono"
                      />
                      <input
                        type="text"
                        value={newApiIgToken}
                        onChange={(e) => setNewApiIgToken(e.target.value)}
                        placeholder="IG Token (optional)"
                        className="w-1/2 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-pink-200 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-emerald-500 text-black font-extrabold cursor-pointer"
                    >
                      Add & Connect
                    </button>
                  </form>

                  {!userApisList || userApisList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#110c22] text-center text-slate-400">
                      No user Client IDs submitted yet.
                    </div>
                  ) : (
                    userApisList.map((item, idx) => {
                      const rowKey = item.id || item.email || String(idx);
                      return (
                        <div
                          key={rowKey}
                          className="p-3.5 rounded-2xl bg-[#110c22] border border-cyan-500/35 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-extrabold text-white truncate">
                                {item.email || 'Unknown Gmail'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                                <span className="text-amber-300 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {item.phone || 'No Phone'}
                                </span>
                                {item.igUsername && (
                                  <span className="text-pink-300 font-mono">
                                    • IG: {item.igUsername}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-500/20 text-emerald-300">
                                Connected ✅
                              </span>
                              {onDeleteUserApi && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteUserApi(item.email)}
                                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 cursor-pointer"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 bg-[#06040c] px-2.5 py-2 rounded-xl border border-slate-800">
                            <span className="text-[11px] text-cyan-300 font-mono truncate">
                              {item.clientId || '-'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyClientId(rowKey, item.clientId)}
                              className="px-2 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {copiedId === rowKey ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === rowKey ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          {item.igToken && (
                            <div className="text-[10px] text-pink-200/80 font-mono truncate">
                              IG Token: {item.igToken}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeSubTab === 'pricing' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30">
                    <div>
                      <label className="text-[10px] text-slate-300">Receiver UPI ID</label>
                      <input
                        type="text"
                        value={globalConfig.receiverUpi || ''}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, receiverUpi: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-emerald-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-300 font-bold">
                        Yearly VIP Offer Price (₹)
                      </label>
                      <input
                        type="number"
                        value={globalConfig.yearlyPrice || ''}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, yearlyPrice: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-amber-400/60 text-amber-300 font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cyan-300 font-bold">
                        Monthly Pro Offer Price (₹)
                      </label>
                      <input
                        type="number"
                        value={globalConfig.monthlyPrice || ''}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, monthlyPrice: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-cyan-400/60 text-cyan-300 font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-300">Brand Watermark Text</label>
                      <input
                        type="text"
                        value={globalConfig.watermarkText || ''}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, watermarkText: e.target.value })
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-black font-extrabold text-xs cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : '💾 Save & Publish All Offer Pricing'}
                  </button>
                </form>
              )}

              {activeSubTab === 'payments' && (
                <div className="space-y-2.5">
                  {!transactions || transactions.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#110c22] text-center text-slate-400">
                      No UTR transactions yet.
                    </div>
                  ) : (
                    transactions.map((txn, idx) => (
                      <div
                        key={txn.firebaseKey || idx}
                        className="p-3 rounded-2xl bg-[#110c22] border border-purple-500/30 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-white">
                            {txn.user} <span className="text-amber-300">({txn.status})</span>
                          </div>
                          <div className="text-[11px] text-cyan-300 font-mono">
                            UTR: {txn.utr} • {txn.amount}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveTransaction(txn)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectTransaction(txn)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSubTab === 'users' && (
                <div className="space-y-3">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!manualEmail.trim()) return;
                      await handleSetClientTier(
                        { id: emailToKey(manualEmail), email: manualEmail.trim().toLowerCase() },
                        'pro',
                        manualPlan
                      );
                      setManualEmail('');
                    }}
                    className="p-3 rounded-2xl bg-[#110c22] border border-emerald-500/40 flex gap-2"
                  >
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="User Gmail ID..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white"
                    />
                    <select
                      value={manualPlan}
                      onChange={(e) => setManualPlan(e.target.value)}
                      className="px-2 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-amber-300 font-bold"
                    >
                      <option value="yearly">Yearly VIP (₹3999)</option>
                      <option value="monthly">Monthly Pro (₹99)</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                    >
                      Grant VIP
                    </button>
                  </form>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search user email..."
                    className="w-full px-3 py-2 rounded-xl bg-[#110c22] border border-slate-800 text-white"
                  />

                  {filteredClients.map((cli) => (
                    <div
                      key={cli.id}
                      className="p-3 rounded-2xl bg-[#110c22] border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white">{cli.email}</div>
                        <div className="text-[10px] text-amber-300 uppercase">
                          {cli.tier || 'free'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetClientTier(cli, 'pro', 'yearly')}
                          className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[10px] cursor-pointer"
                        >
                          VIP
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetClientTier(cli, 'free', '')}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                        >
                          Free
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === 'ai' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5">
                    <label className="text-[10px] text-slate-300">Primary AI API Key</label>
                    <input
                      type="password"
                      value={globalConfig.primaryAiKey || ''}
                      onChange={(e) =>
                        setGlobalConfig({ ...globalConfig, primaryAiKey: e.target.value })
                      }
                      placeholder="sk-..."
                      className="w-full px-3 py-2 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono"
                    />
                    <label className="text-[10px] text-slate-300 block pt-1">
                      Master Viral SEO Prompt
                    </label>
                    <textarea
                      rows={5}
                      value={globalConfig.customAiPrompt || ''}
                      onChange={(e) =>
                        setGlobalConfig({ ...globalConfig, customAiPrompt: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl bg-[#06040c] border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-extrabold cursor-pointer"
                  >
                    Save AI Config
                  </button>
                </form>
              )}

              {activeSubTab === 'system' && (
                <form onSubmit={handlePublishAllChanges} className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#110c22] border border-purple-500/30 space-y-2.5">
                    <div>
                      <label className="text-[10px] text-emerald-300 font-bold">
                        Owner Alert Gmail (UPI Payment Notifications)
                      </label>
                      <input
                        type="email"
                        value={globalConfig.ownerAlertEmail || ''}
                        onChange={(e) =>
                          setGlobalConfig({ ...globalConfig, ownerAlertEmail: e.target.value })
                        }
                        placeholder="yourname@gmail.com"
                        className="w-full mt-1 px-3 py-
