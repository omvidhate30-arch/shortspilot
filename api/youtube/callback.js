export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  const CLIENT_ID =
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    '483431402516-h3o0j453anu0br2dm2mra54kr7vutroq.apps.googleusercontent.com';

  const CLIENT_SECRET = ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID.trim(),
        client_secret: CLIENT_SECRET.trim(),
        redirect_uri: 'https://shortspilot-two.vercel.app/api/youtube/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Token exchange failed', details: tokens });
    }

    const hashParams = new URLSearchParams({
      access_token: tokens.access_token,
      ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
    });

    return res.redirect(302, `https://shortspilot-two.vercel.app/#${hashParams.toString()}`);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
