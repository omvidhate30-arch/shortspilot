import { FIREBASE_DB_URL } from './videoUtils';

export const DEFAULT_GOOGLE_CLIENT_ID =
  '801917804614-ro5jolalps8bbtai6g1s1l6f1kj0sgk2.apps.googleusercontent.com';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

let isGooglePopupOpening = false;

export const getAutomaticGoogleClientId = async () => {
  const localSaved = (localStorage.getItem('sp_active_user_client_id') || '').trim();
  if (localSaved && !localSaved.includes('YOUR_GOOGLE_CLIENT_ID')) {
    return localSaved;
  }

  try {
    const dbBase = (localStorage.getItem('sp_firebase_url') || FIREBASE_DB_URL)
      .trim()
      .replace(/\/$/, '');
    const res = await fetch(`${dbBase}/siteConfig/defaultGoogleClientId.json`);
    const remoteId = await res.json();
    if (typeof remoteId === 'string' && remoteId.includes('.apps.googleusercontent.com')) {
      localStorage.setItem('sp_active_user_client_id', remoteId.trim());
      return remoteId.trim();
    }
  } catch {}

  return DEFAULT_GOOGLE_CLIENT_ID.trim();
};

export const openGoogleAccountPopup = async (customClientId = '', hintEmail = '') => {
  if (isGooglePopupOpening) return;
  isGooglePopupOpening = true;
  setTimeout(() => {
    isGooglePopupOpening = false;
  }, 3000);

  const cleanId = (customClientId || (await getAutomaticGoogleClientId())).trim();
  const redirectUri = `${window.location.origin}/`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', cleanId);
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
    'ShortsPilotGoogleAccountPopup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes`
  );

  if (!popup) {
    window.location.assign(authUrl.toString());
  } else {
    popup.focus();
  }
};

export const fetchGoogleAndYouTubeProfile = async (token) => {
  const [userRes, ytRes] = await Promise.all([
    fetch('https://www.googleapis.com/oauth2/v2/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
    fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    )
  ]);

  const userInfo = userRes.ok ? await userRes.json() : {};
  const ytData = ytRes.ok ? await ytRes.json() : {};
  const ch = ytData?.items?.[0];

  const resolvedEmail = (userInfo?.email || '').toLowerCase();
  const resolvedAvatar =
    userInfo?.picture ||
    ch?.snippet?.thumbnails?.high?.url ||
    ch?.snippet?.thumbnails?.default?.url ||
    '';
  const resolvedTitle =
    ch?.snippet?.title ||
    userInfo?.name ||
    (resolvedEmail ? resolvedEmail.split('@')[0] : 'Google User');
  const resolvedHandle =
    ch?.snippet?.customUrl ||
    (resolvedEmail ? `@${resolvedEmail.split('@')[0]}` : '@channel');

  const userObj = {
    email: resolvedEmail,
    name: userInfo?.name || '',
    avatar: resolvedAvatar
  };

  const channelObj = {
    isConnected: true,
    accessToken: token,
    title: resolvedTitle,
    customUrl: resolvedHandle,
    avatar: resolvedAvatar,
    subscribers: Number(ch?.statistics?.subscriberCount || 0).toLocaleString(),
    totalViews: Number(ch?.statistics?.viewCount || 0).toLocaleString(),
    videoCount: Number(ch?.statistics?.videoCount || 0).toLocaleString()
  };

  return { userObj, channelObj };
};
