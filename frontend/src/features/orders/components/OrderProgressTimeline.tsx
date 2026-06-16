import { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useThemedStyles } from '@theme/useThemedStyles';
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

function getStepTextColor(status: string, styles: ReturnType<typeof createStyles>) {
  switch (status) {
    case 'Received':
      return styles.badgeTextReceived.color;
    case 'InProduction':
      return styles.badgeTextInProgress.color;
    case 'Ready':
    case 'Dispatched':
      return styles.badgeTextComplete.color;
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

  const isMobile = useMemo(() => width < 768, [width]);

  if (isMobile) {
    return (
      <View style={styles.verticalTimeline}>
        {/* Vertical connector line spanning all nodes */}
        <View style={styles.timelineConnector} />
        {steps.map((step, index) => {
          const StepIcon = getStatusIcon(step.status);
          const isCurrent = step.state === 'current';
          const isComplete = step.state === 'complete';
          const isLast = index === steps.length - 1;

          return (
            <View
              key={step.id}
              style={[styles.timelineRow, isLast ? styles.timelineRowLast : null]}
            >
              <View
                style={[
                  styles.timelineNode,
                  isComplete ? styles.timelineNodeComplete : null,
                  isCurrent ? styles.timelineNodeCurrent : null,
                ]}
              >
                <StepIcon
                  size={12}
                  color={
                    isCurrent || isComplete
                      ? styles.stepChipStateText.color
                      : styles.stepChipText.color
                  }
                />
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  step.state === 'upcoming' ? styles.timelineLabelMuted : null,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  // Desktop: horizontal step rail
  return (
    <View style={styles.stepRail}>
      {steps.map((step) => {
        const StepIcon = getStatusIcon(step.status);
        const isCurrent = step.state === 'current';
        const isComplete = step.state === 'complete';
        const chipStyle = getStepChipStyle(step.status, styles);
        const textColor = getStepTextColor(step.status, styles);

        return (
          <View
            key={step.id}
            style={[
              styles.stepChip,
              isComplete && chipStyle ? chipStyle : null,
              isCurrent ? styles.stepChipCurrent : null,
            ]}
          >
            <StepIcon
              size={14}
              color={
                isCurrent || isComplete
                  ? (textColor ?? styles.stepChipStateText.color)
                  : styles.stepChipText.color
              }
            />
            <Text
              style={[
                styles.stepChipText,
                (isCurrent || isComplete) ? styles.stepChipStateText : null,
                isComplete && textColor ? { color: textColor } : null,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
