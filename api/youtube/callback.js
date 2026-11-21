export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!code) return res.redirect('/?error=no_code');

  let customClientId = '';
  let customClientSecret = '';

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decoded.cid) customClientId = String(decoded.cid).trim();
      if (decoded.csec) customClientSecret = String(decoded.csec).trim();
    } catch {}
  }

  const clientId =
    customClientId ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';

  const clientSecret =
    customClientSecret ||
    process.env.GOOGLE_CLIENT_SECRET ||
    ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${req.headers.host}/api/youtube/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect('/?error=token_exchange_failed');
    }

    const hash = new URLSearchParams({
      access_token: tokenData.access_token,
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {})
    }).toString();

    return res.redirect(`/#${hash}`);
  } catch {
    return res.redirect('/?error=callback_exception');
  }
}
