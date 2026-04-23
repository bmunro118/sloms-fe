import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft as BackIcon, LogOut as SignOutIcon, Menu as MenuIcon, X as CloseIcon } from 'lucide-react-native';
import { TooltipPressable } from '@components/ui/TooltipPressable';
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const drawerBottomInset = Math.max(bottomBarHeight, insets.bottom + 64);
  const drawerAnimatedStyle = useMemo(
    () => ({
      opacity: drawerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1],
      }),
      transform: [
        {
          translateX: drawerAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [theme.layout.drawerWidth, 0],
          }),
        },
      ],
    }),
    [drawerAnimation, theme.layout.drawerWidth]
  );

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
    }));
  }, [items, pathname]);

  const openDrawer = useCallback(() => {
    setDrawerVisible(true);
    setDrawerOpen(true);
    drawerAnimation.stopAnimation();
    backdropAnimation.stopAnimation();
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropAnimation, drawerAnimation]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    drawerAnimation.stopAnimation();
    backdropAnimation.stopAnimation();
    Animated.parallel([
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
    });
  }, [backdropAnimation, drawerAnimation]);
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
      <View style={styles.topBarLayer} onLayout={(event) => setTopBarHeight(event.nativeEvent.layout.height)}>
        <TopBar />
      </View>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: Math.max(insets.bottom + 96, bottomBarHeight + 16),
          },
        ]}
      >
        {children}
      </ScrollView>

      {drawerVisible ? (
        <View
          pointerEvents={drawerOpen ? 'auto' : 'none'}
          style={[styles.drawerOverlay, { top: topBarHeight, bottom: drawerBottomInset }]}
        >
          <Animated.View style={[styles.drawerBackdrop, { opacity: backdropAnimation }]}>
            <Pressable style={styles.drawerBackdropPressable} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                paddingTop: 20,
                paddingBottom: 20,
              },
              drawerAnimatedStyle,
            ]}
          >
            <TooltipPressable
              tooltip="Sign out"
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered;
                return [styles.signOutButton, hovered ? styles.signOutButtonHover : null];
              }}
              onPress={onSignOut}
            >
              <View style={styles.navItemContent}>
                <SignOutIcon size={18} color={theme.colors.textPrimary} />
                <Text style={styles.signOutButtonText}>Sign out</Text>
              </View>
            </TooltipPressable>
            <View style={styles.drawerSpacer} />
            <View style={styles.navList}>
              {navigationItems.map((item) => (
                <TooltipPressable
                  key={item.id}
                  tooltip={item.label}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered;
                    return [
                      styles.navItem,
                      item.active ? styles.navItemActive : null,
                      hovered && !item.active ? styles.navItemHover : null,
                    ];
                  }}
                  onPress={createNavigateHandler(item.href)}
                >
                  <View style={styles.navItemContent}>
                    <NavItemIcon
                      icon={item.icon}
                      color={item.active ? theme.colors.navItemTextActive : theme.colors.navItemText}
                    />
                    <Text style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}>{item.label}</Text>
                  </View>
                </TooltipPressable>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 10,
          },
        ]}
        onLayout={(event) => setBottomBarHeight(event.nativeEvent.layout.height)}
      >
        <TooltipPressable tooltip="Go back" style={[styles.bottomBarButton, styles.menuToggleButton]} onPress={goBack}>
          <BackIcon size={18} color={theme.colors.navTextStrong} />
        </TooltipPressable>
        <TooltipPressable
          tooltip={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
          style={[styles.bottomBarButton, styles.menuToggleButton]}
          onPress={drawerOpen ? closeDrawer : openDrawer}
        >
          {drawerOpen
            ? <CloseIcon size={18} color={theme.colors.navTextStrong} />
            : <MenuIcon size={18} color={theme.colors.navTextStrong} />}
        </TooltipPressable>
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
    topBarLayer: {
      position: 'relative',
      zIndex: 200,
      elevation: 200,
      overflow: 'visible',
    },
    contentScroll: {
      zIndex: 1,
      elevation: 1,
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
      zIndex: 100,
      elevation: 8,
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
      right: 0,
      left: 0,
      zIndex: 10,
    },
    drawerBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    drawerBackdropPressable: {
      flex: 1,
    },
    drawerPanel: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: theme.layout.drawerWidth,
      justifyContent: 'flex-start',
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.navBorder,
      overflow: 'visible',
    },
    navList: {
      gap: 8,
      zIndex: 2,
      elevation: 2,
      overflow: 'visible',
    },
    drawerSpacer: {
      flex: 1,
      minHeight: 12,
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
      borderRadius: 10,
      height: 44,
      paddingVertical: 0,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
      justifyContent: 'center',
      zIndex: 1,
      elevation: 1,
    },
    signOutButtonHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    signOutButtonText: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
}