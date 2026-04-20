import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const isMountedRef = useIsMountedRef();
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
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.meta}>Username: {user?.username ?? 'Unknown'}</Text>
      <Text style={styles.meta}>Role: {user?.role ?? 'Unknown'}</Text>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <TextInput
        secureTextEntry
        placeholder="Current password"
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        secureTextEntry
        placeholder="New password"
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Pressable onPress={handlePasswordChange} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Update password</Text>
      </Pressable>

      <Pressable onPress={signOut} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: {
    color: '#334155',
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  status: {
    color: '#334155',
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
});
