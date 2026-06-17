import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { TooltipPressable } from './TooltipPressable';

interface ThemedButtonProps {
  /** Optional label text. Not rendered when variant="icon". */
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  /** 'primary' → solid, 'secondary' → outline (backward-compatible aliases). */
  variant?: 'primary' | 'secondary' | 'solid' | 'outline' | 'icon';
  /** Icon element. Required for icon variant; optional supplement for others. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  tooltip?: string;
  /** When true, removes the border regardless of variant. Useful for icon buttons inside inputs. */
  hideBorder?: boolean;
  /** When true and variant="icon", fills container without circular styling. Use for icon buttons inside inputs. */
  fillMode?: boolean;
}

/**
 * Centralised themed button component with four conceptual variants:
 * - `solid` / `primary` — accent fill, white text (modals, destructive confirmations)
 * - `outline` / `secondary` — bordered with muted background (form actions, cancel, edit)
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
}: ThemedButtonProps) {
  const { colors, radii } = useAppTheme();

  // Normalise backward-compatible aliases
  const resolvedVariant =
    variant === 'primary'
      ? 'solid'
      : variant === 'secondary'
        ? 'outline'
        : variant;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    resolvedVariant === 'solid' && {
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    resolvedVariant === 'outline' && {
      borderRadius: radii.md,
      backgroundColor: colors.buttonSecondaryBackground,
      borderColor: colors.buttonSecondaryBorder,
      borderWidth: 1,
    },
    resolvedVariant === 'icon' && {
      borderRadius: radii.xl,
      backgroundColor: colors.buttonIconBackground,
      borderColor: colors.buttonIconBorder,
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
      : colors.buttonSecondaryText;

  return (
    <TooltipPressable
      tooltip={tooltip ?? label ?? ''}
      onPress={onPress}
      disabled={disabled}
      style={containerStyle}
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
});
