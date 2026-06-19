import { Modal, Pressable, PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { ArrowBigLeft as BackSlotIcon, Menu as MenuIcon, MoreHorizontal as MoreIcon, Pencil as EditSlotIcon, Save as SaveSlotIcon, X as CloseIcon } from 'lucide-react-native';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { TopBarAction } from '@context/ScreenTitleContext';
import { tokens } from '@src/theme/tokens';
import { AppTheme } from '@theme/types';

const SLOT_ICONS = [BackSlotIcon, EditSlotIcon, SaveSlotIcon];
const SLOT_IDS = ['back-slot', 'edit-slot', 'save-slot'] as const;
const SLOT_LABELS = ['Back', 'Edit', 'Save'] as const;

interface TopBarWideLayoutProps {
  title: string;
  wideBackAction: TopBarAction | null;
  wideEditAction: TopBarAction | null;
  wideSaveAction: TopBarAction | null;
  wideOverflowActions: TopBarAction[];
  wideHasOverflow: boolean;
  overflowOpen: boolean;
  onOpenOverflow: () => void;
  onCloseOverflow: () => void;
  onMoreButtonLayout: (x: number) => void;
  wideMoreButtonX: number;
  onMenuPress?: () => void;
  sidebarOpen?: boolean;
  onBarLayout: (width: number) => void;
  paddingTop: number;
  overflowTop: number;
  styles: ReturnType<typeof createWideStyles>;
  theme: AppTheme;
}

const isHovered = (state: PressableStateCallbackType) =>
  (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;

export function TopBarWideLayout({
  title,
  wideBackAction,
  wideEditAction,
  wideSaveAction,
  wideOverflowActions,
  wideHasOverflow,
  overflowOpen,
  onOpenOverflow,
  onCloseOverflow,
  onMoreButtonLayout,
  wideMoreButtonX,
  onMenuPress,
  sidebarOpen,
  onBarLayout,
  paddingTop,
  overflowTop,
  styles,
  theme,
}: TopBarWideLayoutProps) {
  const primarySlots = [wideBackAction, wideEditAction, wideSaveAction];

  return (
    <View
      style={[styles.wideBar, { paddingTop }]}
      onLayout={(e) => onBarLayout(e.nativeEvent.layout.width)}
    >
      <Text style={styles.wideTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.wideActionsRow}>
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

        {primarySlots.map((action, slotIndex) => {
          const SlotIcon = SLOT_ICONS[slotIndex];
          const isDisabled = action === null || action.disabled === true;
          return (
            <TooltipPressable
              key={SLOT_IDS[slotIndex]}
              tooltip={action?.label ?? action?.accessibilityLabel ?? SLOT_LABELS[slotIndex]}
              accessibilityRole="button"
              accessibilityLabel={action?.accessibilityLabel ?? SLOT_LABELS[slotIndex]}
              disabled={isDisabled}
              onPress={isDisabled ? () => {} : action!.onPress}
              style={(state) => [
                styles.actionButton,
                isDisabled ? styles.actionButtonDisabled : null,
                isHovered(state) && !isDisabled ? styles.actionButtonHover : null,
                state.pressed && !isDisabled ? styles.actionButtonPressed : null,
              ]}
            >
              {action
                ? action.renderIcon({ size: 18, color: isDisabled ? theme.colors.textMuted : theme.colors.navTextStrong })
                : <SlotIcon size={18} color={theme.colors.textMuted} />}
            </TooltipPressable>
          );
        })}

        <TooltipPressable
          tooltip={wideHasOverflow ? 'Show more actions' : 'No additional actions'}
          accessibilityRole="button"
          accessibilityLabel="More top bar actions"
          disabled={!wideHasOverflow}
          onPress={wideHasOverflow ? onOpenOverflow : () => {}}
          onLayout={(e) => onMoreButtonLayout(e.nativeEvent.layout.x)}
          style={(state) => [
            styles.actionButton,
            !wideHasOverflow ? styles.actionButtonDisabled : null,
            isHovered(state) && wideHasOverflow ? styles.actionButtonHover : null,
            state.pressed && wideHasOverflow ? styles.actionButtonPressed : null,
          ]}
        >
          <MoreIcon size={18} color={wideHasOverflow ? theme.colors.navTextStrong : theme.colors.textMuted} />
        </TooltipPressable>
      </View>

      <Modal animationType="fade" transparent visible={overflowOpen} onRequestClose={onCloseOverflow}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={onCloseOverflow} />
          <View style={[styles.overflowMenu, { top: overflowTop, left: wideMoreButtonX + 16 }]}>
            {wideOverflowActions.map((action, index) => (
              <TooltipPressable
                key={action.id}
                tooltip={action.label ?? action.accessibilityLabel}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
                disabled={action.disabled}
                onPress={() => { onCloseOverflow(); action.onPress(); }}
                style={({ pressed }) => [
                  styles.overflowItem,
                  index < wideOverflowActions.length - 1 ? styles.overflowItemBorder : null,
                  action.disabled ? styles.actionButtonDisabled : null,
                  pressed && !action.disabled ? styles.overflowItemPressed : null,
                ]}
              >
                <View style={styles.overflowItemIcon}>
                  {action.renderIcon({ size: 18, color: action.disabled ? theme.colors.textMuted : theme.colors.navTextStrong })}
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

export function createWideStyles(theme: AppTheme) {
  const ACTION_BUTTON_SIZE = 36;
  const ACTION_BUTTON_GAP = 8;

  return StyleSheet.create({
    wideBar: {
      position: 'relative',
      zIndex: tokens.zIndex.topBarSurface,
      overflow: 'visible',
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    wideTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textMuted,
      marginBottom: 6,
      paddingTop: 2,
    },
    wideActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ACTION_BUTTON_GAP,
      justifyContent: 'flex-start',
    },
    menuButton: {
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
      paddingHorizontal: 12,
      paddingVertical: 8,
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
    actionButtonDisabled: { opacity: 0.55 },
    actionButtonHover: { backgroundColor: theme.colors.navItemHoverBackground },
    actionButtonPressed: { backgroundColor: theme.colors.navItemHoverBackground },
    modalRoot: { flex: 1 },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    overflowMenu: {
      position: 'absolute',
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
    overflowItemPressed: { backgroundColor: theme.colors.surfaceMuted },
    overflowItemIcon: { width: 20, alignItems: 'center', justifyContent: 'center' },
    overflowItemLabel: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' },
    overflowItemLabelDisabled: { color: theme.colors.textMuted },
  });
}
