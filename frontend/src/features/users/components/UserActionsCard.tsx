import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { UserRecord } from '@src/features/users/api';

type Props = {
  user: UserRecord;
  isAdmin: boolean;
  isSelf: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onUnlock: () => void;
  onResetPassword: (newPassword: string) => Promise<void>;
  onViewAuditLog: () => void;
  onDelete: () => void;
};

function StatusBadge({ label, variant }: { label: string; variant: 'success' | 'danger' | 'warning' }) {
  const theme = useAppTheme();
  const colors = {
    success: { bg: theme.colors.surface, text: theme.colors.accent, border: theme.colors.accent },
    danger: { bg: theme.colors.dangerSurface, text: theme.colors.danger, border: theme.colors.danger },
    warning: { bg: theme.colors.surface, text: theme.colors.textSecondary, border: theme.colors.border },
  }[variant];

  return (
    <View
      style={{
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  );
}

export function UserActionsCard({
  user,
  isAdmin,
  isSelf,
  onDeactivate,
  onReactivate,
  onUnlock,
  onResetPassword,
  onViewAuditLog,
  onDelete,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const isInactive = user.isActive === false;
  const isLocked = user.isLockedOut === true;

  const handleConfirmReset = async () => {
    if (!newPassword.trim()) return;
    setIsResettingPassword(true);
    try {
      await onResetPassword(newPassword.trim());
      setShowResetForm(false);
      setNewPassword('');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <>
      {/* Status card */}
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.badgesRow}>
          <StatusBadge label={isInactive ? 'Inactive' : 'Active'} variant={isInactive ? 'danger' : 'success'} />
          {isLocked ? <StatusBadge label="Locked Out" variant="danger" /> : null}
          {user.mustChangePassword ? <StatusBadge label="Must Change Password" variant="warning" /> : null}
        </View>
      </ThemedCard>

      {/* Admin actions card */}
      {isAdmin ? (
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>

          <View style={styles.actionsStack}>
            {isInactive ? (
              <ThemedButton label="Reactivate User" onPress={onReactivate} style={styles.actionButton} />
            ) : (
              <ThemedButton label="Deactivate User" onPress={onDeactivate} variant="secondary" style={styles.actionButton} />
            )}

            {isLocked ? (
              <ThemedButton label="Unlock Account" onPress={onUnlock} style={styles.actionButton} />
            ) : null}

            {showResetForm ? (
              <View style={styles.resetForm}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <ThemedInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                  style={styles.input}
                />
                <View style={styles.resetActionsRow}>
                  <ThemedButton
                    label={isResettingPassword ? 'Resetting…' : 'Confirm Reset'}
                    onPress={handleConfirmReset}
                    disabled={!newPassword.trim() || isResettingPassword}
                    style={styles.actionButton}
                  />
                  <ThemedButton
                    label="Cancel"
                    onPress={() => { setShowResetForm(false); setNewPassword(''); }}
                    variant="secondary"
                    disabled={isResettingPassword}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            ) : (
              <ThemedButton
                label="Reset Password"
                onPress={() => setShowResetForm(true)}
                variant="secondary"
                style={styles.actionButton}
              />
            )}

            <ThemedButton label="View Audit Log" onPress={onViewAuditLog} variant="secondary" style={styles.actionButton} />

            {!isSelf ? (
              <ThemedButton
                label="Delete User"
                onPress={onDelete}
                variant="secondary"
                style={[styles.actionButton, styles.dangerButton]}
                textStyle={{ color: theme.colors.danger }}
              />
            ) : null}
          </View>
        </ThemedCard>
      ) : null}
    </>
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
      color: theme.colors.text,
      marginBottom: 4,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    input: { marginTop: 2 },
    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    actionsStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    actionButton: { flexShrink: 1 },
    dangerButton: { borderColor: theme.colors.danger },
    resetForm: { gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
    resetActionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
  });
}
