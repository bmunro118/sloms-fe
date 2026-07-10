import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { CustomerDetails } from '../types';

type Props = {
  customer: CustomerDetails;
  canOnboard?: boolean;
  onSuspend?: () => void;
  onReinstate?: () => void;
  onOnboard?: () => void;
};

export function CustomerActionsCard({
  customer,
  canOnboard,
  onSuspend,
  onReinstate,
  onOnboard,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View
          style={[
            styles.statusBadge,
            {
              borderColor: customer.isSuspended ? theme.colors.danger : theme.colors.accent,
              backgroundColor: customer.isSuspended ? theme.colors.dangerSurface : theme.colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: customer.isSuspended ? theme.colors.danger : theme.colors.accent },
            ]}
          >
            {customer.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
          </Text>
        </View>
      </View>
      <View style={styles.actionsStack}>
        {canOnboard && !customer.isSuspended ? (
          <View style={styles.actionButton}>
            <ThemedButton
              label="Onboard to Portal"
              onPress={onOnboard ?? (() => {})}
            />
          </View>
        ) : null}
        {customer.isSuspended ? (
          <View style={styles.actionButton}>
            <ThemedButton
              label="Reinstate Customer"
              onPress={onReinstate ?? (() => {})}
            />
          </View>
        ) : (
          <View style={styles.actionButton}>
            <ThemedButton
              label="Suspend Customer"
              onPress={onSuspend ?? (() => {})}
              variant="danger"
            />
          </View>
        )}
      </View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: common.card,
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusBadgeText: { fontSize: 12, fontWeight: '600' },
    actionsStack: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    actionButton: { flexShrink: 1 },
  });
}
