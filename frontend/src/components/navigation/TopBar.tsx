import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'expo-router';
import { Modal, Platform, Pressable, PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { Menu as MenuIcon, MoreHorizontal as MoreIcon, X as CloseIcon } from 'lucide-react-native';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenTitleContext } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';

const ACTION_BUTTON_SIZE = 36;
const ACTION_BUTTON_GAP = 8;
const ACTION_SLOT_WIDTH = ACTION_BUTTON_SIZE + ACTION_BUTTON_GAP;
const TOPBAR_HORIZONTAL_PADDING = 32;
const LEADING_BUTTON_WIDTH = 54;
const TITLE_MIN_WIDTH = 120;
const ACTION_LIMIT_HARD_CAP = 5;

interface TopBarProps {
  onMenuPress?: () => void;
  sidebarOpen?: boolean;
}

export function TopBar({ onMenuPress, sidebarOpen }: TopBarProps) {
  const { title, actions } = useScreenTitleContext();
  const pathname = usePathname();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [barWidth, setBarWidth] = useState(0);
  const [overflowOpen, setOverflowOpen] = useState(false);

  const backActions = useMemo(() => actions.filter((action) => action.isBack === true), [actions]);
  const nonBackActions = useMemo(() => actions.filter((action) => action.isBack !== true), [actions]);
  const hasBackAction = backActions.length > 0;
  const mobilePinnedEditAction = useMemo(() => {
    if (Platform.OS === 'web') {
      return null;
    }

    return nonBackActions.find((action) => action.hidden !== true && isEditAction(action)) ?? null;
  }, [nonBackActions]);

  const mobileOverflowNonBackActions = useMemo(() => {
    if (!mobilePinnedEditAction) {
      return nonBackActions;
    }

    return nonBackActions.filter((action) => action.id !== mobilePinnedEditAction.id);
  }, [mobilePinnedEditAction, nonBackActions]);

  const directActionCount = useMemo(() => {
    if (actions.length === 0 || barWidth <= 0) {
      return actions.length;
    }

    const leadingWidth = onMenuPress ? LEADING_BUTTON_WIDTH : 0;
    const reservedWidth = TOPBAR_HORIZONTAL_PADDING + leadingWidth + TITLE_MIN_WIDTH;
    const availableWidth = Math.max(0, barWidth - reservedWidth);
    const slotCount = Math.max(0, Math.floor(availableWidth / ACTION_SLOT_WIDTH));

    if (slotCount === 0) {
      return 0;
    }

    if (actions.length <= slotCount) {
      return Math.min(actions.length, ACTION_LIMIT_HARD_CAP);
    }

    return Math.min(Math.max(0, slotCount - 1), ACTION_LIMIT_HARD_CAP);
  }, [actions.length, barWidth, onMenuPress]);

  const directNonBackCount = useMemo(() => {
    if (Platform.OS !== 'web') {
      return mobilePinnedEditAction ? 1 : 0;
    }

    if (directActionCount <= 0) {
      return 0;
    }

    if (!hasBackAction) {
      return Math.min(nonBackActions.length, directActionCount);
    }

    return Math.min(nonBackActions.length, Math.max(0, directActionCount - 1));
  }, [directActionCount, hasBackAction, mobilePinnedEditAction, nonBackActions.length]);

  const visibleActions = useMemo(() => {
    if (directActionCount <= 0) {
      return [];
    }

    const visibleNonBack = Platform.OS !== 'web'
      ? mobilePinnedEditAction
        ? [mobilePinnedEditAction]
        : []
      : nonBackActions.slice(0, directNonBackCount);

    if (!hasBackAction) {
      return visibleNonBack;
    }

    const rightPinnedBackAction = backActions[0];
    if (!rightPinnedBackAction) {
      return visibleNonBack;
    }

    if (Platform.OS !== 'web' && mobilePinnedEditAction) {
      return [rightPinnedBackAction, ...visibleNonBack];
    }

    return [...visibleNonBack, rightPinnedBackAction];
  }, [backActions, directActionCount, directNonBackCount, hasBackAction, mobilePinnedEditAction, nonBackActions]);

  const overflowActions = useMemo(() => {
    const overflowNonBack = Platform.OS !== 'web'
      ? mobileOverflowNonBackActions
      : nonBackActions.slice(directNonBackCount);

    if (!hasBackAction) {
      return overflowNonBack;
    }

    const remainingBackActions = backActions.slice(1);
    return [...overflowNonBack, ...remainingBackActions];
  }, [backActions, directNonBackCount, hasBackAction, mobileOverflowNonBackActions, nonBackActions]);

  useEffect(() => {
    setOverflowOpen(false);
  }, [directActionCount, title]);

  useEffect(() => {
    setOverflowOpen(false);
  }, [pathname]);

  const closeOverflow = () => setOverflowOpen(false);
  const isHovered = (state: PressableStateCallbackType) => {
    return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]} onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
      {onMenuPress ? (
        <TooltipPressable
          tooltip={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          style={styles.menuButton}
          onPress={onMenuPress}
        >
          {sidebarOpen
            ? <CloseIcon size={18} color={theme.colors.navTextStrong} />
            : <MenuIcon size={18} color={theme.colors.navTextStrong} />}
        </TooltipPressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {visibleActions.length > 0 ? (
        <View style={styles.actionsRow}>
          {visibleActions.map((action) => (
            <TooltipPressable
              key={action.id}
              tooltip={action.label ?? action.accessibilityLabel}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              disabled={action.disabled}
              onPress={action.onPress}
              style={(state) => [
                styles.actionButton,
                action.disabled ? styles.actionButtonDisabled : null,
                isHovered(state) && !action.disabled ? styles.actionButtonHover : null,
                state.pressed && !action.disabled ? styles.actionButtonPressed : null,
              ]}
            >
              {action.renderIcon({
                size: 18,
                color: action.disabled ? theme.colors.textMuted : theme.colors.navTextStrong,
              })}
            </TooltipPressable>
          ))}
        </View>
      ) : null}
      {overflowActions.length > 0 ? (
        <TooltipPressable
          tooltip="Show more actions"
          accessibilityRole="button"
          accessibilityLabel="More top bar actions"
          onPress={() => setOverflowOpen(true)}
          style={(state) => [
            styles.actionButton,
            isHovered(state) ? styles.actionButtonHover : null,
            state.pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <MoreIcon size={18} color={theme.colors.navTextStrong} />
        </TooltipPressable>
      ) : null}

      <Modal animationType="fade" transparent visible={overflowOpen} onRequestClose={closeOverflow}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeOverflow} />
          <View style={[styles.overflowMenu, { top: insets.top + 54 }]}>
            {overflowActions.map((action, index) => (
              <TooltipPressable
                key={action.id}
                tooltip={action.label ?? action.accessibilityLabel}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
                disabled={action.disabled}
                onPress={() => {
                  closeOverflow();
                  action.onPress();
                }}
                style={({ pressed }) => [
                  styles.overflowItem,
                  index < overflowActions.length - 1 ? styles.overflowItemBorder : null,
                  action.disabled ? styles.actionButtonDisabled : null,
                  pressed && !action.disabled ? styles.overflowItemPressed : null,
                ]}
              >
                <View style={styles.overflowItemIcon}>
                  {action.renderIcon({
                    size: 18,
                    color: action.disabled ? theme.colors.textMuted : theme.colors.navTextStrong,
                  })}
                </View>
                <Text style={[styles.overflowItemLabel, action.disabled ? styles.overflowItemLabelDisabled : null]}>
                  {action.label ?? action.accessibilityLabel}
                </Text>
              </TooltipPressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function isEditAction(action: { id: string; label?: string; accessibilityLabel: string }): boolean {
  const id = action.id.trim().toLowerCase();
  const label = (action.label ?? '').trim().toLowerCase();
  const accessibilityLabel = action.accessibilityLabel.trim().toLowerCase();
  const editWord = /\bedit\b/;

  return id === 'edit'
    || id.endsWith('-edit')
    || id.startsWith('edit-')
    || editWord.test(label)
    || editWord.test(accessibilityLabel);
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    bar: {
      position: 'relative',
      zIndex: 300,
      overflow: 'visible',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    menuButton: {
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ACTION_BUTTON_GAP,
    },
    actionButton: {
      width: ACTION_BUTTON_SIZE,
      height: ACTION_BUTTON_SIZE,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    actionButtonPressed: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    actionButtonHover: {
      backgroundColor: theme.colors.navItemHoverBackground,
    },
    actionButtonDisabled: {
      opacity: 0.55,
    },
    modalRoot: {
      flex: 1,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    overflowMenu: {
      position: 'absolute',
      right: 16,
      minWidth: 188,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    overflowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.colors.surfaceElevated,
    },
    overflowItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    overflowItemPressed: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    overflowItemIcon: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overflowItemLabel: {
      color: theme.colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    overflowItemLabelDisabled: {
      color: theme.colors.textMuted,
    },
  });
}
