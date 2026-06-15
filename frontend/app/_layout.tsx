import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@components/error/AppErrorBoundary';
import { AppModalProvider } from '@context/AppModalContext';
import { AuthProvider, useAuth } from '@context/AuthContext';
import { AppShellProvider, isRouteMatch } from '@src/features/app-shell';
import { AppThemeProvider } from '@theme/ThemeProvider';

/**
 * AuthGuard lives inside AuthProvider so it can read auth state.
 * It always renders <Stack> — never conditionally swaps it for a View.
 * Redirects happen in useEffect (after paint), never during render.
 *
 * CRITICAL: uses a stable segmentKey (via useMemo) instead of raw segments
 * in effect deps. useSegments() returns a fresh array on every render,
 * which would cause the effect to re-fire infinitely → Maximum update depth
 * exceeded in NativeStackNavigator.
 *
 * Also uses a redirectGate ref to suppress duplicate redirects when both
 * a screen-level <Redirect> and AuthGuard's router.replace fire on the
 * same auth state change (e.g. login screen <Redirect> + AuthGuard redirect).
 */
function AuthGuard() {
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const redirectGate = useRef<string | null>(null);

  // Stable string key derived from segments — prevents effect re-fires
  // when useSegments() returns a new array reference with same values.
  const segmentKey = useMemo(() => segments.join('/'), [segments]);
  const onChangePasswordRoute = isRouteMatch(pathname, '/change-password');

  useEffect(() => {
    if (isLoading) return;

    const inApp = segmentKey.startsWith('(app)');

    let target: string | null = null;

    if (mustChangePassword) {
      // Forced password change: keep the user on the change-password screen.
      if (!onChangePasswordRoute) {
        target = '/change-password';
      }
    } else if (!isAuthenticated) {
      // Signed out (and not mid password-change): only login route is allowed.
      if (inApp || onChangePasswordRoute) {
        target = '/';
      }
    } else if (!inApp) {
      // Fully authenticated: pull into the app shell.
      target = '/(app)/dashboard';
    }

    if (target !== null) {
      // Suppress duplicate redirect when a screen-level <Redirect>
      // already handled the same transition.
      if (redirectGate.current === target) return;
      redirectGate.current = target;
      router.replace(target as never);
    } else {
      redirectGate.current = null;
    }
  }, [isLoading, isAuthenticated, mustChangePassword, segmentKey, onChangePasswordRoute, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppErrorBoundary>
          <AppShellProvider>
            <AppModalProvider>
              <AuthProvider>
                <AuthGuard />
              </AuthProvider>
            </AppModalProvider>
          </AppShellProvider>
        </AppErrorBoundary>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
