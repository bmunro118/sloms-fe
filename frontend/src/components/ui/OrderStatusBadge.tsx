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

  // In 'progress' context, colour is driven by step state, not status name
  const containerStyle = [
    styles.badge,
    size === 'sm' ? styles.badgeSm : styles.badgeMd,
    context === 'progress'
      ? (state === 'complete' ? styles.progressComplete :
         state === 'current'  ? styles.progressCurrent  :
         styles.upcoming)   // 'upcoming' and 'default' both render muted
      : (status === 'Received'    ? styles.received    :
         status === 'InProduction' ? styles.inProgress  :
         status === 'Ready'        ? styles.ready       :
         status === 'Dispatched'   ? styles.complete    :
         styles.fallback),
    // State overrides only apply in 'status' context (border highlights)
    context === 'status' && state === 'current'  ? styles.current  : null,
    context === 'status' && state === 'upcoming' ? styles.upcoming : null,
    style,
  ];

  const textStyle = [
    styles.text,
    context === 'progress'
      ? (state === 'complete' ? styles.textProgressComplete :
         state === 'current'  ? styles.textProgressCurrent  :
         styles.textUpcoming)
      : (status === 'Received'    ? styles.textReceived    :
         status === 'InProduction' ? styles.textInProgress  :
         status === 'Ready'        ? styles.textReady       :
         status === 'Dispatched'   ? styles.textComplete    :
         styles.textFallback),
    context === 'status' && state === 'upcoming' ? styles.textUpcoming : null,
  ];

  const iconColor =
    context === 'progress'
      ? (state === 'complete' ? styles.textProgressComplete.color :
         state === 'current'  ? styles.textProgressCurrent.color  :
         styles.textUpcoming.color)
      : (status === 'Received'    ? styles.textReceived.color    :
         status === 'InProduction' ? styles.textInProgress.color  :
         status === 'Ready'        ? styles.textReady.color       :
         status === 'Dispatched'   ? styles.textComplete.color    :
         styles.textFallback.color);

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
    // State overrides
    current: {
      borderColor: theme.colors.borderStrong,
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
