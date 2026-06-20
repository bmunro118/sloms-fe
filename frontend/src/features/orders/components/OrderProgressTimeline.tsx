import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useThemedStyles } from '@theme/useThemedStyles';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { createStyles } from '../tracking-styles';
import { getStatusIcon, type JourneyStep } from '../tracking-types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getStepChipStyle(status: string, styles: ReturnType<typeof createStyles>) {
  switch (status) {
    case 'Received':
      return styles.stepChipReceived;
    case 'InProduction':
      return styles.stepChipInProgress;
    case 'Ready':
    case 'Dispatched':
      return styles.stepChipComplete;
    default:
      return undefined;
  }
}

function getStepTextColor(status: string, theme: AppTheme): string | undefined {
  switch (status) {
    case 'Received':
      return theme.colors.statusReceivedText;
    case 'InProduction':
      return theme.colors.statusInProgressText;
    case 'Ready':
    case 'Dispatched':
      return theme.colors.statusCompleteText;
    default:
      return undefined;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface OrderProgressTimelineProps {
  steps: JourneyStep[];
}

export function OrderProgressTimeline({ steps }: OrderProgressTimelineProps) {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  const isMobile = useMemo(() => width < 768, [width]);

  if (isMobile) {
    return (
      <View style={styles.progressContainerVertical}>
        {steps.map((step, index) => {
          const StepIcon = getStatusIcon(step.status);
          const isCurrent = step.state === 'current';
          const isComplete = step.state === 'complete';
          const isUpcoming = step.state === 'upcoming';
          const chipStyle = getStepChipStyle(step.status, styles);
          const textColor = getStepTextColor(step.status, theme);
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const prevComplete = index > 0 && steps[index - 1].state === 'complete';

          return (
            <View key={step.id} style={styles.progressColumnItem}>
              {/* Chevron + dot connector (except first item): dot → CHEVRON ↓ → dot */}
              {!isFirst && (
                <ChevronDown
                  size={16}
                  strokeWidth={4}
                  color={
                    prevComplete
                      ? styles.connectorChevronActive.color
                      : styles.connectorChevronVertical.color
                  }
                />
              )}
              {!isFirst && (
                <View style={[styles.connectorDotVertical, prevComplete ? styles.connectorDotActive : null]} />
              )}

              {/* Step badge */}
              <View
                style={[
                  styles.stepBadge,
                  isComplete && chipStyle ? chipStyle : null,
                  isCurrent ? styles.stepBadgeCurrent : null,
                  isUpcoming ? styles.stepBadgeUpcoming : null,
                ]}
              >
                <StepIcon
                  size={14}
                  color={
                    isCurrent || isComplete
                      ? (textColor ?? styles.stepBadgeStateText.color)
                      : styles.stepBadgeUpcomingText.color
                  }
                />
                <Text
                  style={[
                    styles.stepBadgeText,
                    (isCurrent || isComplete) ? styles.stepBadgeStateText : null,
                    isComplete && textColor ? { color: textColor } : null,
                    isUpcoming ? styles.stepBadgeUpcomingText : null,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Bottom dot (except last item) */}
              {!isLast && (
                <View style={[styles.connectorDotVertical, isComplete ? styles.connectorDotActive : null]} />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // Desktop: horizontal centered dot-chevron-dot layout
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        {steps.map((step, index) => {
          const StepIcon = getStatusIcon(step.status);
          const isCurrent = step.state === 'current';
          const isComplete = step.state === 'complete';
          const isUpcoming = step.state === 'upcoming';
          const chipStyle = getStepChipStyle(step.status, styles);
          const textColor = getStepTextColor(step.status, theme);
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const prevComplete = index > 0 && steps[index - 1].state === 'complete';

          return (
            <View key={step.id} style={styles.progressItem}>
              {/* Chevron + dot connector (except first item): dot → CHEVRON → → dot */}
              {!isFirst && (
                <ChevronRight
                  size={16}
                  strokeWidth={4}
                  color={
                    prevComplete
                      ? styles.connectorChevronActive.color
                      : styles.connectorChevron.color
                  }
                />
              )}
              {!isFirst && (
                <View style={[styles.connectorDot, prevComplete ? styles.connectorDotActive : null]} />
              )}

              {/* Step badge */}
              <View
                style={[
                  styles.stepBadge,
                  isComplete && chipStyle ? chipStyle : null,
                  isCurrent ? styles.stepBadgeCurrent : null,
                  isUpcoming ? styles.stepBadgeUpcoming : null,
                ]}
              >
                <StepIcon
                  size={14}
                  color={
                    isCurrent || isComplete
                      ? (textColor ?? styles.stepBadgeStateText.color)
                      : styles.stepBadgeUpcomingText.color
                  }
                />
                <Text
                  style={[
                    styles.stepBadgeText,
                    (isCurrent || isComplete) ? styles.stepBadgeStateText : null,
                    isComplete && textColor ? { color: textColor } : null,
                    isUpcoming ? styles.stepBadgeUpcomingText : null,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Trailing dot (except last item) */}
              {!isLast && (
                <View style={[styles.connectorDot, isComplete ? styles.connectorDotActive : null]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
