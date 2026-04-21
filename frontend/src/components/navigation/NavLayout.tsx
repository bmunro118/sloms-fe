import { usePathname, useRouter } from 'expo-router';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppShellNavItem, isRouteMatch, useAppShell } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';

interface NavLayoutProps extends PropsWithChildren {
  title?: string;
  items: AppShellNavItem[];
  onSignOut: () => Promise<void> | void;
}

export function NavLayout({ title = 'SLOMS', items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { shellMode } = useAppShell();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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
    return (
      <View style={styles.rootDrawer}>
        <View style={[styles.mobileTopBar, { paddingTop: insets.top + 10 }]}> 
          <Pressable style={styles.menuButton} onPress={openDrawer}>
            <Text style={styles.menuButtonText}>Menu</Text>
          </Pressable>
          <Text style={styles.mobileTitle}>{title}</Text>
          <Pressable style={styles.menuButton} onPress={onSignOut}>
            <Text style={styles.menuButtonText}>Out</Text>
          </Pressable>
        </View>

        {drawerOpen ? (
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
            <View style={[styles.drawerPanel, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}> 
              <Text style={styles.brand}>{title}</Text>
              <View style={styles.navList}>{renderNavItems(false, closeDrawer)}</View>
              <Pressable style={styles.signOutButton} onPress={onSignOut}>
                <Text style={styles.signOutButtonText}>Sign out</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>{children}</ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderSidebar(isCollapsed)}

      <ScrollView contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
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
    rootDrawer: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    mobileTopBar: {
      minHeight: 62,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mobileTitle: {
      color: theme.colors.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    menuButton: {
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    menuButtonText: {
      color: theme.colors.navTextStrong,
      fontWeight: '600',
      fontSize: 13,
    },
    drawerOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      flexDirection: 'row',
    },
    drawerBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
    },
    drawerPanel: {
      width: theme.layout.drawerWidth,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.navBorder,
    },
  });
}
