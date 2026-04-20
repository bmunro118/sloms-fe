import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  AppShellMode,
  PlatformOs,
  PlatformProfile,
  resolvePlatformProfile,
  resolveShellMode,
  ViewportSnapshot,
} from '../layout-mode';

interface AppShellContextValue {
  isReady: boolean;
  platformOS: PlatformOs;
  platformProfile: PlatformProfile;
  shellMode: AppShellMode;
  viewport: ViewportSnapshot;
}

const initialViewport: ViewportSnapshot = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [viewport, setViewport] = useState<ViewportSnapshot>(initialViewport);
  const [isReady] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setViewport({
        width: window.width,
        height: window.height,
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const platformOS = Platform.OS as PlatformOs;
  const platformProfile = useMemo(
    () => resolvePlatformProfile(viewport, platformOS),
    [platformOS, viewport]
  );
  const shellMode = useMemo(() => resolveShellMode(viewport, platformProfile), [platformProfile, viewport]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      isReady,
      platformOS,
      platformProfile,
      shellMode,
      viewport,
    }),
    [isReady, platformOS, platformProfile, shellMode, viewport]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error('useAppShell must be used within an AppShellProvider');
  }

  return context;
}
