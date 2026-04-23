import { KeyRound as PasswordIcon, LogOut as SignOutIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async () => {
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
  };

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      {
        id: 'submit-password-change',
        label: isSubmitting ? 'Updating password...' : 'Update password',
        accessibilityLabel: isSubmitting ? 'Updating password' : 'Update password',
        onPress: handlePasswordChange,
        disabled: isSubmitting,
        renderIcon: ({ color, size }) => <PasswordIcon color={color} size={size} />,
      },
      {
        id: 'reset-password-form',
        label: 'Reset form',
        accessibilityLabel: 'Reset form',
        onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setStatus(null);
        },
        disabled: isSubmitting,
        renderIcon: ({ color, size }) => <ResetIcon color={color} size={size} />,
      },
      {
        id: 'sign-out-account',
        label: 'Sign out',
        accessibilityLabel: 'Sign out',
        onPress: signOut,
        disabled: isSubmitting,
        renderIcon: ({ color, size }) => <SignOutIcon color={color} size={size} />,
      },
    ];
  }, [handlePasswordChange, isSubmitting, signOut]);

  useScreenTopBar({ title: 'Account', actions: topBarActions });

  return (
    <ScreenContent gap={10}>
      <Text style={styles.meta}>Username: {user?.username ?? 'Unknown'}</Text>
      <Text style={styles.meta}>Role: {user?.role ?? 'Unknown'}</Text>

      <Text style={styles.sectionTitle}>Change Password</Text>
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
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
