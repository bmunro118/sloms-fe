import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';

type ScreenContentProps = PropsWithChildren<{
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContent({ gap = 12, style, children }: ScreenContentProps) {
  const { layout } = useAppTheme();

  return <View style={[styles.base, { gap, maxWidth: layout.contentMaxWidth }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignSelf: 'center',
  },
});