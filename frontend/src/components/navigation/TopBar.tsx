import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu as MenuIcon, MoreHorizontal as MoreIcon, X as CloseIcon } from 'lucide-react-native';
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
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [barWidth, setBarWidth] = useState(0);
  const [overflowOpen, setOverflowOpen] = useState(false);

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

  const visibleActions = useMemo(() => actions.slice(0, directActionCount), [actions, directActionCount]);
  const overflowActions = useMemo(() => actions.slice(directActionCount), [actions, directActionCount]);

  useEffect(() => {
    setOverflowOpen(false);
  }, [directActionCount, title, actions]);

  const closeOverflow = () => setOverflowOpen(false);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]} onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}>
      {onMenuPress ? (
        <Pressable style={styles.menuButton} onPress={onMenuPress}>
          {sidebarOpen
            ? <CloseIcon size={18} color={theme.colors.navTextStrong} />
            : <MenuIcon size={18} color={theme.colors.navTextStrong} />}
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {visibleActions.length > 0 ? (
        <View style={styles.actionsRow}>
          {visibleActions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              disabled={action.disabled}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionButton,
                action.disabled ? styles.actionButtonDisabled : null,
                pressed && !action.disabled ? styles.actionButtonPressed : null,
              ]}
            >
              {action.renderIcon({
                size: 18,
                color: action.disabled ? theme.colors.textMuted : theme.colors.navTextStrong,
              })}
            </Pressable>
          ))}
        </View>
      ) : null}
      {overflowActions.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More top bar actions"
          onPress={() => setOverflowOpen(true)}
          style={({ pressed }) => [styles.actionButton, pressed ? styles.actionButtonPressed : null]}
        >
          <MoreIcon size={18} color={theme.colors.navTextStrong} />
        </Pressable>
      ) : null}

      <Modal animationType="fade" transparent visible={overflowOpen} onRequestClose={closeOverflow}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeOverflow} />
          <View style={[styles.overflowMenu, { top: insets.top + 54 }]}> 
            {overflowActions.map((action, index) => (
              <Pressable
                key={action.id}
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
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    bar: {
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
      shadowColor: '#000000',
      shadowOpacity: 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
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
