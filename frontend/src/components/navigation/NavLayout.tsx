import { usePathname, useRouter } from 'expo-router';
import { LogOut as SignOutIcon, PanelLeftClose as CollapseIcon, PanelLeftOpen as ExpandIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, PressableStateCallbackType, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppShellNavItem, isRouteMatch, useAppShell } from '@src/features/app-shell';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { TooltipPressable } from '@components/ui/TooltipPressable';
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
  const [showSidebarText, setShowSidebarText] = useState(false);
  const isCollapsed = !isSidebarExpanded;
  const animatedSidebarWidth = useRef(new Animated.Value(theme.layout.compactSidebarWidth)).current;
  const sidebarTextOpacity = animatedSidebarWidth.interpolate({
    inputRange: [theme.layout.compactSidebarWidth, theme.layout.expandedSidebarWidth],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const sidebarTextTranslateX = animatedSidebarWidth.interpolate({
    inputRange: [theme.layout.compactSidebarWidth, theme.layout.expandedSidebarWidth],
    outputRange: [-6, 0],
    extrapolate: 'clamp',
  });
  const sidebarTextContainerWidth = animatedSidebarWidth.interpolate({
    inputRange: [theme.layout.compactSidebarWidth, theme.layout.expandedSidebarWidth],
    outputRange: [0, theme.layout.expandedSidebarWidth - theme.layout.compactSidebarWidth],
    extrapolate: 'clamp',
  });

  const animateSidebarWidth = useCallback(
    (expanded: boolean) => {
      if (expanded) {
        setShowSidebarText(true);
      }

      animatedSidebarWidth.stopAnimation();
      Animated.timing(animatedSidebarWidth, {
        toValue: expanded ? theme.layout.expandedSidebarWidth : theme.layout.compactSidebarWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && !expanded) {
          setShowSidebarText(false);
        }
      });
    },
    [animatedSidebarWidth, theme.layout.compactSidebarWidth, theme.layout.expandedSidebarWidth]
  );

  useEffect(() => {
    animateSidebarWidth(isSidebarExpanded);
  }, [animateSidebarWidth, isSidebarExpanded]);

  const navigationItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      active: isRouteMatch(pathname, item.href),
    }));
  }, [items, pathname]);

  const isHovered = (state: PressableStateCallbackType) => {
    return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
  };

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
        <TooltipPressable
          key={item.id}
          tooltip={item.label}
          style={(state) => [
            styles.navItem,
            item.active ? styles.navItemActive : null,
            isHovered(state) && !item.active ? styles.navItemHover : null,
          ]}
          onPress={createNavigateHandler(item.href, onNavigate)}
        >
          <View style={[styles.navItemContent, !showSidebarText ? styles.navItemContentCompact : null]}>
            <View style={styles.navItemIconSlot}>
              <NavItemIcon
                icon={item.icon}
                color={item.active ? theme.colors.navItemTextActive : theme.colors.navItemText}
              />
            </View>
            {showSidebarText ? (
              <Animated.View
                style={[
                  styles.sidebarLabelContainer,
                  {
                    width: sidebarTextContainerWidth,
                    opacity: sidebarTextOpacity,
                    transform: [{ translateX: sidebarTextTranslateX }],
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={[styles.navItemText, item.active ? styles.navItemTextActive : null]}
                >
                  {item.label}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </TooltipPressable>
      ));
    },
    [
      createNavigateHandler,
      navigationItems,
      showSidebarText,
      sidebarTextContainerWidth,
      sidebarTextOpacity,
      sidebarTextTranslateX,
      theme.colors.navItemText,
      theme.colors.navItemTextActive,
    ]
  );

  const renderSidebar = useCallback(
    (compact: boolean) => {
      return (
        <Animated.View style={[styles.sidebar, { width: animatedSidebarWidth }]}> 
          <TooltipPressable
            tooltip={compact ? 'Expand sidebar' : 'Collapse sidebar'}
            style={(state) => [
              styles.navItem,
              styles.navItemCompact,
              styles.sidebarToggleButton,
              isHovered(state) ? styles.navItemHover : null,
            ]}
            onPress={() => setIsSidebarExpanded((prev) => !prev)}
          >
            {compact
              ? <ExpandIcon size={18} color={theme.colors.navItemText} />
              : <CollapseIcon size={18} color={theme.colors.navItemText} />}
          </TooltipPressable>
          <View style={styles.navList}>{renderNavItems(compact)}</View>
          <TooltipPressable
            tooltip="Sign out"
            style={(state) => [
              styles.signOutButton,
              isHovered(state) ? styles.signOutButtonHover : null,
            ]}
            onPress={onSignOut}
          >
            <View style={[styles.navItemContent, !showSidebarText ? styles.navItemContentCompact : null]}>
              <View style={styles.navItemIconSlot}>
                <SignOutIcon size={18} color={theme.colors.textPrimary} />
              </View>
              {showSidebarText ? (
                <Animated.View
                  style={[
                    styles.sidebarLabelContainer,
                    {
                      width: sidebarTextContainerWidth,
                      opacity: sidebarTextOpacity,
                      transform: [{ translateX: sidebarTextTranslateX }],
                    },
                  ]}
                >
                    <Text numberOfLines={1} ellipsizeMode="clip" style={styles.signOutButtonText}>
                      Sign out
                    </Text>
                </Animated.View>
              ) : null}
            </View>
          </TooltipPressable>
        </Animated.View>
      );
    },
    [
      animatedSidebarWidth,
      onSignOut,
      renderNavItems,
      showSidebarText,
      sidebarTextContainerWidth,
      sidebarTextOpacity,
      sidebarTextTranslateX,
      theme.colors.navItemText,
      theme.colors.textPrimary,
    ]
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
        <View style={styles.topBarLayer}>
          <TopBar />
        </View>
        <View style={styles.contentRow}>
          {renderSidebar(isCollapsed)}
          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderSidebar(isCollapsed)}
      <View style={styles.contentColumn}>
        <View style={styles.topBarLayer}>
          <TopBar />
        </View>
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const compactRailInnerWidth = theme.layout.compactSidebarWidth - 28;

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
    sidebar: {
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 14,
      paddingVertical: 20,
      borderRightWidth: 1,
      borderRightColor: theme.colors.navBorder,
      overflow: 'visible',
    },
    navList: {
      gap: 8,
      marginTop: -5,
      zIndex: 2,
      elevation: 2,
      overflow: 'visible',
    },
    sidebarToggleButton: {
      width: compactRailInnerWidth,
      alignSelf: 'flex-start',
      marginTop: -18,
      marginBottom: 18,
    },
    navItem: {
      borderRadius: 10,
      height: 44,
      paddingVertical: 0,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.navItemBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
      justifyContent: 'center',
    },
    navItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    navItemContentCompact: {
      justifyContent: 'center',
    },
    navItemIconSlot: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sidebarLabelContainer: {
      overflow: 'hidden',
      flexShrink: 1,
      marginLeft: 10,
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
      fontWeight: '700',
    },
    contentContainer: {
      flexGrow: 1,
      padding: 20,
    },
  });
}
