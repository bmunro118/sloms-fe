import { PropsWithChildren, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { ActionOverflowRow } from './ActionOverflowRow';
import { TooltipPressable } from './TooltipPressable';
import { tokens } from '@src/theme/tokens';

interface ThemedCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  tooltip?: string;
  title?: string;
  titleNode?: PropsWithChildren['children'];
  actions?: TopBarAction[];
}

export function ThemedCard({
  children,
  style,
  onPress,
  disabled = false,
  tooltip,
  title,
  titleNode,
  actions = [],
}: ThemedCardProps) {
  const { colors, radii, spacing } = useAppTheme();
  const visibleActions = actions.filter((action) => action.hidden !== true);
  const hasTitle = Boolean(titleNode) || Boolean(title);
  const showHeaderRow = hasTitle || visibleActions.length > 0;
  const hasFloatingActionRow = !hasTitle && visibleActions.length > 0;
  const headerBottomSpacing = hasTitle ? spacing.xs : 0;
  const [actionRowWidth, setActionRowWidth] = useState(0);
  const titleRightInset = hasTitle && visibleActions.length > 0 ? actionRowWidth + spacing.xs : 0;

  const handleActionRowLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);
    setActionRowWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  };
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
      {showHeaderRow && !hasFloatingActionRow ? (
        <View
          style={[
            styles.headerRow,
            {
              marginBottom: headerBottomSpacing,
              minHeight: !hasTitle && visibleActions.length > 0 ? 32 : undefined,
            },
          ]}
        >
          <View style={[styles.titleContainer, { paddingRight: titleRightInset }]}>
            {titleNode ?? (title ? <Text style={[styles.titleText, { color: colors.textPrimary }]}>{title}</Text> : null)}
          </View>
          {visibleActions.length > 0 ? (
            <View style={styles.actionRow} onLayout={handleActionRowLayout}>
              <ActionOverflowRow actions={visibleActions} />
            </View>
          ) : null}
        </View>
      ) : null}

      {hasFloatingActionRow ? (
        <View style={[styles.floatingActionRow, { top: spacing.md, right: spacing.md }]}>
          <ActionOverflowRow actions={visibleActions} />
        </View>
      ) : null}

      {children}
    </>
  );

  if (onPress) {
    return (
      <TooltipPressable
        tooltip={tooltip}
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
  headerRow: {
    position: 'relative',
  },
  titleContainer: {
    minWidth: 0,
  },
  titleText: {
    fontWeight: '700',
  },
  actionRow: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  floatingActionRow: {
    position: 'absolute',
    zIndex: tokens.zIndex.floatingAction,
  },
  disabled: {
    opacity: 0.7,
  },
});