import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ClipboardList as AuditIcon,
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  Save as SaveIcon,
  Trash2 as DeleteIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import {
  UserRecord,
  UserRole,
  UpdateUserPayload,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  reactivateUser,
  unlockUser,
  resetUserPassword,
} from '@src/features/users/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const ASSIGNABLE_ROLES: Exclude<UserRole, 'Customer'>[] = [
  'Admin',
  'Manager',
  'Operative',
  'ReadOnly',
];

export default function UserDetailScreen() {
  const { isAdmin, isStaff, user: currentUser } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const { showConfirm, showSuccess, showDanger } = useAppModal();
  const params = useLocalSearchParams<{ id: string }>();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserPayload>({});

  // Reset-password inline form state
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const isSelf = currentUser?.userId === userId;

  useEffect(() => {
    if (!isStaff || !Number.isFinite(userId)) {
      setError('Invalid user ID.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await getUser(userId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setUser(response);
          setFormData({
            email: response.email,
            fullName: response.fullName,
            role: response.role,
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load user.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [userId, isStaff]);

  const handleStartEdit = useCallback(() => {
    if (!user) return;
    setFormData({ email: user.email, fullName: user.fullName, role: user.role });
    setIsEditing(true);
  }, [user]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (user) {
      setFormData({ email: user.email, fullName: user.fullName, role: user.role });
    }
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user || !Number.isFinite(userId)) return;
    setIsSaving(true);
    try {
      const updated = await updateUser(userId, formData);
      setUser(updated);
      setFormData({ email: updated.email, fullName: updated.fullName, role: updated.role });
      setIsEditing(false);
      showSuccess('User updated', 'Changes saved successfully.');
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setIsSaving(false);
    }
  }, [user, userId, formData, showSuccess, showDanger]);

  const handleDeactivate = useCallback(async () => {
    if (!user) return;
    const confirmed = await showConfirm({
      title: 'Deactivate user?',
      message: `${user.fullName ?? user.username} will no longer be able to log in.`,
      confirmLabel: 'Deactivate',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      const updated = await deactivateUser(userId);
      setUser(updated);
      showSuccess('User deactivated');
    } catch (err) {
      showDanger('Deactivate failed', err instanceof Error ? err.message : 'Could not deactivate user.');
    }
  }, [user, userId, showConfirm, showSuccess, showDanger]);

  const handleReactivate = useCallback(async () => {
    if (!user) return;
    const confirmed = await showConfirm({
      title: 'Reactivate user?',
      message: `${user.fullName ?? user.username} will be able to log in again.`,
      confirmLabel: 'Reactivate',
    });
    if (!confirmed) return;
    try {
      const updated = await reactivateUser(userId);
      setUser(updated);
      showSuccess('User reactivated');
    } catch (err) {
      showDanger('Reactivate failed', err instanceof Error ? err.message : 'Could not reactivate user.');
    }
  }, [user, userId, showConfirm, showSuccess, showDanger]);

  const handleUnlock = useCallback(async () => {
    if (!user) return;
    const confirmed = await showConfirm({
      title: 'Unlock account?',
      message: `Clear the lockout on ${user.fullName ?? user.username}'s account.`,
      confirmLabel: 'Unlock',
    });
    if (!confirmed) return;
    try {
      const updated = await unlockUser(userId);
      setUser(updated);
      showSuccess('Account unlocked');
    } catch (err) {
      showDanger('Unlock failed', err instanceof Error ? err.message : 'Could not unlock account.');
    }
  }, [user, userId, showConfirm, showSuccess, showDanger]);

  const handleConfirmPasswordReset = useCallback(async () => {
    if (!newPassword.trim()) return;
    const confirmed = await showConfirm({
      title: 'Reset password?',
      message: `Set a new password for ${user?.fullName ?? user?.username}. They will be required to change it on next login.`,
      confirmLabel: 'Reset Password',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setIsResettingPassword(true);
    try {
      await resetUserPassword(userId, newPassword.trim());
      setShowResetForm(false);
      setNewPassword('');
      showSuccess('Password reset', 'The user will be prompted to change their password on next login.');
    } catch (err) {
      showDanger('Reset failed', err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setIsResettingPassword(false);
    }
  }, [newPassword, user, userId, showConfirm, showSuccess, showDanger]);

  const handleDelete = useCallback(async () => {
    if (!user) return;
    const confirmed = await showConfirm({
      title: 'Delete user permanently?',
      message: `This will permanently delete ${user.fullName ?? user.username}. This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteUser(userId);
      showSuccess('User deleted');
      router.replace('/(app)/users' as never);
    } catch (err) {
      showDanger('Delete failed', err instanceof Error ? err.message : 'Could not delete user.');
    }
  }, [user, userId, showConfirm, showSuccess, showDanger, router]);

  const handleViewAuditLog = useCallback(() => {
    router.push(`/(app)/users/audit-log?userId=${userId}` as never);
  }, [userId, router]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildBackTopBarAction({ onPress: () => router.back() }),
    ];

    if (isAdmin && !isEditing) {
      actions.push(
        buildIconTopBarAction({
          id: 'edit-user',
          label: 'Edit user',
          onPress: handleStartEdit,
          icon: EditIcon,
          disabled: isLoading || !user,
        })
      );
    }

    if (isEditing) {
      actions.push(
        buildIconTopBarAction({
          id: 'save-user',
          label: 'Save',
          onPress: handleSave,
          icon: SaveIcon,
          disabled: isSaving,
        }),
        buildIconTopBarAction({
          id: 'cancel-edit',
          label: 'Cancel',
          onPress: handleCancelEdit,
          icon: CancelEditIcon,
          disabled: isSaving,
        })
      );
    }

    return actions;
  }, [isAdmin, isEditing, isLoading, user, isSaving, handleStartEdit, handleSave, handleCancelEdit, router]);

  useScreenTopBar({
    title: user ? (user.fullName ?? user.username ?? `User #${user.userId}`) : 'User',
    actions: topBarActions,
  });

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  if (!Number.isFinite(userId)) {
    return (
      <ScreenContent>
        <Text style={styles.error}>Invalid user ID.</Text>
      </ScreenContent>
    );
  }

  if (isLoading) {
    return (
      <ScreenContent>
        <Text style={styles.muted}>Loading user...</Text>
      </ScreenContent>
    );
  }

  if (error || !user) {
    return (
      <ScreenContent>
        <Text style={styles.error}>{error ?? 'User not found.'}</Text>
      </ScreenContent>
    );
  }

  const isInactive = user.isActive === false;
  const isLocked = user.isLockedOut === true;

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Profile card ── */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <Text style={styles.fieldValue}>{user.username ?? '—'}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {isEditing ? (
              <ThemedInput
                value={formData.fullName ?? ''}
                onChangeText={(text) => setFormData((f) => ({ ...f, fullName: text }))}
                placeholder="Full name"
                style={styles.input}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.fullName ?? '—'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            {isEditing ? (
              <ThemedInput
                value={formData.email ?? ''}
                onChangeText={(text) => setFormData((f) => ({ ...f, email: text }))}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            ) : (
              <Text style={styles.fieldValue}>{user.email ?? '—'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Role</Text>
            {isEditing ? (
              <View style={styles.roleRow}>
                {ASSIGNABLE_ROLES.map((role) => (
                  <RoleChip
                    key={role}
                    label={role}
                    selected={formData.role === role}
                    onPress={() => setFormData((f) => ({ ...f, role }))}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{user.role ?? '—'}</Text>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editActionsRow}>
              <ThemedButton
                label={isSaving ? 'Saving…' : 'Save Changes'}
                onPress={handleSave}
                disabled={isSaving}
                style={styles.actionButton}
              />
              <ThemedButton
                label="Cancel"
                onPress={handleCancelEdit}
                variant="secondary"
                disabled={isSaving}
                style={styles.actionButton}
              />
            </View>
          ) : null}
        </ThemedCard>

        {/* ── Status card ── */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.badgesRow}>
            <StatusBadge
              label={isInactive ? 'Inactive' : 'Active'}
              variant={isInactive ? 'danger' : 'success'}
            />
            {isLocked ? <StatusBadge label="Locked Out" variant="danger" /> : null}
            {user.mustChangePassword ? <StatusBadge label="Must Change Password" variant="warning" /> : null}
          </View>
        </ThemedCard>

        {/* ── Admin actions ── */}
        {isAdmin ? (
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>

            <View style={styles.actionsStack}>
              {isInactive ? (
                <ThemedButton
                  label="Reactivate User"
                  onPress={handleReactivate}
                  style={styles.actionButton}
                />
              ) : (
                <ThemedButton
                  label="Deactivate User"
                  onPress={handleDeactivate}
                  variant="secondary"
                  style={styles.actionButton}
                />
              )}

              {isLocked ? (
                <ThemedButton
                  label="Unlock Account"
                  onPress={handleUnlock}
                  style={styles.actionButton}
                />
              ) : null}

              {/* Reset password */}
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
                      onPress={handleConfirmPasswordReset}
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

              <ThemedButton
                label="View Audit Log"
                onPress={handleViewAuditLog}
                variant="secondary"
                style={styles.actionButton}
              />

              {/* Delete — shown last, only if not self */}
              {!isSelf ? (
                <ThemedButton
                  label="Delete User"
                  onPress={handleDelete}
                  variant="secondary"
                  style={[styles.actionButton, styles.dangerButton]}
                  textStyle={{ color: theme.colors.danger }}
                />
              ) : null}
            </View>
          </ThemedCard>
        ) : null}
      </ScrollView>
    </ScreenContent>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <ThemedButton
      label={label}
      onPress={onPress}
      variant={selected ? 'primary' : 'secondary'}
      style={{ minWidth: 90 }}
      tooltip={`Select role: ${label}`}
    />
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: 'success' | 'danger' | 'warning';
}) {
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

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    card: common.card,
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
    fieldValue: {
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    input: {
      marginTop: 2,
    },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    editActionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      flexWrap: 'wrap',
    },
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
    actionButton: {
      flexShrink: 1,
    },
    dangerButton: {
      borderColor: theme.colors.danger,
    },
    resetForm: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
    },
    resetActionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
  });
}
