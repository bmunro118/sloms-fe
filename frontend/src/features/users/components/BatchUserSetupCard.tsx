import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CollapsibleCard } from '@components/ui/CollapsibleCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { LinkedCustomerField } from '@src/features/users/components/LinkedCustomerField';
import { BatchUserDefaults, UserRole } from '@src/features/users/types';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'];

type Props = {
  expanded: boolean;
  onToggleExpanded: () => void;
  count: number;
  onCountChange: (n: number) => void;
  defaults: BatchUserDefaults;
  onDefaultsChange: (updater: (prev: BatchUserDefaults) => BatchUserDefaults) => void;
  onGenerate: () => void;
  onSetSelected: () => void;
  onSetAll: () => void;
  selectedCount: number;
  totalCards: number;
};

export function BatchUserSetupCard({
  expanded,
  onToggleExpanded,
  count,
  onCountChange,
  defaults,
  onDefaultsChange,
  onGenerate,
  onSetSelected,
  onSetAll,
  selectedCount,
  totalCards: _totalCards,
}: Props) {
  const styles = useThemedStyles(createStyles);

  const countString = count.toString();
  const countError = count < 1 || count > 20 || !Number.isInteger(count)
    ? 'Enter a number between 1 and 20.'
    : null;

  const handleCountChange = useCallback((text: string) => {
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      onCountChange(parsed);
    } else if (text === '') {
      onCountChange(0);
    }
  }, [onCountChange]);

  return (
    <CollapsibleCard
      title="Batch User Setup"
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
      tooltip={expanded ? 'Collapse batch setup' : 'Expand batch setup'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Default Role */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Default Role</Text>
            <View style={styles.roleRow}>
              {ASSIGNABLE_ROLES.map((role) => (
                <ThemedButton
                  key={role}
                  label={role}
                  onPress={() =>
                    onDefaultsChange((prev) => ({
                      ...prev,
                      role,
                      linkedCustomerId: role === 'Customer' ? prev.linkedCustomerId : null,
                    }))
                  }
                  variant={defaults.role === role ? 'primary' : 'secondary'}
                  style={styles.roleButton}
                  tooltip={`Select role: ${role}`}
                />
              ))}
            </View>
          </View>

          {/* 2. Linked Customer Account (Customer role only) */}
          {defaults.role === 'Customer' ? (
            <LinkedCustomerField
              isEditing
              linkedCustomerId={defaults.linkedCustomerId}
              onChange={(id) =>
                onDefaultsChange((prev) => ({ ...prev, linkedCustomerId: id }))
              }
            />
          ) : null}

          {/* 3. Password Strategy */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password Strategy</Text>
            <View style={styles.strategyRow}>
              <ThemedButton
                label="Generate individually"
                onPress={() =>
                  onDefaultsChange((prev) => ({
                    ...prev,
                    passwordStrategy: 'generate',
                    sharedPassword: '',
                  }))
                }
                variant={defaults.passwordStrategy === 'generate' ? 'primary' : 'secondary'}
                style={styles.strategyButton}
              />
              <ThemedButton
                label="Set shared password"
                onPress={() =>
                  onDefaultsChange((prev) => ({
                    ...prev,
                    passwordStrategy: 'shared',
                  }))
                }
                variant={defaults.passwordStrategy === 'shared' ? 'primary' : 'secondary'}
                style={styles.strategyButton}
              />
            </View>
          </View>

          {/* 4. Shared password input */}
          {defaults.passwordStrategy === 'shared' ? (
            <View style={styles.field}>
              <ThemedInput
                value={defaults.sharedPassword}
                onChangeText={(text) =>
                  onDefaultsChange((prev) => ({ ...prev, sharedPassword: text }))
                }
                placeholder="Enter shared password"
                secureTextEntry
              />
              <Text style={styles.fieldHint}>
                All generated cards will use this password.
              </Text>
            </View>
          ) : null}

          {/* 5. Informational note */}
          <Text style={styles.infoNote}>
            All created users will be required to set a new password on first login.
          </Text>

          {/* 6. Amount + action buttons */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <ThemedInput
              value={countString}
              onChangeText={handleCountChange}
              placeholder="1–20"
              keyboardType="numeric"
            />
            {countError ? <Text style={styles.errorText}>{countError}</Text> : null}
          </View>

          <View style={styles.actionRow}>
            <ThemedButton
              label="Generate New"
              onPress={onGenerate}
              variant="solid"
              style={styles.actionButton}
              disabled={countError !== null}
            />
            <ThemedButton
              label="Set Selected"
              onPress={onSetSelected}
              variant="secondary"
              style={styles.actionButton}
              disabled={selectedCount === 0}
              tooltip={selectedCount === 0 ? 'Select cards first' : `Apply defaults to ${selectedCount} selected card(s)`}
            />
            <ThemedButton
              label="Set All"
              onPress={onSetAll}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
    </CollapsibleCard>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: theme.spacing.md,
    },
    field: {
      marginTop: theme.spacing.md,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    fieldHint: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
      lineHeight: 16,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.danger,
      marginTop: theme.spacing.xs,
    },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    roleButton: {
      minWidth: 90,
    },
    strategyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    strategyButton: {
      flex: 1,
      minWidth: 140,
    },
    infoNote: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      fontStyle: 'italic',
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      minWidth: 110,
    },
  });
}
