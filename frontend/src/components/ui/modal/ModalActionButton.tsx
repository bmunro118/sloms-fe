import { useState } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { AppModalResolvedAction } from '@src/features/modal/types';
import { createStyles } from './modalStyles';

export function ModalActionButton({
  action,
  styles,
  onActionPress,
}: {
  action: AppModalResolvedAction;
  styles: ReturnType<typeof createStyles>;
  onActionPress?: (action: AppModalResolvedAction) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      disabled={action.disabled}
      onPress={() => onActionPress?.(action)}
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
