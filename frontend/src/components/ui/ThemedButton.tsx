import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ThemedButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: ThemedButtonProps) {
  const { colors, radii } = useAppTheme();
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          borderRadius: radii.md,
          backgroundColor: isSecondary ? colors.buttonSecondaryBackground : colors.accent,
          borderColor: isSecondary ? colors.buttonSecondaryBorder : 'transparent',
          borderWidth: isSecondary ? 1 : 0,
        },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.text, { color: isSecondary ? colors.buttonSecondaryText : colors.accentText }, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});