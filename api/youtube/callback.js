export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) return res.status(400).json(tokens);

    const redirectUrl = `https://shortspilot-two.vercel.app/#access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token || ""}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.status(500).send("Auth Error: " + err.message);
  }
}
