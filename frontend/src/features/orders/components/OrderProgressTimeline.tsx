import { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderStatusBadge } from '@components/ui/OrderStatusBadge';
import { createStyles } from '../tracking-styles';
import type { JourneyStep } from '../tracking-types';

// ── Component ──────────────────────────────────────────────────────────────────

interface OrderProgressTimelineProps {
  steps: JourneyStep[];
}

export function OrderProgressTimeline({ steps }: OrderProgressTimelineProps) {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);

  const isMobile = useMemo(() => width < 768, [width]);

  if (isMobile) {
    return (
      <View style={styles.progressContainerVertical}>
        {steps.map((step, index) => {
          const isComplete = step.state === 'complete';
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const prevComplete = index > 0 && steps[index - 1].state === 'complete';
          const state = step.state === 'current' ? 'current' : step.state === 'upcoming' ? 'upcoming' : 'complete';

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
              <OrderStatusBadge status={step.status} state={state as 'current' | 'complete' | 'upcoming'} size="md" context="progress" />

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
          const isComplete = step.state === 'complete';
          const isFirst = index === 0;
          const isLast = index === steps.length - 1;
          const prevComplete = index > 0 && steps[index - 1].state === 'complete';
          const state = step.state === 'current' ? 'current' : step.state === 'upcoming' ? 'upcoming' : 'complete';

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
              <OrderStatusBadge status={step.status} state={state as 'current' | 'complete' | 'upcoming'} size="md" context="progress" />

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
