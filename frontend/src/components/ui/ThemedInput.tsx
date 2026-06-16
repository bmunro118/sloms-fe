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

    if (!rightAccessory) {
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
    }

    return (
      <View
        style={[
          styles.wrapper,
          {
            borderColor: colors.border,
            borderRadius: radii.md,
            backgroundColor: colors.inputBackground,
          },
          style,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.baseInner,
            {
              color: colors.textPrimary,
              paddingHorizontal: spacing.md,
            },
          ]}
          {...props}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View
          style={[
            styles.accessory,
            { backgroundColor: colors.buttonSecondaryBackground },
          ]}
        >
          {rightAccessory}
        </View>
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
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    overflow: 'hidden',
  },
  baseInner: {
    flex: 1,
    paddingVertical: 10,
  },
  divider: {
    width: 1,
  },
  accessory: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
