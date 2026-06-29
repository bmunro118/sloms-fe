import { ReactNode, useState } from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { TooltipPressable } from './TooltipPressable';

interface ThemedButtonProps {
  /** Optional label text. Not rendered when variant="icon". */
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  /** 'primary' → solid, 'secondary' → outline (backward-compatible aliases). */
  variant?: 'primary' | 'secondary' | 'solid' | 'outline' | 'icon' | 'danger';
  /** Icon element. Required for icon variant; optional supplement for others. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  tooltip?: string;
  /** When true, removes the border regardless of variant. Useful for icon buttons inside inputs. */
  hideBorder?: boolean;
  /** When true and variant="icon", fills container without circular styling. Use for icon buttons inside inputs. */
  fillMode?: boolean;
  /** Forwarded to the underlying pressable for test/automation selectors. */
  testID?: string;
}

/**
 * Centralised themed button component with five conceptual variants:
 * - `solid` / `primary` — accent fill, white text (primary actions)
 * - `outline` / `secondary` — bordered with muted background (secondary actions, cancel, edit)
 * - `danger` — filled red, white text (destructive in-page actions)
 * - `icon` — 44×44px circular icon-only button (row-level actions, search in input)
 */
export function ThemedButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
  tooltip,
  hideBorder = false,
  fillMode = false,
  testID,
}: ThemedButtonProps) {
  const { colors, radii } = useAppTheme();
  const [isHovered, setIsHovered] = useState(false);

  // Normalise backward-compatible aliases
  const resolvedVariant =
    variant === 'primary'
      ? 'solid'
      : variant === 'secondary'
        ? 'outline'
        : variant;

  const baseContainerStyle: StyleProp<ViewStyle> = [
    styles.base,
    resolvedVariant === 'solid' && {
      borderRadius: radii.md,
      backgroundColor: isHovered && Platform.OS === 'web' ? colors.accentMuted : colors.accent,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    resolvedVariant === 'outline' && {
      borderRadius: radii.md,
      backgroundColor: isHovered && Platform.OS === 'web'
        ? colors.surfaceMuted
        : colors.buttonSecondaryBackground,
      borderColor: isHovered && Platform.OS === 'web'
        ? colors.borderStrong
        : colors.buttonSecondaryBorder,
      borderWidth: 1,
    },
    resolvedVariant === 'danger' && {
      borderRadius: radii.md,
      backgroundColor: isHovered && Platform.OS === 'web'
        ? colors.danger
        : colors.buttonDangerBackground,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    resolvedVariant === 'icon' && {
      borderRadius: radii.xl,
      backgroundColor: isHovered && Platform.OS === 'web'
        ? colors.surfaceMuted
        : colors.buttonIconBackground,
      borderColor: isHovered && Platform.OS === 'web'
        ? colors.borderStrong
        : colors.buttonIconBorder,
      borderWidth: 1,
      width: 44,
      height: 44,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    resolvedVariant === 'icon' && fillMode && {
      borderRadius: 0,
      backgroundColor: 'transparent',
      width: undefined,
      height: undefined,
      flex: 1,
    },
    disabled ? styles.disabled : null,
    hideBorder && { borderWidth: 0, borderColor: 'transparent' },
    style,
  ];

  const textColor =
    resolvedVariant === 'solid'
      ? colors.accentText
      : resolvedVariant === 'danger'
        ? colors.buttonDangerText
        : colors.buttonSecondaryText;

  return (
    <TooltipPressable
      tooltip={tooltip ?? label ?? ''}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={({ pressed }: { pressed: boolean }) => [
        baseContainerStyle,
        !disabled && pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <View style={resolvedVariant !== 'icon' ? styles.iconGap : undefined}>
          {icon}
        </View>
      ) : null}
      {label && resolvedVariant !== 'icon' ? (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {label}
        </Text>
      ) : null}
    </TooltipPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontWeight: '700',
    fontSize: 15,
  },
  iconGap: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
