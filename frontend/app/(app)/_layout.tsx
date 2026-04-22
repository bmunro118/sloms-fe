import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { NavLayout } from '@components/navigation/NavLayout';
import { useAuth } from '@context/AuthContext';
import { ScreenTitleProvider } from '@context/ScreenTitleContext';
import { canRoleAccessPath, resolveNavItemsForRole } from '@src/features/app-shell';

export default function AppLayout() {
  const { role, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = useMemo(() => resolveNavItemsForRole(role), [role]);
  const fallbackHref = navItems[0]?.href ?? '/(app)/dashboard';

  // Role-based path guard — fires after paint, never blocks Slot from mounting.
  // Auth guard (unauthenticated redirect) is handled by AuthGuard in app/_layout.tsx.
  useEffect(() => {
    if (role && !canRoleAccessPath(role, pathname)) {
      router.replace(fallbackHref as never);
    }
  }, [role, pathname, fallbackHref, router]);

  return (
    <ScreenTitleProvider>
      <NavLayout items={navItems} onSignOut={signOut}>
        <Slot />
      </NavLayout>
    </ScreenTitleProvider>
  );
}
