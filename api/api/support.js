export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, apiKey } = req.body;
  // Admin Panel या Vercel Env से DeepSeek Key लेगा
  const DEEPSEEK_API_KEY = apiKey || process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'DeepSeek API Key missing' });
  }

  const systemPrompt = `
You are the official 24/7 AI Support Assistant for "ShortsPilot AI Studio" (https://shortspilot-two.vercel.app).
Help users politely, concisely, and accurately in Hinglish (or the language the user asks in).

Key Facts about ShortsPilot AI Studio:
1. Features: 1-Click 9:16 Vertical Video Cropping (client-side, zero quality loss), DeepSeek Viral SEO Engine (Titles, Tags, Hooks, Reels Hashtags), and Smart Peak-Time Auto-Scheduler (07:30 PM IST default).
2. Plans & Pricing:
   - Free / Uncut Mode: Full Short upload.
   - Monthly Creator Plan: ₹499/month (Use coupon code 'SAVE200' to get it for ₹299!). Extracts 3 Viral Clips per video.
   - Yearly Studio VIP Plan: ₹3,999/year (Original ₹5,999). Extracts 5 Viral Clips per video + Priority VIP perks.
3. Payment & Activation: Users pay via UPI and submit their 12-digit UTR number. Activation takes 5–15 minutes after admin verification.
4. 30-Day Views Guarantee: We guarantee 50K to 100K minimum monthly views (subject to T&C: consistent daily uploads using our AI SEO & peak schedule). If not met, the plan auto-extends for free.
5. Troubleshooting:
   - YouTube Token / Upload error: System has a Self-Healing Auto-Refresh engine. If stuck, tell them to click 'Reconnect YouTube' once.
   - Video Queue Safety: Videos are saved safely in browser IndexedDB, so refreshing the page won't delete them.

Rules:
- Keep answers short (2-4 lines max) and easy to read with bullet points if needed.
- Never reveal internal admin pins, Telegram chat IDs, or API keys.
- If a user has a payment issue pending for >30 mins, ask them to share their registered Gmail and 12-digit UTR number so the team can check.
`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-6) // आखिरी 6 मैसेज ही भेजें ताकि टोकन बचें
        ],
        temperature: 0.5,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "माफ़ कीजिए, अभी सर्वर व्यस्त है। कृपया थोड़ी देर बाद प्रयास करें।";
    
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Support AI Error:', error);
    return res.status(500).json({ error: 'Failed to connect to Support AI' });
  }
}
