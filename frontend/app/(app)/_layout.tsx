import { Slot, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { NavLayout } from '@components/navigation/NavLayout';
import { useAuth } from '@context/AuthContext';
import { ScreenTitleProvider } from '@context/ScreenTitleContext';
import { useAppModal } from '@src/hooks/useAppModal';
import { canRoleAccessPath, resolveNavItemsForRole } from '@src/features/app-shell';

export default function AppLayout() {
  const { role, signOut } = useAuth();
  const { showConfirm } = useAppModal();
  const pathname = usePathname();
  const router = useRouter();
  const redirectGate = useRef<string | null>(null);

  const navItems = useMemo(() => resolveNavItemsForRole(role), [role]);
  const fallbackHref = useMemo(() => navItems[0]?.href ?? '/(app)/dashboard', [navItems]);

  // Role-based path guard — fires after paint, never blocks Slot from mounting.
  // Auth guard (unauthenticated redirect) is handled by AuthGuard in app/_layout.tsx.
  // Uses redirectGate ref to suppress duplicate redirects during navigation
  // transitions that could cause bounce loops in NativeStackNavigator.
  useEffect(() => {
    if (!role) return;
    if (!pathname || pathname === '/') return;

    if (!canRoleAccessPath(role, pathname)) {
      const target = fallbackHref;
      if (redirectGate.current === target) return;
      redirectGate.current = target;
      router.replace(target as never);
    } else {
      redirectGate.current = null;
    }
  }, [role, pathname, fallbackHref, router]);

  const handleSignOut = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
      confirmVariant: 'primary',
    });
    if (confirmed) {
      await signOut();
    }
  }, [showConfirm, signOut]);

  return (
    <ScreenTitleProvider>
      <NavLayout items={navItems} onSignOut={handleSignOut}>
        <Slot />
      </NavLayout>
    </ScreenTitleProvider>
  );
}
