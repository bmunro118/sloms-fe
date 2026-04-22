import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRouteMatch } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function CompactWebNavLayout({ items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
    }));
  }, [items, pathname]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const createNavigateHandler = useCallback(
    (href: (typeof items)[number]['href']) => () => {
      router.push(href as never);
      closeDrawer();
    },
    [closeDrawer, router]
  );

  return (
    <View style={styles.root}>
      <TopBar onMenuPress={openDrawer} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {children}
      </ScrollView>

      {drawerOpen ? (
        <View style={styles.drawerOverlay}>
          <View
            style={[
              styles.drawerPanel,
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
                  style={[styles.navItem, item.active ? styles.navItemActive : null]}
                  onPress={createNavigateHandler(item.href)}
                >
                  <Text style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.signOutButton} onPress={onSignOut}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </View>
          <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flexGrow: 1,
      padding: 20,
    },
    drawerOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
      flexDirection: 'row',
    },
    drawerPanel: {
      width: theme.layout.drawerWidth,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderRightWidth: 1,
      borderRightColor: theme.colors.navBorder,
    },
    drawerBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
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
  });
}