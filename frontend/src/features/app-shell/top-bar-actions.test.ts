import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({
  ArrowBigLeft: () => null,
  X: () => null,
  Save: () => null,
}));

let mockPlatformOS = 'web';

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: <T>(options: Record<string, T>) => options[mockPlatformOS],
  },
}));

vi.mock('expo-router', () => ({
  router: {
    back: vi.fn(),
    canGoBack: vi.fn(),
  },
}));

import { router } from 'expo-router';
import { Save as SaveIcon } from 'lucide-react-native';
import { buildIconTopBarAction, goBackWithBrowserFallback } from './top-bar-actions';

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

describe('goBackWithBrowserFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPlatformOS = 'web';
    vi.stubGlobal('window', {
      history: {
        length: 2,
        back: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses window.history.back on web when history has a previous entry', () => {
    goBackWithBrowserFallback();

    expect(window.history.back).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('falls back to router.back when web history has no previous entry', () => {
    vi.mocked(router.canGoBack).mockReturnValue(true);
    vi.stubGlobal('window', {
      history: {
        length: 1,
        back: vi.fn(),
      },
    });

    goBackWithBrowserFallback();

    expect(window.history.back).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('does nothing on web when neither history nor router can go back', () => {
    vi.mocked(router.canGoBack).mockReturnValue(false);
    vi.stubGlobal('window', {
      history: {
        length: 1,
        back: vi.fn(),
      },
    });

    goBackWithBrowserFallback();

    expect(window.history.back).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('uses router.back on native when available', () => {
    mockPlatformOS = 'ios';
    vi.mocked(router.canGoBack).mockReturnValue(true);

    goBackWithBrowserFallback();

    expect(window.history.back).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('does nothing on native when router cannot go back', () => {
    mockPlatformOS = 'ios';
    vi.mocked(router.canGoBack).mockReturnValue(false);

    goBackWithBrowserFallback();

    expect(window.history.back).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });
});
