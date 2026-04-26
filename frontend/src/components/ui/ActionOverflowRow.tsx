import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MoreHorizontal as MoreIcon } from 'lucide-react-native';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { TooltipPressable } from './TooltipPressable';

const ACTION_BUTTON_SIZE = 32;
const ACTION_BUTTON_GAP = 8;
const ACTION_SLOT_WIDTH = ACTION_BUTTON_SIZE + ACTION_BUTTON_GAP;
const ACTION_LIMIT_HARD_CAP = 5;
const OVERFLOW_MENU_WIDTH = 220;
const VIEWPORT_PADDING = 8;

type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ActionOverflowRowProps {
  actions: TopBarAction[];
}

export function ActionOverflowRow({ actions }: ActionOverflowRowProps) {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const rootRef = useRef<View>(null);

  const visibleActionSet = useMemo(() => actions.filter((action) => action.hidden !== true), [actions]);
  const mobilePinnedEditAction = useMemo(() => {
    if (Platform.OS === 'web') {
      return null;
    }

    return visibleActionSet.find((action) => isEditAction(action)) ?? null;
  }, [visibleActionSet]);

  const directActionCount = useMemo(() => {
    if (visibleActionSet.length === 0) {
      return 0;
    }

    if (Platform.OS !== 'web') {
      return mobilePinnedEditAction ? 1 : 0;
    }

    // Keep small action sets (common on card headers) fully visible.
    // Measuring from rendered width can otherwise get stuck in a compact
    // one-icon-plus-overflow state after a temporary mode change.
    if (visibleActionSet.length <= 3) {
      return visibleActionSet.length;
    }

    if (rowWidth <= 0) {
      return Math.min(visibleActionSet.length, ACTION_LIMIT_HARD_CAP);
    }

    const slotCount = Math.max(0, Math.floor((rowWidth + ACTION_BUTTON_GAP) / ACTION_SLOT_WIDTH));

    if (slotCount === 0) {
      return 0;
    }

    if (visibleActionSet.length <= slotCount) {
      return Math.min(visibleActionSet.length, ACTION_LIMIT_HARD_CAP);
    }

    return Math.min(Math.max(0, slotCount - 1), ACTION_LIMIT_HARD_CAP);
  }, [mobilePinnedEditAction, rowWidth, visibleActionSet.length]);

  const directActions = useMemo(() => {
    if (Platform.OS !== 'web') {
      return mobilePinnedEditAction ? [mobilePinnedEditAction] : [];
    }

    return visibleActionSet.slice(0, directActionCount);
  }, [directActionCount, mobilePinnedEditAction, visibleActionSet]);

  const overflowActions = useMemo(() => {
    if (Platform.OS !== 'web') {
      if (!mobilePinnedEditAction) {
        return visibleActionSet;
      }

      return visibleActionSet.filter((action) => action.id !== mobilePinnedEditAction.id);
    }

    return visibleActionSet.slice(directActionCount);
  }, [directActionCount, mobilePinnedEditAction, visibleActionSet]);

  const closeOverflow = () => setOverflowOpen(false);
  const isHovered = (state: PressableStateCallbackType) => {
    return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
  };

  const openOverflow = () => {
    const fallbackAnchor: MenuAnchor = {
      x: windowWidth - OVERFLOW_MENU_WIDTH - VIEWPORT_PADDING,
      y: VIEWPORT_PADDING,
      width: OVERFLOW_MENU_WIDTH,
      height: ACTION_BUTTON_SIZE,
    };

    if (!rootRef.current) {
      setMenuAnchor(fallbackAnchor);
      setOverflowOpen(true);
      return;
    }

    rootRef.current.measureInWindow((x, y, width, height) => {
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(width) && Number.isFinite(height)) {
        setMenuAnchor({ x, y, width, height });
      } else {
        setMenuAnchor(fallbackAnchor);
      }
      setOverflowOpen(true);
    });
  };

  const menuLeft = menuAnchor
    ? Math.min(
      Math.max(VIEWPORT_PADDING, menuAnchor.x + menuAnchor.width - OVERFLOW_MENU_WIDTH),
      Math.max(VIEWPORT_PADDING, windowWidth - OVERFLOW_MENU_WIDTH - VIEWPORT_PADDING),
    )
    : Math.max(VIEWPORT_PADDING, windowWidth - OVERFLOW_MENU_WIDTH - VIEWPORT_PADDING);

  const desiredTop = menuAnchor ? menuAnchor.y + menuAnchor.height + 6 : VIEWPORT_PADDING;
  const menuTop = Math.min(desiredTop, Math.max(VIEWPORT_PADDING, windowHeight - 220));

  if (visibleActionSet.length === 0) {
    return null;
  }

  return (
    <View ref={rootRef} style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
      {directActions.map((action) => (
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
            size: 16,
            color: action.disabled ? theme.colors.textMuted : theme.colors.navTextStrong,
          })}
        </TooltipPressable>
      ))}

      {overflowActions.length > 0 ? (
        <TooltipPressable
          tooltip="Show more actions"
          accessibilityRole="button"
          accessibilityLabel="More card actions"
          onPress={openOverflow}
          style={(state) => [
            styles.actionButton,
            isHovered(state) ? styles.actionButtonHover : null,
            state.pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <MoreIcon size={16} color={theme.colors.navTextStrong} />
        </TooltipPressable>
      ) : null}

      <Modal animationType="fade" transparent visible={overflowOpen} onRequestClose={closeOverflow}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={closeOverflow} />
          <View style={[styles.overflowMenu, { left: menuLeft, top: menuTop, width: OVERFLOW_MENU_WIDTH }]}>
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
                    size: 16,
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: ACTION_BUTTON_GAP,
      minHeight: ACTION_BUTTON_SIZE,
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
