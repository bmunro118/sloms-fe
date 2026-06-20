import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemedStyles } from '@theme/useThemedStyles';
import { AppTheme } from '@theme/types';
import { getStatusIcon, formatStatusLabel } from '@src/features/orders/tracking-types';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function OrderStatusBadge({ status, size = 'md', style }: OrderStatusBadgeProps) {
  const styles = useThemedStyles(createStyles);
  const StatusIcon = getStatusIcon(status);

  const containerStyle = [
    styles.badge,
    size === 'sm' ? styles.badgeSm : styles.badgeMd,
    status === 'Received' ? styles.received :
    status === 'InProduction' ? styles.inProgress :
    (status === 'Ready' || status === 'Dispatched') ? styles.complete :
    styles.fallback,
    style,
  ];

  const textStyle = [
    styles.text,
    status === 'Received' ? styles.textReceived :
    status === 'InProduction' ? styles.textInProgress :
    (status === 'Ready' || status === 'Dispatched') ? styles.textComplete :
    styles.textFallback,
  ];

  const iconColor =
    status === 'Received' ? styles.textReceived.color :
    status === 'InProduction' ? styles.textInProgress.color :
    (status === 'Ready' || status === 'Dispatched') ? styles.textComplete.color :
    styles.textFallback.color;

  return (
    <View style={containerStyle}>
      <StatusIcon size={14} color={iconColor} />
      <Text style={textStyle}>{formatStatusLabel(status)}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    badgeMd: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.radii.md,
    },
    badgeSm: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
    },
    // Container colour overrides
    fallback: {
      backgroundColor: theme.colors.accentMuted,
      borderColor: theme.colors.borderStrong,
    },
    received: {
      backgroundColor: theme.colors.statusReceived,
      borderColor: theme.colors.border,
    },
    inProgress: {
      backgroundColor: theme.colors.statusInProgress,
      borderColor: theme.colors.accent,
    },
    complete: {
      backgroundColor: theme.colors.statusComplete,
      borderColor: theme.colors.accent,
    },
    // Text styles
    text: {
      fontWeight: '700',
      fontSize: 12,
    },
    textFallback: {
      color: theme.colors.textPrimary,
    },
    textReceived: {
      color: theme.colors.statusReceivedText,
    },
    textInProgress: {
      color: theme.colors.statusInProgressText,
    },
    textComplete: {
      color: theme.colors.statusCompleteText,
    },
  });
}
