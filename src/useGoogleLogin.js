import { useState, useEffect, useRef, useCallback } from 'react';
import { openGoogleLoginPopup, fetchGoogleProfile } from './googleAuth';

export function useGoogleLogin() {
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sp_google_user') || 'null');
    } catch {
      return null;
    }
  });

  const [ytChannel, setYtChannel] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sp_yt_channel') || 'null');
    } catch {
      return null;
    }
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const oauthHandledRef = useRef(false);

  const saveSession = useCallback((token, user, channel) => {
    if (token) {
      localStorage.setItem('sp_google_token', token);
    }

    if (user?.email) {
      const cleanUser = {
        email: user.email.trim().toLowerCase(),
        name: user.name || '',
        avatar: user.avatar || ''
      };
      setGoogleUser(cleanUser);
      localStorage.setItem('sp_google_user', JSON.stringify(cleanUser));
    }

    if (channel) {
      const connectedChannel = {
        ...channel,
        isConnected: true,
        accessToken: token
      };
      setYtChannel(connectedChannel);
      localStorage.setItem('sp_yt_channel', JSON.stringify(connectedChannel));
    }

    setIsLoggingIn(false);
    setLoginError('');
  }, []);

  useEffect(() => {
    const completeFromToken = async (token) => {
      if (!token || oauthHandledRef.current) return;
      oauthHandledRef.current = true;
      setIsLoggingIn(true);

      try {
        const { user, channel } = await fetchGoogleProfile(token);
        saveSession(token, user, channel);

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              {
                type: 'GOOGLE_LOGIN_SUCCESS',
                token,
                user,
                channel
              },
              window.location.origin
            );
          } catch {}

          window.close();
          return;
        }
      } catch {
        setIsLoggingIn(false);
        setLoginError('Google profile fetch failed. Please try again.');
        oauthHandledRef.current = false;
      }
    };

    const hash = window.location.hash || '';
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const token = params.get('access_token');
      if (token) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
        completeFromToken(token);
      }
    }

    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_LOGIN_SUCCESS' && event.data?.token) {
        if (oauthHandledRef.current) return;
        oauthHandledRef.current = true;
        saveSession(event.data.token, event.data.user, event.data.channel);
        setTimeout(() => {
          oauthHandledRef.current = false;
        }, 1200);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [saveSession]);

  const startGoogleLogin = useCallback(() => {
    if (isLoggingIn) return;
    oauthHandledRef.current = false;
    setLoginError('');
    setIsLoggingIn(true);
    openGoogleLoginPopup(googleUser?.email || '');
  }, [googleUser?.email, isLoggingIn]);

  const logoutGoogle = useCallback(() => {
    oauthHandledRef.current = false;
    localStorage.removeItem('sp_google_user');
    localStorage.removeItem('sp_yt_channel');
    localStorage.removeItem('sp_google_token');
    setGoogleUser(null);
    setYtChannel(null);
    setIsLoggingIn(false);
    setLoginError('');
  }, []);

  return {
    googleUser,
    ytChannel,
    isGoogleConnected: Boolean(ytChannel?.isConnected || googleUser?.email),
    isLoggingIn,
    loginError,
    startGoogleLogin,
    logoutGoogle
  };
}
