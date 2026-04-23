export type PlatformOs = 'ios' | 'android' | 'web';

export type PlatformProfile =
  | 'web-desktop'
  | 'web-compact'
  | 'native-phone'
  | 'native-tablet';

export type AppShellMode = 'sidebar' | 'sidebar-collapsed' | 'drawer';

export const SHELL_BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wideDesktop: 1280,
} as const;

export interface ViewportSnapshot {
  width: number;
  height: number;
}

export function resolvePlatformProfile(
  snapshot: ViewportSnapshot,
  platformOS: PlatformOs
): PlatformProfile {
  const { width, height } = snapshot;
  const isLandscape = width > height;

  if (platformOS === 'web') {
    return width >= SHELL_BREAKPOINTS.desktop ? 'web-desktop' : 'web-compact';
  }

  if (width >= SHELL_BREAKPOINTS.tablet || (isLandscape && width >= 700)) {
    return 'native-tablet';
  }

  return 'native-phone';
}

export function resolveShellMode(
  snapshot: ViewportSnapshot,
  profile: PlatformProfile
): AppShellMode {
  if (profile === 'web-desktop' || profile === 'web-compact' || profile === 'native-tablet') {
    return 'sidebar-collapsed';
  }

  return 'drawer';
}
