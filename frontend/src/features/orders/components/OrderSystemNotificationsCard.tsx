import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CollapsibleCard } from '@components/ui/CollapsibleCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { tokens } from '@theme/tokens';

interface OrderSystemNotificationsCardProps {
  detectedProblems: Array<{ id: string; level: 'ok' | 'warn'; message: string }>;
  isStaff: boolean;
}

export function OrderSystemNotificationsCard({
  detectedProblems,
  isStaff,
}: OrderSystemNotificationsCardProps) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  const warnings = detectedProblems?.filter((p) => p.level === 'warn') ?? [];
  const oks = detectedProblems?.filter((p) => p.level === 'ok') ?? [];
  const hasWarnings = warnings.length > 0;

  const [expanded, setExpanded] = useState(hasWarnings);

  if (!isStaff) return null;
  if (!detectedProblems || detectedProblems.length === 0) return null;

  return (
    <CollapsibleCard
      title="System Notifications"
      expanded={expanded}
      onToggleExpanded={() => setExpanded((prev) => !prev)}
      tooltip={expanded ? 'Collapse notifications' : 'Expand notifications'}
      style={styles.card}
    >
      <View style={styles.content}>
      {/* Summary Row */}
      <View style={styles.summaryRow}>
        {hasWarnings ? (
          <>
            <AlertCircle size={20} color={theme.colors.danger} />
            <Text style={[styles.summaryText, styles.summaryTextWarning]}>
              {warnings.length} issue{warnings.length !== 1 ? 's' : ''} detected
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{warnings.length}</Text>
            </View>
          </>
        ) : (
          <>
            <CheckCircle2 size={20} color={theme.colors.statusCompleteText} />
            <Text style={styles.summaryText}>All checks passed</Text>
          </>
        )}
      </View>

      {/* Notification List */}
      <View style={styles.list}>
        {warnings.map((problem) => (
          <View key={problem.id} style={[styles.notificationItem, styles.notificationItemWarn]}>
            <AlertCircle size={16} color={theme.colors.danger} />
            <Text style={[styles.notificationText, styles.notificationTextWarn]}>
              {problem.message}
            </Text>
          </View>
        ))}
        {!hasWarnings &&
          oks.map((problem) => (
            <View key={problem.id} style={[styles.notificationItem, styles.notificationItemOk]}>
              <CheckCircle2 size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.notificationText, styles.notificationTextOk]}>
                {problem.message}
              </Text>
            </View>
          ))}
      </View>
      </View>
    </CollapsibleCard>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: { marginBottom: 0 },
    content: { gap: tokens.spacing.md },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.sm,
    },
    summaryText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    summaryTextWarning: {
      color: theme.colors.danger,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: tokens.radii.sm,
      backgroundColor: theme.colors.dangerSurface,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.danger,
    },
    list: {
      gap: 6,
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: tokens.spacing.sm,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderLeftWidth: 3,
      borderRadius: tokens.radii.sm,
    },
    notificationItemWarn: {
      borderLeftColor: theme.colors.danger,
      backgroundColor: theme.colors.surface,
    },
    notificationItemOk: {
      borderLeftColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
    },
    notificationText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    notificationTextWarn: {
      color: theme.colors.textPrimary,
    },
    notificationTextOk: {
      color: theme.colors.textSecondary,
    },
  });
}
