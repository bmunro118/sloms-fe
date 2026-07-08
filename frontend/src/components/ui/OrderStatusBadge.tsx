import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useThemedStyles } from '@theme/useThemedStyles';
import { AppTheme } from '@theme/types';
import { getStatusIcon, formatStatusLabel } from '@src/features/orders/tracking-types';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  state?: 'default' | 'current' | 'complete' | 'upcoming';
  context?: 'status' | 'progress';   // 'status' = semantic business colour (default); 'progress' = tracker state colour
  style?: ViewStyle;
}

export function OrderStatusBadge({ status, size = 'md', state = 'default', context = 'status', style }: OrderStatusBadgeProps) {
  const styles = useThemedStyles(createStyles);
  const StatusIcon = getStatusIcon(status);

  // In 'progress' context, colour is driven by step state, not status name.
  // In 'status' context, an explicit state ('complete' = green, 'current' = blue) overrides
  // the per-status semantic colours so the Order History timeline can simply show
  // completed steps in green and the active step in blue.
  const statusContainerStyle =
    state === 'complete'    ? styles.complete :
    state === 'current'     ? styles.statusCurrent :
    state === 'upcoming'    ? styles.upcoming :
    status === 'Received'    ? styles.received :
    status === 'InProduction' ? styles.inProgress :
    status === 'Ready'        ? styles.ready :
    status === 'Dispatched'   ? styles.complete :
    styles.fallback;

  const statusTextStyle =
    state === 'complete'    ? styles.textComplete :
    state === 'current'     ? styles.textStatusCurrent :
    state === 'upcoming'    ? styles.textUpcoming :
    status === 'Received'    ? styles.textReceived :
    status === 'InProduction' ? styles.textInProgress :
    status === 'Ready'        ? styles.textReady :
    status === 'Dispatched'   ? styles.textComplete :
    styles.textFallback;

  const containerStyle = [
    styles.badge,
    size === 'sm' ? styles.badgeSm : styles.badgeMd,
    context === 'progress'
      ? (state === 'complete' ? styles.progressComplete :
         state === 'current'  ? styles.progressCurrent  :
         styles.upcoming)
      : statusContainerStyle,
    style,
  ];

  const textStyle = [
    styles.text,
    context === 'progress'
      ? (state === 'complete' ? styles.textProgressComplete :
         state === 'current'  ? styles.textProgressCurrent  :
         styles.textUpcoming)
      : statusTextStyle,
  ];

  const iconColor = context === 'progress'
    ? (state === 'complete' ? styles.textProgressComplete.color :
       state === 'current'  ? styles.textProgressCurrent.color  :
       styles.textUpcoming.color)
    : statusTextStyle.color;

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
    statusCurrent: {
      backgroundColor: theme.colors.statusInProgress,
      borderColor: theme.colors.accent,
    },
    ready: {
      backgroundColor: theme.colors.statusReady,
      borderColor: theme.colors.accent,
    },
    // Progress-tracker context colour styles (state-driven)
    progressComplete: {
      backgroundColor: theme.colors.statusProgressComplete,
      borderColor: theme.colors.statusProgressCompleteText,
    },
    progressCurrent: {
      backgroundColor: theme.colors.statusProgressCurrent,
      borderColor: theme.colors.accent,
    },
    upcoming: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      opacity: 0.7,
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
    textStatusCurrent: {
      color: theme.colors.statusInProgressText,
    },
    textReady: {
      color: theme.colors.statusReadyText,
    },
    textUpcoming: {
      color: theme.colors.textMuted,
    },
    textProgressComplete: {
      color: theme.colors.statusProgressCompleteText,
    },
    textProgressCurrent: {
      color: theme.colors.statusProgressCurrentText,
    },
  });
}
