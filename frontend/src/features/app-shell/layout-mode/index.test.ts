import { describe, expect, it } from 'vitest';
import { resolvePlatformProfile, resolveShellMode, SHELL_BREAKPOINTS } from './index';

describe('resolvePlatformProfile', () => {
  it('classifies desktop web correctly', () => {
    const profile = resolvePlatformProfile({ width: 1440, height: 900 }, 'web');
    expect(profile).toBe('web-desktop');
  });

  it('classifies compact web correctly', () => {
    const profile = resolvePlatformProfile({ width: 900, height: 900 }, 'web');
    expect(profile).toBe('web-compact');
  });

  it('classifies native tablet in landscape threshold', () => {
    const profile = resolvePlatformProfile({ width: 700, height: 390 }, 'android');
    expect(profile).toBe('native-tablet');
  });

  it('classifies native phone below tablet threshold', () => {
    const profile = resolvePlatformProfile({ width: 390, height: 844 }, 'ios');
    expect(profile).toBe('native-phone');
  });
});

describe('resolveShellMode', () => {
  it('uses collapsed sidebar on wide desktop', () => {
    const mode = resolveShellMode(
      { width: SHELL_BREAKPOINTS.wideDesktop, height: 900 },
      'web-desktop'
    );
    expect(mode).toBe('sidebar-collapsed');
  });

  it('uses collapsed sidebar on medium desktop', () => {
    const mode = resolveShellMode({ width: 1100, height: 900 }, 'web-desktop');
    expect(mode).toBe('sidebar-collapsed');
  });

  it('uses collapsed sidebar on native tablet regardless of width', () => {
    const mode = resolveShellMode({ width: 900, height: 1024 }, 'native-tablet');
    expect(mode).toBe('sidebar-collapsed');
  });

  it('uses collapsed sidebar on compact web', () => {
    expect(resolveShellMode({ width: 480, height: 900 }, 'web-compact')).toBe('sidebar-collapsed');
  });

  it('uses drawer for native phone', () => {
    expect(resolveShellMode({ width: 390, height: 844 }, 'native-phone')).toBe('drawer');
  });
});
