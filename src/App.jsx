import React, { useState, useEffect } from 'react';
import { 
  Video, Upload, Calendar, Sparkles, Terminal, 
  Layers, Shield, CheckCircle2, HelpCircle, X, Send, Play 
} from 'lucide-react';

export default function App() {
  // --- States ---
  const [activeTab, setActiveTab] = useState('studio'); // studio, scheduler, pricing, admin
  const [videos, setVideos] = useState([]);
  
  // Custom YouTube Client ID & Secret State
  const [youtubeClientId, setYoutubeClientId] = useState(localStorage.getItem('shorts_client_id') || '');
  const [youtubeClientSecret, setYoutubeClientSecret] = useState(localStorage.getItem('shorts_client_secret') || '');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showClientGuideModal, setShowClientGuideModal] = useState(false);

  // Live Customers Counter State (हर 3-4 सेकंड में बदलेगा)
  const [liveCustomers, setLiveCustomers] = useState(174);

  // AI Support Assistant State
  const [showAiSupport, setShowAiSupport] = useState(false);
  const [supportMessages, setSupportMessages] = useState([
    { role: 'ai', text: 'Hi! I am your ShortsPilot AI Support Assistant. Need help with YouTube quota, video clipping, or auto-scheduling? Ask me anything!' }
  ]);
  const [supportInput, setSupportInput] = useState('');

  // Admin Panel State
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const MASTER_PIN = '9767905729';

  // Pricing & Subscription State
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- Live Customers Counter Effect ---
  useEffect(() => {
    const customerTimer = setInterval(() => {
      setLiveCustomers(prev => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const updated = prev + delta;
        return updated < 130 ? 135 : updated > 250 ? 242 : updated;
      });
    }, 3500);
    return () => clearInterval(customerTimer);
  }, []);

  // --- Save Custom Client Credentials ---
  const saveUserCredentials = (clientId, clientSecret) => {
    setYoutubeClientId(clientId);
    setYoutubeClientSecret(clientSecret);
    localStorage.setItem('shorts_client_id', clientId);
    localStorage.setItem('shorts_client_secret', clientSecret);
    alert("Google Client ID & Secret saved successfully! Your uploads will now use your dedicated quota.");
    setShowConnectModal(false);
  };

  // --- AI Support Handler ---
  const handleSendSupport = (e) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    const userMsg = supportInput;
    setSupportMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSupportInput('');

    setTimeout(() => {
      let aiReply = "I'm here to help! For YouTube upload limits, make sure your Google Client ID is added in the connection settings.";
      const lower = userMsg.toLowerCase();
      if (lower.includes('quota') || lower.includes('limit') || lower.includes('error')) {
        aiReply = "If you hit the upload limit, you can add your own Google Client ID & Secret from the 'Connect YouTube' button at the top right!";
      } else if (lower.includes('clip') || lower.includes('video')) {
        aiReply = "Drag and drop your long video into the studio box, select your hook style, and our AI Engine will automatically render 9:16 vertical shorts.";
      }
      setSupportMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    }, 800);
  };

  // --- Admin Login Handler ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPin === MASTER_PIN) {
      setIsAdmin(true);
      setActiveTab('admin');
    } else {
      alert('Invalid Admin PIN!');
    }
  };

  // --- File Upload Simulator ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: (file.size / (1024*1024)).toFixed(1) + ' MB',
      status: 'Ready to Render',
      seoTitle: 'Viral YouTube Short #Shorts',
      seoTags: '#viral #shorts #trending',
      scheduledTime: 'Today, 07:30 PM IST',
      autoPost: true
    }));
    setVideos(prev => [...prev, ...newVideos]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Top Notification Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-purple-500/20 px-4 py-2 text-xs flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">PRO v3.5</span>
          <span>ShortsPilot AI Studio — Fully Automated YouTube Shorts Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{liveCustomers} Customers Live Now</span>
          </div>
          <button 
            onClick={() => setShowConnectModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg font-semibold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
          >
            <span>🔗</span> Connect YouTube
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              SHORTSPILOT <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 font-normal">AI STUDIO</span>
            </h1>
            <p className="text-xs text-slate-400">Automated Long-to-Shorts & Auto-Scheduler</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button 
            onClick={() => setActiveTab('studio')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'studio' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" /> Studio & Queue
          </button>
          <button 
            onClick={() => setActiveTab('scheduler')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'scheduler' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar className="w-4 h-4" /> Auto-Scheduler
          </button>
          <button 
            onClick={() => setActiveTab('pricing')} 
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === 'pricing' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="w-4 h-4" /> VIP Pricing (₹3,999)
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <button onClick={() => setActiveTab('admin')} className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-2 rounded-lg text-xs font-bold">
              👑 Admin Dashboard
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="flex gap-2">
              <input 
                type="password" 
                placeholder="Admin PIN" 
                value={adminPin} 
                onChange={(e) => setAdminPin(e.target.value)} 
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-24 text-white focus:outline-none focus:border-purple-500"
              />
              <button type="submit" className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300">Login</button>
            </form>
          )}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        {activeTab === 'studio' && (
          <div className="space-y-6">
            
            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-900/40 rounded-2xl p-8 text-center transition-all">
              <input type="file" multiple accept="video/*" onChange={handleFileUpload} className="hidden" id="video-upload-input" />
              <label htmlFor="video-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">Drop your long-form videos here (Batch Upload)</h3>
                  <p className="text-xs text-slate-400 mt-1">Our AI Engine will automatically extract viral clips and schedule YouTube Shorts.</p>
                </div>
                <span className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all">
                  Browse Video Files
                </span>
              </label>
            </div>

            {/* Video Queue List */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" /> Active Video Queue ({videos.length})
                </h3>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg font-medium">
                  Auto-Posting Enabled by Default 🚀
                </span>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No videos in queue. Upload a video above to begin automated AI clipping and SEO optimization.
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map(v => (
                    <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{v.name} ({v.size})</h4>
                        <p className="text-xs text-purple-400 mt-0.5">SEO Title: {v.seoTitle}</p>
                        <p className="text-xs text-slate-500">Tags: {v.seoTags}</p>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                        <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-medium">
                          {v.status}
                        </span>
                        <span className="text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-lg">
                          Scheduled: {v.scheduledTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" /> Automated Peak-Time Scheduler (India Peak: 07:30 PM IST)
            </h3>
            <p className="text-xs text-slate-400">
              ShortsPilot automatically distributes your rendered 9:16 vertical shorts across peak engagement hours to guarantee maximum views without hitting rate limits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Slot 1</span>
                <h4 className="text-lg font-bold text-purple-400 mt-1">08:00 AM IST</h4>
                <p className="text-xs text-slate-500 mt-2">Morning commute rush optimization.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Slot 2</span>
                <h4 className="text-lg font-bold text-purple-400 mt-1">01:30 PM IST</h4>
                <p className="text-xs text-slate-500 mt-2">Lunchtime engagement peak.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                <span className="text-xs text-slate-400">Slot 3 (Prime)</span>
                <h4 className="text-lg font-bold text-emerald-400 mt-1">07:30 PM IST</h4>
                <p className="text-xs text-slate-500 mt-2">Maximum viewership prime time slot.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-6 text-center">
            <h2 className="text-2xl font-black">Upgrade to ShortsPilot Studio VIP</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Get unlimited 9:16 video processing, priority AI SEO rendering, and zero quota restrictions with our Yearly VIP Plan.
            </p>
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-6 max-w-md mx-auto relative shadow-2xl shadow-purple-600/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </span>
              <h3 className="text-lg font-bold">Yearly Studio VIP Plan</h3>
              <div className="my-4">
                <span className="text-4xl font-black text-purple-400">₹3,999</span>
                <span className="text-xs text-slate-400"> / year</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 text-left mb-6">
                <li>✅ Unlimited Video Batch Rendering</li>
                <li>✅ Smart Auto-Failover Quota Manager</li>
                <li>✅ Automated Peak-Time Scheduling</li>
                <li>✅ 30-Day View Growth Guarantee</li>
              </ul>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Enter your 12-digit UPI UTR Number" 
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white text-center focus:outline-none focus:border-purple-500"
                />
                <button 
                  onClick={() => {
                    if(utrNumber.length < 10) { alert('Please enter a valid UTR number!'); return; }
                    setPaymentSuccess(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all"
                >
                  Verify UPI Payment & Activate VIP
                </button>
                {paymentSuccess && (
                  <p className="text-xs text-emerald-400 font-bold">🎉 Payment submitted! Admin will verify your UTR within 5 minutes.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-400">
              👑 Master Admin Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Total Revenue</span>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">₹1,47,960</h3>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Active Creators</span>
                <h3 className="text-2xl font-bold text-purple-400 mt-1">384 Users</h3>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Pending UTR Approvals</span>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">3 Requests</h3>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- YouTube Connection & Custom Client ID Modal (with 4-Step Guide) --- */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🔗 Connect YouTube & Setup API Quota
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <p className="text-slate-300 text-sm mb-4">
              To avoid upload limits (`exceeded error`), enter your own Google Cloud Client ID & Secret below.
            </p>

            {/* Input Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Google Client ID</label>
                <input 
                  type="text" 
                  value={youtubeClientId}
                  onChange={(e) => setYoutubeClientId(e.target.value)}
                  placeholder="e.g. 10839218...apps.googleusercontent.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Client Secret</label>
                <input 
                  type="password" 
                  value={youtubeClientSecret}
                  onChange={(e) => setYoutubeClientSecret(e.target.value)}
                  placeholder="Enter your OAuth Client Secret"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button 
                onClick={() => saveUserCredentials(youtubeClientId, youtubeClientSecret)}
                className="w-full bg-purple-600 hover:bg-purple-700 font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-purple-600/30"
              >
                Save & Connect YouTube Channel
              </button>
            </div>

            {/* Step-by-Step Visual Guide Accordion */}
            <div className="border-t border-slate-800 pt-4">
              <button 
                onClick={() => setShowClientGuideModal(!showClientGuideModal)}
                className="text-purple-400 text-sm font-medium hover:underline flex items-center gap-1 w-full justify-between"
              >
                <span>❓ Need help getting your Client ID & Secret? (View 4-Step Guide)</span>
                <span>{showClientGuideModal ? '▲' : '▼'}</span>
              </button>

              {showClientGuideModal && (
                <div className="mt-4 space-y-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
                  <div>
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Step 1</span>
                    <p className="text-xs text-slate-300 mt-1">Go to Google Cloud Console and click <b>Create Project</b>[cite: 2].</p>
                    <img src="32044c42.png" alt="Step 1: Create Project" className="rounded-lg mt-2 border border-slate-800 w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Step 2</span>
                    <p className="text-xs text-slate-300 mt-1">Search for <b>YouTube Data API v3</b> in Library and click <b>Enable</b>[cite: 3].</p>
                    <img src="e1a30950.png" alt="Step 2: Enable API" className="rounded-lg mt-2 border border-slate-800 w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Step 3</span>
                    <p className="text-xs text-slate-300 mt-1">Go to Credentials -> Create Credentials -> <b>OAuth client ID</b> (Web application)[cite: 4].</p>
                    <img src="bec526d9.png" alt="Step 3: Create OAuth Client ID" className="rounded-lg mt-2 border border-slate-800 w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Step 4</span>
                    <p className="text-xs text-slate-300 mt-1">Copy your <b>Client ID</b> and <b>Client Secret</b> and paste them above[cite: 5]!</p>
                    <img src="4c658f97.png" alt="Step 4: Copy Credentials" className="rounded-lg mt-2 border border-slate-800 w-full object-cover" />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- Floating AI Support Bubble & Modal --- */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setShowAiSupport(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all transform hover:scale-105 border border-purple-400/30"
        >
          <span className="text-xl">🤖</span>
          <span className="text-sm font-semibold hidden md:inline">AI Support</span>
        </button>
      </div>

      {showAiSupport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full flex flex-col h-[500px] shadow-2xl overflow-hidden text-white">
            
            <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">🤖</div>
                <div>
                  <h3 className="font-bold text-sm">ShortsPilot AI Assistant</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">● Online & Ready</p>
                </div>
              </div>
              <button onClick={() => setShowAiSupport(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {supportMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendSupport} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
              <input 
                type="text"
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                placeholder="Ask AI about upload errors, quota, or features..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              >
                Send
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
