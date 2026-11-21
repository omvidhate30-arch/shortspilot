export default async function handler(req, res) {
  const { code, state } = req.query;

  let customClientId = '';
  let customClientSecret = '';
  let stateOrigin = '';

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (decoded.cid) customClientId = String(decoded.cid).trim();
      if (decoded.csec) customClientSecret = String(decoded.csec).trim();
      if (decoded.origin) stateOrigin = String(decoded.origin).trim();
    } catch {}
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const hostOrigin = req.headers.host ? `${proto}://${req.headers.host}` : '';
  const baseOrigin = stateOrigin || hostOrigin || 'https://www.shortspilot.in';

  if (!code) return res.redirect(`${baseOrigin}/?error=no_code`);

  const clientId =
    customClientId ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';

  const clientSecret = customClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = `${baseOrigin}/api/youtube/callback`;

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
      return res.redirect(`${baseOrigin}/?error=token_exchange_failed`);
    }

    const hash = new URLSearchParams({
      access_token: tokenData.access_token,
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {})
    }).toString();

    return res.redirect(`${baseOrigin}/#${hash}`);
  } catch {
    return res.redirect(`${baseOrigin}/?error=callback_exception`);
  }
}
