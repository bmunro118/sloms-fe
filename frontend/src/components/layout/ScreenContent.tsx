import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type ScreenContentProps = PropsWithChildren<{
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenContent({ gap = 12, style, children }: ScreenContentProps) {
  return <View style={[styles.base, { gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
  },
});