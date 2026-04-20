import { UserRole } from '../../../context/AuthContext';

export type AppRoutePath =
  | '/(app)/dashboard'
  | '/(app)/orders'
  | '/(app)/customers'
  | '/(app)/users'
  | '/(app)/documents'
  | '/(app)/price-list'
  | '/(app)/settings'
  | '/(app)/account';

export interface AppShellNavItem {
  id: string;
  label: string;
  href: AppRoutePath;
}

interface NavPolicyItem extends AppShellNavItem {
  visibleTo: UserRole[];
}

const NAV_POLICY: NavPolicyItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/(app)/dashboard',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/(app)/orders',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/(app)/customers',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly'],
  },
  {
    id: 'users',
    label: 'Users',
    href: '/(app)/users',
    visibleTo: ['Admin'],
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/(app)/documents',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'price-list',
    label: 'Price List',
    href: '/(app)/price-list',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/(app)/settings',
    visibleTo: ['Admin', 'Manager'],
  },
  {
    id: 'account',
    label: 'Account',
    href: '/(app)/account',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
];

export function resolveNavItemsForRole(role: UserRole | null): AppShellNavItem[] {
  if (!role) {
    return [];
  }

  return NAV_POLICY.filter((item) => item.visibleTo.includes(role)).map(({ id, label, href }) => ({
    id,
    label,
    href,
  }));
}

export function canRoleAccessPath(role: UserRole | null, path: string): boolean {
  if (!role) {
    return false;
  }

  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

  return NAV_POLICY.some((item) => {
    if (!item.visibleTo.includes(role)) {
      return false;
    }

    return normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);
  });
}
