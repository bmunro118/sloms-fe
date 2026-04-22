import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft as BackIcon, Menu as MenuIcon, X as CloseIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isRouteMatch } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { NavItemIcon } from './NavItemIcon';
import { NavLayoutProps } from './navigationTypes';
import { TopBar } from './TopBar';

export function MobileNavLayout({ items, onSignOut, children }: NavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const drawerBottomInset = Math.max(bottomBarHeight, insets.bottom + 64);

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
        <View style={[styles.drawerOverlay, { bottom: drawerBottomInset }]}>
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
        </View>
      ) : null}

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 10,
          },
        ]}
        onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
      >
        <Pressable style={[styles.bottomBarButton, styles.menuToggleButton]} onPress={goBack}>
          <BackIcon size={18} color={theme.colors.navTextStrong} />
        </Pressable>
        <Pressable style={[styles.bottomBarButton, styles.menuToggleButton]} onPress={drawerOpen ? closeDrawer : openDrawer}>
          {drawerOpen
            ? <CloseIcon size={18} color={theme.colors.navTextStrong} />
            : <MenuIcon size={18} color={theme.colors.navTextStrong} />}
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
    menuToggleButton: {
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    bottomBarButtonText: {
      color: theme.colors.navTextStrong,
      fontSize: 14,
      fontWeight: '700',
    },
    drawerOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
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