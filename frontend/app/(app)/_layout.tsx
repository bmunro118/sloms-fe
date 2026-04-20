import { Redirect, Slot } from 'expo-router';
import { useMemo } from 'react';
import { NavLayout, NavItem } from '../../src/components/navigation/NavLayout';
import { useAuth } from '../../src/context/AuthContext';

const roleNavMap: Record<string, NavItem[]> = {
  Customer: [
    { label: 'Dashboard', href: '/(app)/dashboard' },
    { label: 'Orders', href: '/(app)/orders' },
    { label: 'Documents', href: '/(app)/documents' },
    { label: 'Account', href: '/(app)/account' },
  ],
  ReadOnly: [
    { label: 'Dashboard', href: '/(app)/dashboard' },
    { label: 'Orders', href: '/(app)/orders' },
    { label: 'Customers', href: '/(app)/customers' },
    { label: 'Documents', href: '/(app)/documents' },
    { label: 'Price List', href: '/(app)/price-list' },
    { label: 'Account', href: '/(app)/account' },
  ],
  Operative: [
    { label: 'Dashboard', href: '/(app)/dashboard' },
    { label: 'Orders', href: '/(app)/orders' },
    { label: 'Customers', href: '/(app)/customers' },
    { label: 'Documents', href: '/(app)/documents' },
    { label: 'Price List', href: '/(app)/price-list' },
    { label: 'Account', href: '/(app)/account' },
  ],
  Manager: [
    { label: 'Dashboard', href: '/(app)/dashboard' },
    { label: 'Orders', href: '/(app)/orders' },
    { label: 'Customers', href: '/(app)/customers' },
    { label: 'Documents', href: '/(app)/documents' },
    { label: 'Price List', href: '/(app)/price-list' },
    { label: 'Settings', href: '/(app)/settings' },
    { label: 'Account', href: '/(app)/account' },
  ],
  Admin: [
    { label: 'Dashboard', href: '/(app)/dashboard' },
    { label: 'Orders', href: '/(app)/orders' },
    { label: 'Customers', href: '/(app)/customers' },
    { label: 'Users', href: '/(app)/users' },
    { label: 'Documents', href: '/(app)/documents' },
    { label: 'Price List', href: '/(app)/price-list' },
    { label: 'Settings', href: '/(app)/settings' },
    { label: 'Account', href: '/(app)/account' },
  ],
};

export default function AppLayout() {
  const { isLoading, isAuthenticated, role, signOut } = useAuth();

  const navItems = useMemo(() => {
    if (!role) return [];
    return roleNavMap[role] ?? roleNavMap.Customer;
  }, [role]);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <NavLayout items={navItems} onSignOut={signOut}>
      <Slot />
    </NavLayout>
  );
}
