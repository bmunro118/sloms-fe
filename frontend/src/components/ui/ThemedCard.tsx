import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { ActionOverflowRow } from './ActionOverflowRow';
import { TooltipPressable } from './TooltipPressable';

interface ThemedCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  tooltip?: string;
  actions?: TopBarAction[];
}

export function ThemedCard({ children, style, onPress, disabled = false, tooltip, actions = [] }: ThemedCardProps) {
  const { colors, radii, spacing } = useAppTheme();
  const visibleActions = actions.filter((action) => action.hidden !== true);
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

  const content = (
    <>
      {visibleActions.length > 0 ? (
        <View style={[styles.actionRow, { marginBottom: spacing.sm }]}>
          <ActionOverflowRow actions={visibleActions} />
        </View>
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TooltipPressable
        tooltip={tooltip ?? 'Open card action'}
        disabled={disabled}
        onPress={onPress}
        style={[sharedStyle, disabled ? styles.disabled : null]}
      >
        {content}
      </TooltipPressable>
    );
  }

  return <View style={sharedStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
  actionRow: {
    alignItems: 'stretch',
  },
  disabled: {
    opacity: 0.7,
  },
});