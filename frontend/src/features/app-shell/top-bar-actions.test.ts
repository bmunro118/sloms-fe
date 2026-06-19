import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({
  ArrowBigLeft: () => null,
  X: () => null,
  Save: () => null,
}));

import { Save as SaveIcon } from 'lucide-react-native';
import { buildIconTopBarAction } from './top-bar-actions';

describe('buildIconTopBarAction', () => {
  it('preserves the primary flag when set', () => {
    const action = buildIconTopBarAction({
      id: 'create-order',
      label: 'New Order',
      onPress: () => {},
      icon: SaveIcon,
      primary: true,
    });

    expect(action.primary).toBe(true);
    expect(action.id).toBe('create-order');
    expect(action.label).toBe('New Order');
  });

  it('does not set primary by default', () => {
    const action = buildIconTopBarAction({
      id: 'edit-order',
      label: 'Edit order',
      onPress: () => {},
      icon: SaveIcon,
    });

    expect(action.primary).toBeUndefined();
  });

  it('preserves the secondary flag when set', () => {
    const action = buildIconTopBarAction({
      id: 'create-customer',
      label: 'Create customer',
      onPress: () => {},
      icon: SaveIcon,
      secondary: true,
    });

    expect(action.secondary).toBe(true);
    expect(action.id).toBe('create-customer');
  });

  it('does not set secondary by default', () => {
    const action = buildIconTopBarAction({
      id: 'create-user',
      label: 'Create user',
      onPress: () => {},
      icon: SaveIcon,
    });

    expect(action.secondary).toBeUndefined();
  });
});
