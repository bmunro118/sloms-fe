import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { TooltipPressable } from './TooltipPressable';

interface ThemedCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export function ThemedCard({ children, style, onPress, disabled = false, tooltip }: ThemedCardProps) {
  const { colors, radii, spacing } = useAppTheme();
  const sharedStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      borderRadius: radii.lg,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    style,
  ];

  if (onPress) {
    return (
      <TooltipPressable
        tooltip={tooltip ?? 'Open card action'}
        disabled={disabled}
        onPress={onPress}
        style={[sharedStyle, disabled ? styles.disabled : null]}
      >
        {children}
      </TooltipPressable>
    );
  }

  return <View style={sharedStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.7,
  },
});