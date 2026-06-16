import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { AppTheme } from '@theme/types';

interface LoadingSpinnerProps {
  /** Optional message displayed below the spinner. */
  message?: string;
  /** Spinner size variant. Defaults to 'medium'. */
  size?: 'small' | 'medium' | 'large';
  /** When true, the spinner and message are centered to fill available space. */
  fullScreen?: boolean;
  /** Optional additional styles applied to the container. */
  style?: StyleProp<ViewStyle>;
}

const INDICATOR_SIZE: Record<NonNullable<LoadingSpinnerProps['size']>, number | 'small' | 'large'> = {
  small: 'small',
  medium: 'large',
  large: 48,
};

export function LoadingSpinner({
  message,
  size = 'medium',
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.container,
        fullScreen ? styles.fullScreen : null,
        style,
      ]}
    >
      <ActivityIndicator
        size={INDICATOR_SIZE[size]}
        color={theme.colors.accent}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return {
    container: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    fullScreen: {
      flex: 1,
      minHeight: 200,
    },
    message: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center' as const,
    },
  };
}
