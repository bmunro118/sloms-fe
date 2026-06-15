import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const COOKIE_NAME = 'sonic-sidebar-expanded';
const COOKIE_MAX_AGE_SECONDS = 31536000; // 1 year

function readSidebarCookie(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    if (typeof document === 'undefined') return false;
    return document.cookie
      .split('; ')
      .some((segment) => segment.startsWith(`${COOKIE_NAME}=true`));
  } catch {
    return false;
  }
}

function writeSidebarCookie(expanded: boolean): void {
  if (Platform.OS !== 'web') return;
  try {
    if (typeof document === 'undefined') return;
    document.cookie = [
      `${COOKIE_NAME}=${expanded}`,
      'path=/',
      `max-age=${COOKIE_MAX_AGE_SECONDS}`,
      'SameSite=Strict',
    ].join(';');
  } catch {
    // Silently ignore cookie write failures (e.g. blocked by browser policy)
  }
}

/**
 * Persists the sidebar expand / collapse preference via a browser cookie on
 * web.  On native platforms the returned state is plain in-memory and always
 * starts collapsed.
 *
 * The cookie (`sonic-sidebar-expanded`) is read once on mount and written
 * every time the user toggles the sidebar, so the preference survives page
 * reloads and browser restarts (1-year max-age).
 */
export function useSidebarCookiePreference(): [
  boolean,
  (value: boolean) => void,
] {
  const [isExpanded, setIsExpanded] = useState<boolean>(() =>
    readSidebarCookie(),
  );

  useEffect(() => {
    writeSidebarCookie(isExpanded);
  }, [isExpanded]);

  return [isExpanded, setIsExpanded];
}
