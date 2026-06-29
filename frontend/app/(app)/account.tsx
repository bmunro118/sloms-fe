import { RotateCcw as ResetIcon, Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { UserRecord, getMe } from '@src/features/users/api';
import { TwoFactorSettingsCard } from '@features/auth/TwoFactorSettingsCard';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function AccountScreen() {
  const { user } = useAuth();
  const { showConfirm } = useAppModal();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<UserRecord | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const result = await getMe({ signal: controller.signal });
        if (!controller.signal.aborted && isMountedRef.current) setProfile(result);
      } catch {
        // Non-critical — fall back to auth context user data
      }
    })();
    return () => controller.abort();
  }, [isMountedRef]);

  const reloadProfile = useCallback(async () => {
    try {
      const result = await getMe();
      if (isMountedRef.current) setProfile(result);
    } catch {
      // Non-critical — leave the existing profile in place.
    }
  }, [isMountedRef]);

  const canSubmitPasswordChange = useMemo(() => {
    const currentTrimmed = currentPassword.trim();
    const nextTrimmed = newPassword.trim();
    const confirmTrimmed = confirmPassword.trim();

    return (
      !isSubmitting &&
      currentTrimmed.length > 0 &&
      nextTrimmed.length > 0 &&
      currentTrimmed !== nextTrimmed &&
      nextTrimmed === confirmTrimmed
    );
  }, [confirmPassword, currentPassword, isSubmitting, newPassword]);

  const performPasswordChange = useCallback(async () => {
    setStatus(null);
    if (!currentPassword || !newPassword) {
      setStatus('Enter current and new password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest(ENDPOINTS.users.mePassword, {
        method: 'PATCH',
        requireAuth: true,
        body: {
          currentPassword,
          newPassword,
        },
      });
      if (isMountedRef.current) {
        setStatus('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setStatus(err instanceof Error ? err.message : 'Unable to change password.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [currentPassword, isMountedRef, newPassword]);

  const handlePasswordChange = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Change password?',
      message: 'Your account password will be updated with the new password you entered.',
      confirmLabel: 'Change password',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    await performPasswordChange();
  }, [isSubmitting, performPasswordChange, showConfirm]);

  const isDirty = useMemo(
    () => currentPassword.trim().length > 0 || newPassword.trim().length > 0 || confirmPassword.trim().length > 0,
    [confirmPassword, currentPassword, newPassword],
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

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'reset-password-form',
        label: 'Reset form',
        onPress: () => {
          void guardAction(() => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setStatus(null);
          });
        },
        icon: ResetIcon,
        disabled: isSubmitting,
      }),
    ];
  }, [isSubmitting, guardAction]);

  useScreenTopBar({ title: 'Account', actions: topBarActions });

  return (
    <ScreenContent gap={10}>
      <View style={styles.centeredBlock}>
        <Text style={styles.meta}>Username: {profile?.username ?? user?.username ?? 'Unknown'}</Text>
        <Text style={styles.meta}>Role: {profile?.role ?? user?.role ?? 'Unknown'}</Text>
        {profile?.fullName ? <Text style={styles.meta}>Name: {profile.fullName}</Text> : null}
        {profile?.email ? <Text style={styles.meta}>Email: {profile.email}</Text> : null}

        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.formContainer}>
          <ThemedInput
            secureTextEntry
            placeholder="Current password"
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!isSubmitting}
          />
          <ThemedInput
            secureTextEntry
            placeholder="New password"
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!isSubmitting}
          />
          <ThemedInput
            secureTextEntry
            placeholder="Confirm new password"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isSubmitting}
          />
          <ThemedButton
            label={isSubmitting ? 'Saving...' : 'Save Password'}
            icon={<SaveIcon size={16} color="white" />}
            variant="solid"
            disabled={!canSubmitPasswordChange}
            onPress={handlePasswordChange}
            tooltip={canSubmitPasswordChange ? 'Save password change' : 'Save password change disabled'}
            style={styles.saveButton}
          />
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        <TwoFactorSettingsCard
          method={profile?.twoFactorMethod ?? 'totp'}
          enabled={Boolean(profile?.twoFactorEnabled)}
          onChanged={reloadProfile}
        />
      </View>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    centeredBlock: {
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
      gap: 10,
    },
    formContainer: {
      width: '100%',
      gap: 16,
    },
    saveButton: {
      alignSelf: 'flex-end',
    },
  });
}
