import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRouteMatch } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { NavItemIcon } from './NavItemIcon';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function CompactWebNavLayout({ items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
    }));
  }, [items, pathname]);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const createNavigateHandler = useCallback(
    (href: (typeof items)[number]['href']) => () => {
      router.push(href as never);
    },
    [router]
  );

  return (
    <View style={styles.root}>
      <TopBar onMenuPress={toggleSidebar} sidebarOpen={sidebarOpen} />
      <View style={styles.contentRow}>
        {sidebarOpen ? (
          <View
            style={[
              styles.sidebarPanel,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.navList}>
              {navigationItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ hovered }) => [
                    styles.navItem,
                    item.active ? styles.navItemActive : null,
                    hovered && !item.active ? styles.navItemHover : null,
                  ]}
                  onPress={createNavigateHandler(item.href)}
                >
                  <View style={styles.navItemContent}>
                    <NavItemIcon
                      icon={item.icon}
                      color={item.active ? theme.colors.navItemTextActive : theme.colors.navItemText}
                    />
                    <Text style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}>{item.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ hovered }) => [styles.signOutButton, hovered ? styles.signOutButtonHover : null]}
              onPress={onSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentRow: {
      flex: 1,
      flexDirection: 'row',
    },
    contentContainer: {
      flexGrow: 1,
      padding: 20,
    },
    sidebarPanel: {
      width: theme.layout.drawerWidth,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderRightWidth: 1,
      borderRightColor: theme.colors.navBorder,
    },
    navList: {
      gap: 8,
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
  });
}