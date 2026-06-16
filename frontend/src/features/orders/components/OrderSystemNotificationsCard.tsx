import { AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';

interface OrderSystemNotificationsCardProps {
  detectedProblems: Array<{ id: string; level: 'ok' | 'warn'; message: string }>;
  isStaff: boolean;
}

export function OrderSystemNotificationsCard({
  detectedProblems,
  isStaff,
}: OrderSystemNotificationsCardProps) {
  const styles = useThemedStyles(createStyles);

  if (!isStaff) return null;

  return (
    <ThemedCard style={styles.card} title="System Notifications">
      {detectedProblems.map((problem) => {
        const isWarn = problem.level === 'warn';
        const ProblemIcon = isWarn ? AlertTriangle : CheckCircle2;

        return (
          <View
            key={problem.id}
            style={[styles.problemRow, isWarn ? styles.problemRowWarn : styles.problemRowOk]}
          >
            <ProblemIcon
              size={16}
              color={isWarn ? styles.problemWarnText.color : styles.problemOkText.color}
            />
            <Text style={isWarn ? styles.problemWarnText : styles.problemOkText}>{problem.message}</Text>
          </View>
        );
      })}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 8 },
    problemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    problemRowWarn: {
      borderColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerSurface,
    },
    problemRowOk: {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    problemWarnText: {
      color: theme.colors.danger,
      flex: 1,
    },
    problemOkText: {
      color: theme.colors.textSecondary,
      flex: 1,
    },
  });
}
