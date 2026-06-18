import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  Save as SaveIcon,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import {
  UpdateUserPayload,
  UserRecord,
  deleteUser,
  deactivateUser,
  getUser,
  reactivateUser,
  resetUserPassword,
  unlockUser,
  updateUser,
} from '@src/features/users/api';
import { UserProfileCard } from '@src/features/users/components/UserProfileCard';
import { UserActionsCard } from '@src/features/users/components/UserActionsCard';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export default function UserDetailScreen() {
  const { isAdmin, isStaff, user: currentUser } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();
  const params = useLocalSearchParams<{ id: string }>();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserPayload>({});

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
            linkedCustomerId: response.linkedCustomerId ?? null,
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
    setFormData({ email: user.email, fullName: user.fullName, role: user.role, linkedCustomerId: user.linkedCustomerId ?? null });
    setIsEditing(true);
  }, [user]);

  // Unsaved changes guard
  const isDirty = useMemo(
    () => isEditing && !!user && JSON.stringify({ email: formData.email, fullName: formData.fullName, role: formData.role, linkedCustomerId: formData.linkedCustomerId }) !== JSON.stringify({ email: user.email, fullName: user.fullName, role: user.role, linkedCustomerId: user.linkedCustomerId ?? null }),
    [isEditing, formData, user],
  );

  const { guardAction } = useUnsavedChangesGuard({ isDirty });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  const handleCancelEdit = useCallback(() => {
    void guardAction(() => {
      setIsEditing(false);
      if (user) {
        setFormData({ email: user.email, fullName: user.fullName, role: user.role, linkedCustomerId: user.linkedCustomerId ?? null });
      }
    });
  }, [guardAction, user]);

  const handleSave = useCallback(async () => {
    if (!user || !Number.isFinite(userId)) return;
    setIsSaving(true);
    try {
      const updated = await updateUser(userId, formData);
      setUser(updated);
      setFormData({ email: updated.email, fullName: updated.fullName, role: updated.role, linkedCustomerId: updated.linkedCustomerId ?? null });
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

  const handleResetPassword = useCallback(async (newPassword: string) => {
    const confirmed = await showConfirm({
      title: 'Reset password?',
      message: `Set a new password for ${user?.fullName ?? user?.username}. They will be required to change it on next login.`,
      confirmLabel: 'Reset Password',
      confirmVariant: 'danger',
    });
    if (!confirmed) throw new Error('cancelled');
    await resetUserPassword(userId, newPassword);
    showSuccess('Password reset', 'The user will be prompted to change their password on next login.');
  }, [user, userId, showConfirm, showSuccess]);

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
      buildBackTopBarAction({ onPress: () => void guardAction(() => router.back()) }),
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
  }, [isAdmin, isEditing, isLoading, user, isSaving, guardAction, handleStartEdit, handleSave, handleCancelEdit, router]);

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
        <LoadingSpinner message="Loading user..." fullScreen />
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

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <UserProfileCard
          user={user}
          isEditing={isEditing}
          isAdmin={isAdmin}
          formData={formData}
          onFormChange={setFormData}
        />
        <UserActionsCard
          user={user}
          isAdmin={isAdmin}
          isSelf={isSelf}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onUnlock={handleUnlock}
          onResetPassword={handleResetPassword}
          onViewAuditLog={handleViewAuditLog}
          onDelete={handleDelete}
        />
      </ScrollView>
    </ScreenContent>
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
  });
}
