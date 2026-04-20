import { describe, expect, it } from 'vitest';
import { canRoleAccessPath, resolveNavItemsForRole } from './index';

describe('resolveNavItemsForRole', () => {
  it('gives customer only customer-visible modules', () => {
    const items = resolveNavItemsForRole('Customer').map((item) => item.id);
    expect(items).toEqual(['dashboard', 'orders', 'documents', 'account']);
  });

  it('gives admin full module list', () => {
    const items = resolveNavItemsForRole('Admin').map((item) => item.id);
    expect(items).toEqual([
      'dashboard',
      'orders',
      'customers',
      'users',
      'documents',
      'price-list',
      'settings',
      'account',
    ]);
  });

  it('returns empty list when role is missing', () => {
    expect(resolveNavItemsForRole(null)).toEqual([]);
  });
});

describe('canRoleAccessPath', () => {
  it('allows exact path checks', () => {
    expect(canRoleAccessPath('Manager', '/(app)/settings')).toBe(true);
    expect(canRoleAccessPath('Customer', '/(app)/settings')).toBe(false);
  });

  it('allows exact path checks when route groups are omitted', () => {
    expect(canRoleAccessPath('Manager', '/settings')).toBe(true);
    expect(canRoleAccessPath('Customer', '/settings')).toBe(false);
  });

  it('allows nested paths for authorized base modules', () => {
    expect(canRoleAccessPath('Admin', '/(app)/orders/create')).toBe(true);
    expect(canRoleAccessPath('Admin', '/(app)/orders/123/456')).toBe(true);
  });

  it('allows nested paths when route groups are omitted', () => {
    expect(canRoleAccessPath('Admin', '/orders/create')).toBe(true);
    expect(canRoleAccessPath('Admin', '/orders/123/456')).toBe(true);
  });

  it('denies unknown module paths and missing role', () => {
    expect(canRoleAccessPath('Operative', '/(app)/unknown')).toBe(false);
    expect(canRoleAccessPath(null, '/(app)/dashboard')).toBe(false);
  });
});
