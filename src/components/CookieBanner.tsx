import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import Button from './Button';
import CookieSettings from './CookieSettings';

export const COOKIES_ACCEPTED = 'holaplex_cookies_acceptance';
export const ANALYTICS_ACCEPTED = 'holaplex_analytics_cookies_acceptance';
export const PREFERENCE_ACCEPTED = 'holaplex_preference_cookies_acceptance';

export function useCookieSettings() {
  const [cookies, setCookie, removeCookie] = useCookies([
    COOKIES_ACCEPTED,
    ANALYTICS_ACCEPTED,
    PREFERENCE_ACCEPTED,
  ]);
  const [openSettings, setOpenSettings] = useState<boolean>(false);
  const [tempDecline, setTempDecline] = useState<boolean>(false);

  const setCookieSettings = ({
    analyticsCookies,
    essentialCookies = true,
    preferenceCookies,
  }: {
    analyticsCookies: boolean;
    essentialCookies: boolean;
    preferenceCookies: boolean;
  }) => {
    setCookie(ANALYTICS_ACCEPTED, analyticsCookies);
    setCookie(COOKIES_ACCEPTED, essentialCookies);
    setCookie(PREFERENCE_ACCEPTED, preferenceCookies);
    setOpenSettings(false);
  };

  const acceptAll = () => {
    setCookie(ANALYTICS_ACCEPTED, true);
    setCookie(COOKIES_ACCEPTED, true);
    setCookie(PREFERENCE_ACCEPTED, true);
    setOpenSettings(false);
  };

  const declineCookies = () => {
    setCookie(ANALYTICS_ACCEPTED, false);
    setCookie(COOKIES_ACCEPTED, false);
    setCookie(PREFERENCE_ACCEPTED, false);
    setTempDecline(true);
    setOpenSettings(false);
  };

  return {
    cookies,
    setCookie,
    removeCookie,
    setCookieSettings,
    openSettings: setOpenSettings,
    isSettingsOpen: openSettings,
    isDeclined: tempDecline,
    declineCookies,
    acceptAllCookies: acceptAll,
  };
}

function CookieBanner() {
  const { cookies, openSettings, isSettingsOpen, isDeclined, declineCookies, acceptAllCookies } =
    useCookieSettings();

  if (cookies[COOKIES_ACCEPTED] === 'true' || isDeclined || typeof window === undefined) {
    return null;
  } else {
    return <></>;
  }
}

export default CookieBanner;
