let isGooglePopupOpening = false;

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
