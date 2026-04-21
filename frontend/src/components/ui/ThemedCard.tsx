import { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

interface ThemedCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
}

export function ThemedCard({ children, style, onPress, disabled = false }: ThemedCardProps) {
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
      <Pressable disabled={disabled} onPress={onPress} style={[sharedStyle, disabled ? styles.disabled : null]}>
        {children}
      </Pressable>
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