import { forwardRef, ReactNode } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

type ThemedInputProps = TextInputProps & {
  /** Optional accessory rendered inside the right edge of the input border. */
  rightAccessory?: ReactNode;
};

export const ThemedInput = forwardRef<TextInput, ThemedInputProps>(
  function ThemedInput({ style, rightAccessory, ...props }, ref) {
    const { colors, radii, spacing } = useAppTheme();

    const inputElement = (
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
            // Prevent text from sliding under the accessory icon.
            paddingRight: rightAccessory ? 44 : spacing.md,
          },
          style,
        ]}
        {...props}
      />
    );

    if (!rightAccessory) {
      return inputElement;
    }

    return (
      <View style={styles.wrapper}>
        {inputElement}
        <View style={styles.accessory}>{rightAccessory}</View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    paddingVertical: 10,
  },
  wrapper: {
    position: 'relative',
  },
  accessory: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
  },
});
