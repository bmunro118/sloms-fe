import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  LucideIcon,
  OctagonAlert,
} from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { AppModalResolvedAction, AppModalResolvedRequest, AppModalType } from '@src/features/modal/types';

interface AppModalProps {
  visible: boolean;
  request: AppModalResolvedRequest | null;
  onClose: () => void;
  onActionPress: (action: AppModalResolvedAction) => void;
}

interface ModalPresentation {
  Icon: LucideIcon;
  accentColor: string;
  chipColor: string;
  chipLabel: string;
}

export function AppModal({ visible, request, onClose, onActionPress }: AppModalProps) {
  const theme = useAppTheme();

  const presentation = useMemo(() => {
    return createModalPresentation(request?.type ?? 'info', theme);
  }, [request?.type, theme]);

  const styles = useMemo(() => createStyles(theme, presentation), [presentation, theme]);

  if (!request) {
    return null;
  }

  const handleBackdropPress = () => {
    if (request.dismissible) {
      onClose();
    }
  };

  const handleRequestClose = () => {
    if (request.dismissible) {
      onClose();
    }
  };

  const { Icon } = presentation;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleRequestClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
        <View style={styles.panel}>
          <View style={styles.headerTop}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{presentation.chipLabel}</Text>
            </View>
            <View style={styles.iconWrap}>
              <Icon size={20} color={presentation.accentColor} />
            </View>
          </View>

          <Text style={styles.title}>{request.title}</Text>

          {request.message ? <Text style={styles.message}>{request.message}</Text> : null}

          <View style={styles.actionsRow}>
            {request.actions.map((action) => (
              <ModalActionButton
                key={action.id}
                action={action}
                styles={styles}
                onActionPress={onActionPress}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModalActionButton({
  action,
  styles,
  onActionPress,
}: {
  action: AppModalResolvedAction;
  styles: ReturnType<typeof createStyles>;
  onActionPress: (action: AppModalResolvedAction) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      disabled={action.disabled}
      onPress={() => onActionPress(action)}
      onHoverIn={Platform.OS === 'web' ? () => setIsHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setIsHovered(false) : undefined}
      style={({ pressed }) => [
        styles.actionButton,
        resolveActionVariantStyle(action.variant, styles, isHovered),
        action.disabled ? styles.actionDisabled : null,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Text style={[styles.actionText, resolveActionTextVariantStyle(action.variant, styles)]}>{action.label}</Text>
    </Pressable>
  );
}

function resolveActionVariantStyle(
  variant: AppModalResolvedAction['variant'],
  styles: ReturnType<typeof createStyles>,
  isHovered: boolean,
) {
  if (variant === 'secondary') {
    return isHovered && Platform.OS === 'web' ? styles.actionSecondaryHovered : styles.actionSecondary;
  }

  if (variant === 'danger') {
    return isHovered && Platform.OS === 'web' ? styles.actionDangerHovered : styles.actionDanger;
  }

  return isHovered && Platform.OS === 'web' ? styles.actionPrimaryHovered : styles.actionPrimary;
}

function resolveActionTextVariantStyle(
  variant: AppModalResolvedAction['variant'],
  styles: ReturnType<typeof createStyles>,
) {
  if (variant === 'secondary') {
    return styles.actionTextSecondary;
  }

  return styles.actionTextPrimary;
}

function createModalPresentation(type: AppModalType, theme: AppTheme): ModalPresentation {
  const successColor = theme.mode === 'dark' ? '#4ade80' : '#166534';
  const warningColor = theme.mode === 'dark' ? '#fbbf24' : '#b45309';

  switch (type) {
    case 'success':
      return {
        Icon: CheckCircle2,
        accentColor: successColor,
        chipColor: withAlpha(successColor, theme.isDark ? 0.22 : 0.16),
        chipLabel: 'Success',
      };
    case 'warning':
      return {
        Icon: AlertTriangle,
        accentColor: warningColor,
        chipColor: withAlpha(warningColor, theme.isDark ? 0.24 : 0.16),
        chipLabel: 'Warning',
      };
    case 'danger':
      return {
        Icon: OctagonAlert,
        accentColor: theme.colors.danger,
        chipColor: theme.colors.dangerSurface,
        chipLabel: 'Danger',
      };
    case 'confirm':
      return {
        Icon: CircleHelp,
        accentColor: theme.colors.accentMuted,
        chipColor: withAlpha(theme.colors.accentMuted, theme.isDark ? 0.24 : 0.14),
        chipLabel: 'Confirm',
      };
    case 'info':
    default:
      return {
        Icon: CircleAlert,
        accentColor: theme.colors.accent,
        chipColor: withAlpha(theme.colors.accent, theme.isDark ? 0.24 : 0.14),
        chipLabel: 'Info',
      };
  }
}

function withAlpha(hexColor: string, alpha: number): string {
  if (!hexColor.startsWith('#') || (hexColor.length !== 7 && hexColor.length !== 4)) {
    return hexColor;
  }

  const normalized = hexColor.length === 4
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
    : hexColor;
  const channel = Math.max(0, Math.min(255, Math.round(alpha * 255))).toString(16).padStart(2, '0');

  return `${normalized}${channel}`;
}

function createStyles(theme: AppTheme, presentation: ModalPresentation) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    panel: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 480,
      borderRadius: theme.radii.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    iconWrap: {
      flexShrink: 0,
    },
    headerContent: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    typeChip: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.sm,
      backgroundColor: presentation.chipColor,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      flexShrink: 0,
    },
    typeChipText: {
      color: presentation.accentColor,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    message: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    actionButton: {
      minWidth: 104,
      minHeight: 38,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    actionPrimaryHovered: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.accentMuted,
    },
    actionSecondary: {
      backgroundColor: theme.colors.buttonSecondaryBackground,
      borderColor: theme.colors.buttonSecondaryBorder,
    },
    actionSecondaryHovered: {
      backgroundColor: theme.colors.surfaceMuted,
      borderColor: theme.colors.borderStrong,
    },
    actionDanger: {
      backgroundColor: theme.colors.buttonDangerBackground,
      borderColor: theme.colors.buttonDangerBackground,
    },
    actionDangerHovered: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
    actionPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.97 }],
    },
    actionDisabled: {
      opacity: 0.65,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '700',
    },
    actionTextPrimary: {
      color: theme.colors.accentText,
    },
    actionTextSecondary: {
      color: theme.colors.buttonSecondaryText,
    },
  });
}
