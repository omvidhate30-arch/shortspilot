import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Upload, Play, CheckCircle2, Clock, Zap, Shield, Lock,
  Youtube, Instagram, Sliders, X, ChevronRight, Trash2, ArrowUpRight,
  CreditCard, AlertCircle, Check, KeyRound, Users, BarChart3, RefreshCw
} from 'lucide-react';

export default function App() {
  // Client State
  const [tier, setTier] = useState('free'); // 'free' | 'pro'
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [videoQueue, setVideoQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Modals & Drawers
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Checkout / UPI AutoPay State
  const [upiId, setUpiId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [mandateSent, setMandateSent] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Hidden Owner Control Center State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [receiverUpi, setReceiverUpi] = useState('shortspilot@ptyes');
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-8841',
      upi: 'rohan.create@okicici',
      utr: '431892019482',
      plan: '₹2 Trial → ₹1,999/yr AutoPay',
      status: 'Active',
      time: '12 mins ago'
    }
  ]);

  const fileInputRef = useRef(null);
  const MASTER_PIN = '9767905729';

  // Secret Admin Access: ?admin=true OR Ctrl/Cmd + Shift + O
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminOpen(true);
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Video Processing Simulation
  const processNewClip = (fileName) => {
    if (tier === 'free' && quotaUsed >= 5) {
      setIsPricingOpen(true);
      return;
    }

    const newId = Date.now() + Math.random();
    const newItem = {
      id: newId,
      title: fileName.replace(/\.[^/.]+$/, ''),
      status: 'analyzing',
      progress: 25,
      hookScore: '9.4/10',
      platform: 'YouTube Shorts + Reels',
      scheduledTime: 'Today, 7:30 PM IST'
    };

    setVideoQueue((prev) => [newItem, ...prev]);
    if (tier === 'free') setQuotaUsed((q) => q + 1);

    setTimeout(() => {
      setVideoQueue((prev) =>
        prev.map((item) =>
          item.id === newId ? { ...item, status: 'cropping', progress: 68 } : item
        )
      );
    }, 1500);

    setTimeout(() => {
      setVideoQueue((prev) =>
        prev.map((item) =>
          item.id === newId ? { ...item, status: 'ready', progress: 100 } : item
        )
      );
    }, 3200);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => processNewClip(file.name));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      files.forEach((file) => processNewClip(file.name));
    }
  };

  const handleSendMandate = () => {
    setCheckoutError('');
    if (!upiId.includes('@') || upiId.length < 5) {
      setCheckoutError('Please enter a valid UPI ID (e.g., name@okaxis or 9876543210@paytm)');
      return;
    }
    setMandateSent(true);
  };

  const handleVerifyPayment = (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setCheckoutError('Enter the exact 12-digit UPI Reference / Mandate UTR number.');
      return;
    }

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      upi: upiId.trim(),
      utr: utrNumber.trim(),
      plan: '₹2 Trial → ₹1,999/yr AutoPay',
      status: 'Active',
      time: 'Just now'
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setTier('pro');
    setCheckoutSuccess(true);

    setTimeout(() => {
      setIsPricingOpen(false);
      setCheckoutSuccess(false);
      setMandateSent(false);
      setUtrNumber('');
    }, 1600);
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pinInput === MASTER_PIN) {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Master Security PIN');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 font-sans selection:bg-pink-500/30 selection:text-pink-200 relative overflow-x-hidden">
      {/* Futuristic Jet Black + Cerulean Blue + Neon Rose Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-sky-500/12 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full bg-pink-600/12 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Floating Glass Header */}
      <header className="sticky top-4 z-30 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#090d16]/85 backdrop-blur-xl border border-sky-500/20 shadow-[0_0_30px_rgba(0,123,255,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-pink-500 p-[1px] shadow-[0_0_20px_rgba(255,16,110,0.35)]">
              <div className="w-full h-full bg-[#06080d] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-sky-200 to-pink-300 bg-clip-text text-transparent">
                  ShortsPilot
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  Auto-Pilot AI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tier === 'pro' ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-500/15 to-pink-500/15 border border-pink-500/40 text-xs font-semibold text-pink-200 shadow-[0_0_18px_rgba(255,16,110,0.2)]">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Pro Yearly • AutoPay Active</span>
              </div>
            ) : (
              <button
                onClick={() => setIsPricingOpen(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0c1220] hover:bg-[#11192c] border border-sky-500/30 hover:border-pink-500/50 text-xs font-medium text-slate-200 transition-all shadow-[0_0_15px_rgba(0,123,255,0.15)]"
              >
                <span className="text-sky-400 font-semibold">{quotaUsed}/5 Free</span>
                <span className="text-slate-600">•</span>
                <span className="text-pink-400 font-semibold flex items-center gap-1">
                  Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-[#0c1220] hover:bg-[#131b2e] border border-slate-800 hover:border-sky-500/40 text-slate-300 transition-colors"
              aria-label="Studio Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-24">
        {/* Hero Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Zero-Touch AI Clipping & Peak-Hour Auto-Publishing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Turn Raw Videos Into{' '}
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-pink-500 bg-clip-text text-transparent">
              Viral Shorts
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Drop any long-form video or raw clip. ShortsPilot detects high-retention hooks, crops 9:16 vertically, and auto-publishes at peak engagement hours.
          </p>
        </div>

        {/* 3-Step Bento Pipeline Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-[#090d16]/90 border border-sky-500/20 flex items-center gap-3.5">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              01
            </span>
            <div>
              <div className="text-sm font-semibold text-white">Drop Source</div>
              <div className="text-xs text-slate-400">MP4, MOV or raw stream</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#090d16]/90 border border-pink-500/20 flex items-center gap-3.5">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-400 border border-pink-500/30">
              02
            </span>
            <div>
              <div className="text-sm font-semibold text-white">AI Hook & Crop</div>
              <div className="text-xs text-slate-400">9:16 active speaker framing</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#090d16]/90 border border-sky-500/20 flex items-center gap-3.5">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
              03
            </span>
            <div>
              <div className="text-sm font-semibold text-white">Peak Auto-Post</div>
              <div className="text-xs text-slate-400">YouTube Shorts & IG Reels</div>
            </div>
          </div>
        </div>

        {/* Modern Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl p-10 sm:p-14 text-center transition-all border-2 border-dashed ${
            isDragging
              ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_40px_rgba(255,16,110,0.25)]'
              : 'border-sky-500/30 bg-[#080c15]/90 hover:border-sky-400/60 shadow-[0_0_35px_rgba(0,123,255,0.08)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-sky-500/20 to-pink-500/20 border border-sky-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(0,123,255,0.2)]">
            <Upload className="w-7 h-7 text-sky-400" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            Drop your video here to start Auto-Pilot
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-7">
            Supports MP4, MOV, WebM up to 4K. AI automatically extracts viral moments and schedules uploads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:opacity-95 transition-all shadow-[0_0_25px_rgba(255,16,110,0.35)] flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Video File
            </button>

            <button
              onClick={() => processNewClip('Podcast_Ep42_Viral_Moment.mp4')}
              className="px-5 py-3 rounded-xl font-medium text-sm text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run Sample Video
            </button>
          </div>
        </div>

        {/* Auto-Pilot Publishing Queue (Visible ONLY when videos are posted/uploaded) */}
        {videoQueue.length > 0 && (
          <section className="mt-12 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Auto-Pilot Publishing Queue</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {videoQueue.length} {videoQueue.length === 1 ? 'Clip' : 'Clips'}
                </span>
              </div>
              <button
                onClick={() => setVideoQueue([])}
                className="text-xs text-slate-400 hover:text-pink-400 transition-colors"
              >
                Clear Queue
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videoQueue.map((clip) => (
                <div
                  key={clip.id}
                  className="p-5 rounded-2xl bg-[#090d16] border border-sky-500/20 hover:border-pink-500/40 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
                          Hook Score {clip.hookScore}
                        </span>
                        <span className="text-xs text-slate-400">{clip.platform}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-1">
                        {clip.title}
                      </h4>
                    </div>
                    <button
                      onClick={() =>
                        setVideoQueue((prev) => prev.filter((item) => item.id !== clip.id))
                      }
                      className="text-slate-500 hover:text-pink-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-sky-300 font-medium capitalize">
                        {clip.status === 'analyzing' && 'AI Detecting Viral Hook...'}
                        {clip.status === 'cropping' && 'Auto-Framing 9:16 Vertical...'}
                        {clip.status === 'ready' && 'Scheduled for Peak Auto-Post'}
                      </span>
                      <span className="text-slate-400">{clip.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-pink-500 transition-all duration-500"
                        style={{ width: `${clip.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      {clip.scheduledTime}
                    </span>
                    {clip.status === 'ready' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Queued
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ₹2 Trial + ₹1,999/Year UPI AutoPay Checkout Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#080c15] border border-sky-500/30 shadow-[0_0_50px_rgba(0,123,255,0.25)] p-6 sm:p-7">
            <button
              onClick={() => setIsPricingOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>7-Day Trial Offer • Instant 1-Year Unlock</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              Start for <span className="text-sky-400">₹2</span> Today
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Unlock unlimited ShortsPilot Pro for 1 full year. ₹2 today for 7 days, then ₹1,999/year via UPI AutoPay (cancel anytime).
            </p>

            {/* Plan Summary Box */}
            <div className="p-4 rounded-2xl bg-[#0c1220] border border-sky-500/25 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">ShortsPilot Pro (Annual)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-medium">
                  UPI AutoPay
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-white">₹2</span>
                <span className="text-xs text-slate-400">for 7 days, then ₹1,999/year</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400" /> Unlimited AI Shorts & Reels Generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-400" /> Direct Auto-Publishing to YouTube & Instagram
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400" /> Instant 1-Year Pro Activation on Mandate Approval
                </li>
              </ul>
            </div>

            {checkoutSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <div className="font-bold text-white text-base">1-Year Pro Plan Activated!</div>
                <div className="text-xs text-emerald-300 mt-1">
                  UPI AutoPay Mandate verified. Unlimited uploads unlocked.
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your UPI ID for AutoPay Mandate
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@okicici / number@paytm"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 focus:border-sky-500 text-sm text-white outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendMandate}
                      className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold whitespace-nowrap transition-all"
                    >
                      {mandateSent ? 'Sent ✓' : 'Send Request'}
                    </button>
                  </div>
                  {mandateSent && (
                    <p className="text-[11px] text-sky-300 mt-1.5">
                      Approve the ₹2 AutoPay request in your UPI app (to <span className="font-mono">{receiverUpi}</span>) and enter the 12-digit UTR below.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    12-Digit UPI Mandate / UTR Reference Number
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 431982746102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#05070c] border border-slate-700 focus:border-pink-500 text-sm font-mono text-white outline-none"
                    required
                  />
                </div>

                {checkoutError && (
                  <div className="flex items-center gap-2 text-xs text-pink-400 bg-pink-500/10 border border-pink-500/30 p-2.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:opacity-95 shadow-[0_0_25px_rgba(255,16,110,0.35)] transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Verify ₹2 AutoPay & Unlock 1-Year Pro
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Client Settings Drawer (100% Free of Admin Controls) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#080c15] border-l border-sky-500/25 h-full p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Studio Preferences</h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="p-4 rounded-2xl bg-[#0c1220] border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Current Plan</div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">
                      {tier === 'pro' ? 'ShortsPilot Pro (1-Year)' : 'Starter Free Tier'}
                    </span>
                    {tier === 'pro' ? (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        AutoPay Active
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsPricingOpen(true);
                        }}
                        className="text-xs text-sky-400 hover:underline font-medium"
                      >
                        Try ₹2
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Connected Channels
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Youtube className="w-4 h-4 text-rose-500" />
                      <span className="text-sm text-slate-200">YouTube Shorts</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Connected</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-slate-200">Instagram Reels</span>
                    </div>
                    <span className="text-xs text-sky-400 font-medium">Auto-Sync</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
              ShortsPilot AI Engine v2.4 • Automated Creator Workflow
            </div>
          </div>
        </div>
      )}

      {/* Hidden Owner Control Center (?admin=true or Ctrl/Cmd + Shift + O) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#070a12] border border-pink-500/40 shadow-[0_0_60px_rgba(255,16,110,0.3)] p-6 sm:p-7">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!isAdminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="py-4 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-pink-500/15 border border-pink-500/40 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Owner Control Center</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Enter your secret Master PIN to access payments, users & pipeline controls.
                </p>

                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Master PIN"
                  className="w-full max-w-xs mx-auto block px-4 py-3 rounded-xl bg-[#05070c] border border-slate-700 focus:border-pink-500 text-center text-white tracking-widest outline-none mb-3"
                  autoFocus
                />

                {pinError && <p className="text-xs text-pink-400 mb-3">{pinError}</p>}

                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-pink-600 text-white text-sm font-semibold shadow-[0_0_20px_rgba(255,16,110,0.35)]"
                >
                  Unlock Console
                </button>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <Shield className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-bold text-white">Owner Control Center</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-sky-500/20">
                    <div className="text-xs text-slate-400">Receiver UPI VPA</div>
                    <input
                      type="text"
                      value={receiverUpi}
                      onChange={(e) => setReceiverUpi(e.target.value)}
                      className="mt-1 w-full bg-transparent text-sm font-mono text-sky-300 font-semibold outline-none"
                    />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0c1220] border border-pink-500/20">
                    <div className="text-xs text-slate-400">Active AutoPay Mandates</div>
                    <div className="mt-1 text-lg font-bold text-pink-400">
                      {transactions.length} Subscribers
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Verified AutoPay & UTR Logs
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="p-3 rounded-xl bg-[#0c1220] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{txn.upi}</div>
                          <div className="text-slate-400 font-mono">UTR: {txn.utr}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">
                            {txn.status}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">{txn.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setTier(tier === 'pro' ? 'free' : 'pro');
                      setQuotaUsed(0);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Toggle Preview Tier ({tier.toUpperCase()})
                  </button>
                  <button
                    onClick={() => setIsAdminUnlocked(false)}
                    className="text-xs text-slate-400 hover:text-pink-400"
                  >
                    Lock Console
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
