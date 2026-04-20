import { UserRole } from '@context/AuthContext';

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

function normalizeRoutePath(path: string): string {
  const withoutTrailingSlash = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  // Expo route groups like /(app) are not present in usePathname(), so strip groups before matching.
  const withoutGroups = withoutTrailingSlash.replace(/\/\([^/]+\)(?=\/|$)/g, '');
  return withoutGroups || '/';
}

export function isRouteMatch(path: string, href: AppRoutePath): boolean {
  const normalizedPath = normalizeRoutePath(path);
  const normalizedHref = normalizeRoutePath(href);

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

export function canRoleAccessPath(role: UserRole | null, path: string): boolean {
  if (!role) {
    return false;
  }

  return NAV_POLICY.some((item) => {
    if (!item.visibleTo.includes(role)) {
      return false;
    }

    return isRouteMatch(path, item.href);
  });
}
