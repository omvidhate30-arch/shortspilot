export const GOOGLE_CLIENT_ID =
  '801917804614-ro5jolalps8bbtai6g1s1l6f1kj0sgk2.apps.googleusercontent.com';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

let popupLock = false;

export const openGoogleLoginPopup = (hintEmail = '') => {
  if (popupLock) return;
  popupLock = true;
  setTimeout(() => {
    popupLock = false;
  }, 2500);

  const redirectUri = `${window.location.origin}/`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', GOOGLE_SCOPES);
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('include_granted_scopes', 'true');

  if (hintEmail) {
    authUrl.searchParams.set('login_hint', hintEmail.trim().toLowerCase());
  }

  const width = 500;
  const height = 620;
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

  const popup = window.open(
    authUrl.toString(),
    'GoogleLoginPopup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (!popup) {
    window.location.assign(authUrl.toString());
  } else {
    popup.focus();
  }
};

export const fetchGoogleProfile = async (token) => {
  const [meRes, ytRes] = await Promise.all([
    fetch('https://www.googleapis.com/oauth2/v2/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    )
  ]);

  const me = meRes.ok ? await meRes.json() : {};
  const yt = ytRes.ok ? await ytRes.json() : {};
  const ch = yt?.items?.[0];

  const email = (me?.email || '').toLowerCase();
  const avatar =
    me?.picture ||
    ch?.snippet?.thumbnails?.high?.url ||
    ch?.snippet?.thumbnails?.default?.url ||
    '';
  const name =
    ch?.snippet?.title || me?.name || (email ? email.split('@')[0] : 'Google User');
  const handle =
    ch?.snippet?.customUrl || (email ? `@${email.split('@')[0]}` : '@channel');

  return {
    user: { email, name, avatar },
    channel: {
      isConnected: true,
      accessToken: token,
      title: name,
      customUrl: handle,
      avatar,
      subscribers: Number(ch?.statistics?.subscriberCount || 0).toLocaleString(),
      totalViews: Number(ch?.statistics?.viewCount || 0).toLocaleString(),
      videoCount: Number(ch?.statistics?.videoCount || 0).toLocaleString()
    }
  };
};
