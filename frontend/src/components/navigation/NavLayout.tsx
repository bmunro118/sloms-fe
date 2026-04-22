import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShellNavItem, isRouteMatch, useAppShell } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { CompactWebNavLayout } from './CompactWebNavLayout';
import { MobileNavLayout } from './MobileNavLayout';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function NavLayout({ title = 'SLOMS', items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { platformProfile, shellMode } = useAppShell();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isCollapsed = shellMode === 'sidebar-collapsed';
  const showDrawer = shellMode === 'drawer';
  const sidebarWidth = isCollapsed ? theme.layout.compactSidebarWidth : theme.layout.expandedSidebarWidth;

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
      shortLabel: item.label.slice(0, 1).toUpperCase(),
    }));
  }, [items, pathname]);

  const createNavigateHandler = useCallback(
    (href: AppShellNavItem['href'], onNavigate?: () => void) => () => {
      router.push(href as never);
      onNavigate?.();
    },
    [router]
  );

  const renderNavItems = useCallback(
    (compact: boolean, onNavigate?: () => void) => {
      return navigationItems.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.navItem, item.active ? styles.navItemActive : null, compact ? styles.navItemCompact : null]}
          onPress={createNavigateHandler(item.href, onNavigate)}
        >
          <Text style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}>
            {compact ? item.shortLabel : item.label}
          </Text>
        </Pressable>
      ));
    },
    [createNavigateHandler, navigationItems]
  );

  const renderSidebar = useCallback(
    (compact: boolean) => {
      return (
        <View style={[styles.sidebar, { width: compact ? 84 : sidebarWidth }]}> 
          <Text style={[styles.brand, compact ? styles.brandCompact : null]}>{compact ? title.slice(0, 1) : title}</Text>
          <View style={styles.navList}>{renderNavItems(compact)}</View>
          <Pressable style={[styles.signOutButton, compact ? styles.navItemCompact : null]} onPress={onSignOut}>
            <Text style={styles.signOutButtonText}>{compact ? 'Out' : 'Sign out'}</Text>
          </Pressable>
        </View>
      );
    },
    [onSignOut, renderNavItems, sidebarWidth, title]
  );

  if (showDrawer) {
    if (platformProfile === 'web-compact') {
      return (
        <CompactWebNavLayout title={title} items={items} onSignOut={onSignOut}>
          {children}
        </CompactWebNavLayout>
      );
    }

    return (
      <MobileNavLayout title={title} items={items} onSignOut={onSignOut}>
        {children}
      </MobileNavLayout>
    );
  }

  return (
    <View style={styles.root}>
      {renderSidebar(isCollapsed)}
      <View style={styles.contentColumn}>
        <TopBar />
        <ScrollView contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
    },
    contentColumn: {
      flex: 1,
    },
    sidebar: {
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderRightWidth: 1,
      borderRightColor: theme.colors.navBorder,
    },
    brand: {
      color: theme.colors.navTextStrong,
      fontSize: 21,
      fontWeight: '800',
      marginBottom: 16,
    },
    navList: {
      gap: 8,
    },
    navItem: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.navItemBackground,
    },
    navItemCompact: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    navItemActive: {
      backgroundColor: theme.colors.navItemActiveBackground,
    },
    navItemText: {
      color: theme.colors.navItemText,
      fontSize: 14,
      fontWeight: '600',
    },
    navItemTextActive: {
      color: theme.colors.navItemTextActive,
    },
    signOutButton: {
      marginTop: 16,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceMuted,
    },
    signOutButtonText: {
      color: theme.colors.textPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    contentContainer: {
      flexGrow: 1,
      padding: 20,
    },
    brandCompact: {
      textAlign: 'center',
    },
  });
}
