import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@components/error/AppErrorBoundary';
import { AuthProvider, useAuth } from '@context/AuthContext';
import { AppShellProvider } from '@src/features/app-shell';
import { AppThemeProvider } from '@theme/ThemeProvider';

/**
 * AuthGuard lives inside AuthProvider so it can read auth state.
 * It always renders <Stack> — never conditionally swaps it for a View.
 * Redirects happen in useEffect (after paint), never during render,
 * so they cannot interfere with React Navigation's useSyncExternalStore
 * subscription in withLayoutContext.
 */
function AuthGuard() {
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inApp = segments[0] === '(app)';
    const inChangePassword = segments[0] === 'change-password';

    if (mustChangePassword && !inChangePassword) {
      router.replace('/change-password');
    } else if (!isAuthenticated && (inApp || inChangePassword)) {
      router.replace('/');
    } else if (isAuthenticated && !mustChangePassword && !inApp) {
      router.replace('/(app)/dashboard');
    }
  }, [isLoading, isAuthenticated, mustChangePassword, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppErrorBoundary>
          <AppShellProvider>
            <AuthProvider>
              <AuthGuard />
            </AuthProvider>
          </AppShellProvider>
        </AppErrorBoundary>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
