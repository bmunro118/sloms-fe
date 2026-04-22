import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRouteMatch } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function MobileNavLayout({ title = 'SLOMS', items, onSignOut, children }: NavLayoutProps) {
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
  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const createNavigateHandler = useCallback(
    (href: (typeof items)[number]['href']) => () => {
      router.push(href as never);
      closeDrawer();
    },
    [closeDrawer, router]
  );

  return (
    <View style={styles.root}>
      <TopBar />
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + 96,
          },
        ]}
      >
        {children}
      </ScrollView>

      {drawerOpen ? (
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
          <View
            style={[
              styles.drawerPanel,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <Text style={styles.brand}>{title}</Text>
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
        </View>
      ) : null}

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        <Pressable style={styles.bottomBarButton} onPress={goBack}>
          <Text style={styles.bottomBarButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.bottomBarButton} onPress={openDrawer}>
          <Text style={styles.bottomBarButtonText}>Menu</Text>
        </Pressable>
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
    contentContainer: {
      flexGrow: 1,
      padding: 20,
    },
    bottomBar: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    bottomBarButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    bottomBarButtonText: {
      color: theme.colors.navTextStrong,
      fontSize: 14,
      fontWeight: '700',
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