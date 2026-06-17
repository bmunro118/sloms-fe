import { UserRole } from '@context/AuthContext';
import { featureFlags } from '@utils/features';

export type AppRoutePath =
  | '/(app)/dashboard'
  | '/(app)/orders'
  | '/(app)/customers'
  | '/(app)/users'
  | '/(app)/documents'
  | '/(app)/price-list'
  | '/(app)/settings'
  | '/(app)/vat-rates'
  | '/(app)/account';

export interface AppShellNavItem {
  id: string;
  label: string;
  href: AppRoutePath;
  icon: AppShellNavIcon;
}

export type AppShellNavIcon =
  | 'layout-dashboard'
  | 'package'
  | 'users'
  | 'user-cog'
  | 'file-text'
  | 'tags'
  | 'settings'
  | 'percent'
  | 'circle-user';

interface NavPolicyItem extends AppShellNavItem {
  visibleTo: UserRole[];
  requiresFeature?: import('@utils/features').FeatureName;
}

const NAV_POLICY: NavPolicyItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/(app)/dashboard',
    icon: 'layout-dashboard',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/(app)/orders',
    icon: 'package',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/(app)/customers',
    icon: 'users',
    visibleTo: ['Admin', 'Manager', 'Operative'],
  },
  {
    id: 'users',
    label: 'Users',
    href: '/(app)/users',
    icon: 'user-cog',
    visibleTo: ['Admin'],
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/(app)/documents',
    icon: 'file-text',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
    requiresFeature: 'documentsPage',
  },
  {
    id: 'price-list',
    label: 'Price List',
    href: '/(app)/price-list',
    icon: 'tags',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly'],
    requiresFeature: 'priceListPage',
  },
  {
    id: 'vat-rates',
    label: 'VAT Rates',
    href: '/(app)/vat-rates',
    icon: 'percent',
    visibleTo: ['Admin', 'Manager'],
    requiresFeature: 'vatRatesPage',
  },
  {
    id: 'account',
    label: 'Account',
    href: '/(app)/account',
    icon: 'circle-user',
    visibleTo: ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/(app)/settings',
    icon: 'settings',
    visibleTo: ['Admin', 'Manager'],
  },
];

export function resolveNavItemsForRole(role: UserRole | null): AppShellNavItem[] {
  if (!role) {
    return [];
  }

  return NAV_POLICY.filter((item) => {
    // Role check
    if (!item.visibleTo.includes(role)) {
      return false;
    }
    // Feature flag check
    if (item.requiresFeature && !featureFlags[item.requiresFeature]) {
      return false;
    }
    return true;
  }).map(({ id, label, href, icon }) => ({
    id,
    label,
    href,
    icon,
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
