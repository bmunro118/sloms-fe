import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  useScreenTitle('Account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    setStatus(null);
    if (!currentPassword || !newPassword) {
      setStatus('Enter current and new password.');
      return;
    }

    try {
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
    }
  };

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
      />
      <ThemedInput
        secureTextEntry
        placeholder="New password"
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <ThemedButton label="Update password" onPress={handlePasswordChange} style={styles.primaryButton} />

      <ThemedButton label="Sign out" variant="secondary" onPress={signOut} style={styles.secondaryButton} />
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    primaryButton: {
      paddingVertical: 11,
    },
    secondaryButton: {
      paddingVertical: 11,
    },
  });
}
