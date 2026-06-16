import { ThemeLayout, ThemeRadii, ThemeSpacing, ThemeZIndex } from '@theme/types';

export const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii: ThemeRadii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

export const layout: ThemeLayout = {
  contentMaxWidth: 800,
  compactSidebarWidth: 84,
  expandedSidebarWidth: 240,
  drawerWidth: 260,
};

export const zIndex: ThemeZIndex = {
  content: 1,
  floatingAction: 2,
  drawer: 10,
  filterDropdown: 20,
  bottomBar: 100,
  topBar: 200,
  topBarSurface: 300,
  tooltip: 9999,
};

export const tokens = { spacing, radii, layout, zIndex };