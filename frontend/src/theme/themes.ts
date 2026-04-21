import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { layout, radii, spacing } from '@theme/tokens';
import { AppTheme, ThemeColors } from '@theme/types';

const lightColors: ThemeColors = {
  background: '#f8fafc',
  backgroundMuted: '#eef2f6',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  surfaceElevated: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#475569',
  border: '#cbd5e1',
  borderStrong: '#94a3b8',
  accent: '#0f766e',
  accentMuted: '#115e59',
  accentText: '#ffffff',
  danger: '#b91c1c',
  dangerSurface: '#fee2e2',
  inputBackground: '#ffffff',
  inputPlaceholder: '#94a3b8',
  overlay: 'rgba(15, 23, 42, 0.5)',
  navBackground: '#0f172a',
  navBorder: '#1e293b',
  navTextStrong: '#f8fafc',
  navItemBackground: '#111827',
  navItemActiveBackground: '#0f766e',
  navItemText: '#cbd5e1',
  navItemTextActive: '#ffffff',
  buttonSecondaryBackground: '#ffffff',
  buttonSecondaryText: '#334155',
  buttonSecondaryBorder: '#cbd5e1',
};

const darkColors: ThemeColors = {
  background: '#020617',
  backgroundMuted: '#0f172a',
  surface: '#111827',
  surfaceMuted: '#1e293b',
  surfaceElevated: '#162033',
  textPrimary: '#f8fafc',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  border: '#334155',
  borderStrong: '#475569',
  accent: '#14b8a6',
  accentMuted: '#0f766e',
  accentText: '#06201d',
  danger: '#f87171',
  dangerSurface: '#3f1013',
  inputBackground: '#0f172a',
  inputPlaceholder: '#64748b',
  overlay: 'rgba(2, 6, 23, 0.72)',
  navBackground: '#020617',
  navBorder: '#1e293b',
  navTextStrong: '#f8fafc',
  navItemBackground: '#111827',
  navItemActiveBackground: '#14b8a6',
  navItemText: '#cbd5e1',
  navItemTextActive: '#06201d',
  buttonSecondaryBackground: '#0f172a',
  buttonSecondaryText: '#e2e8f0',
  buttonSecondaryBorder: '#334155',
};

function createTheme(mode: 'light' | 'dark', colors: ThemeColors): AppTheme {
  const baseNavigationTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    mode,
    isDark: mode === 'dark',
    colors,
    spacing,
    radii,
    layout,
    navigationTheme: {
      ...baseNavigationTheme,
      colors: {
        ...baseNavigationTheme.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.danger,
      },
    },
  };
}

export const lightTheme = createTheme('light', lightColors);
export const darkTheme = createTheme('dark', darkColors);