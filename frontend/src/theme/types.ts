import { Theme } from '@react-navigation/native';

export interface ThemeColors {
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentMuted: string;
  accentText: string;
  danger: string;
  dangerSurface: string;
  inputBackground: string;
  inputPlaceholder: string;
  overlay: string;
  navBackground: string;
  navBorder: string;
  navTextStrong: string;
  navItemBackground: string;
  navItemHoverBackground: string;
  navItemActiveBackground: string;
  navItemText: string;
  navItemTextActive: string;
  buttonSecondaryBackground: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeLayout {
  contentMaxWidth: number;
  compactSidebarWidth: number;
  expandedSidebarWidth: number;
  drawerWidth: number;
}

export interface AppTheme {
  mode: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  layout: ThemeLayout;
  navigationTheme: Theme;
}