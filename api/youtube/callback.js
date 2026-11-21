export default async function handler(req, res) {
  const { code, state, error } = req.query;

  let customClientId = '';
  let customClientSecret = '';
  let stateOrigin = '';

  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(String(state), 'base64').toString('utf-8'));
      if (decoded.cid) customClientId = String(decoded.cid).trim();
      if (decoded.csec) customClientSecret = String(decoded.csec).trim();
      if (decoded.origin) stateOrigin = String(decoded.origin).trim();
    } catch {}
  }

  const baseOrigin = stateOrigin || 'https://www.shortspilot.in';

  if (error) {
    return res.redirect(`${baseOrigin}/?error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.redirect(`${baseOrigin}/?error=no_code_received`);
  }

  const clientId =
    customClientId ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';

  const clientSecret = (customClientSecret || process.env.GOOGLE_CLIENT_SECRET || '').trim();

  if (!clientSecret) {
    return res.redirect(`${baseOrigin}/?error=no_client_secret_found`);
  }

  const redirectUri = `${baseOrigin}/api/youtube/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      const reason =
        tokenData.error_description || tokenData.error || 'token_exchange_failed';
      return res.redirect(`${baseOrigin}/?error=${encodeURIComponent(reason)}`);
    }

    const hash = new URLSearchParams({
      access_token: tokenData.access_token,
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {})
    }).toString();

    return res.redirect(`${baseOrigin}/#${hash}`);
  } catch (err) {
    return res.redirect(
      `${baseOrigin}/?error=${encodeURIComponent(err?.message || 'callback_exception')}`
    );
  }
}
