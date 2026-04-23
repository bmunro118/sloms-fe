import { usePathname, useRouter } from 'expo-router';
import { ChevronLeft as CollapseIcon, ChevronRight as ExpandIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShellNavItem, isRouteMatch, useAppShell } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { MobileNavLayout } from './MobileNavLayout';
import { NavItemIcon } from './NavItemIcon';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function NavLayout({ items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { platformProfile, shellMode } = useAppShell();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const showDrawer = shellMode === 'drawer';
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const isCollapsed = !isSidebarExpanded;
  const sidebarWidth = isCollapsed ? theme.layout.compactSidebarWidth : theme.layout.expandedSidebarWidth;

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
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
          style={({ hovered }) => [
            styles.navItem,
            item.active ? styles.navItemActive : null,
            hovered && !item.active ? styles.navItemHover : null,
            compact ? styles.navItemCompact : null,
          ]}
          onPress={createNavigateHandler(item.href, onNavigate)}
        >
          <View style={styles.navItemContent}>
            <NavItemIcon
              icon={item.icon}
              color={item.active ? theme.colors.navItemTextActive : theme.colors.navItemText}
            />
            {!compact ? (
              <Text style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}>{item.label}</Text>
            ) : null}
          </View>
        </Pressable>
      ));
    },
    [createNavigateHandler, navigationItems, theme.colors.navItemText, theme.colors.navItemTextActive]
  );

  const renderSidebar = useCallback(
    (compact: boolean) => {
      return (
        <View style={[styles.sidebar, { width: sidebarWidth }]}> 
          <Pressable
            style={({ hovered }) => [
              styles.sidebarToggleButton,
              hovered ? styles.sidebarToggleButtonHover : null,
              compact ? styles.navItemCompact : null,
            ]}
            onPress={() => setIsSidebarExpanded((prev) => !prev)}
          >
            {compact
              ? <ExpandIcon size={18} color={theme.colors.navItemText} />
              : <CollapseIcon size={18} color={theme.colors.navItemText} />}
          </Pressable>
          <View style={styles.navList}>{renderNavItems(compact)}</View>
          <Pressable
            style={({ hovered }) => [
              styles.signOutButton,
              hovered ? styles.signOutButtonHover : null,
              compact ? styles.navItemCompact : null,
            ]}
            onPress={onSignOut}
          >
            <Text style={styles.signOutButtonText}>{compact ? 'Out' : 'Sign out'}</Text>
          </Pressable>
        </View>
      );
    },
    [onSignOut, renderNavItems, sidebarWidth, theme.colors.navItemText]
  );

  if (showDrawer) {
    return (
      <MobileNavLayout items={items} onSignOut={onSignOut}>
        {children}
      </MobileNavLayout>
    );
  }

  if (platformProfile === 'native-tablet') {
    return (
      <View style={[styles.root, styles.rootColumn]}>
        <TopBar />
        <View style={styles.contentRow}>
          {renderSidebar(isCollapsed)}
          <ScrollView contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
        </View>
      </View>
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
    rootColumn: {
      flexDirection: 'column',
    },
    contentRow: {
      flex: 1,
      flexDirection: 'row',
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
    navList: {
      gap: 8,
      marginTop: 8,
    },
    sidebarToggleButton: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.navItemBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sidebarToggleButtonHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    navItem: {
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.navItemBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    navItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    navItemHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
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
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    signOutButtonHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
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
  });
}
