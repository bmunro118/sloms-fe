import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

type ThemedInputProps = TextInputProps;

export const ThemedInput = forwardRef<TextInput, ThemedInputProps>(function ThemedInput({ style, ...props }, ref) {
  const { colors, radii, spacing } = useAppTheme();

  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.inputPlaceholder}
      style={[
        styles.base,
        {
          borderColor: colors.border,
          borderRadius: radii.md,
          backgroundColor: colors.inputBackground,
          color: colors.textPrimary,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingVertical: 10,
  },
});