import { RotateCcw as ResetIcon, Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function AccountScreen() {
  const { user } = useAuth();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmitPasswordChange = useMemo(() => {
    const currentTrimmed = currentPassword.trim();
    const nextTrimmed = newPassword.trim();

    return !isSubmitting && currentTrimmed.length > 0 && nextTrimmed.length > 0 && currentTrimmed !== nextTrimmed;
  }, [currentPassword, isSubmitting, newPassword]);

  const handlePasswordChange = useCallback(async () => {
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
  }, [currentPassword, isMountedRef, newPassword]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'reset-password-form',
        label: 'Reset form',
        onPress: () => {
          setCurrentPassword('');
          setNewPassword('');
          setStatus(null);
        },
        icon: ResetIcon,
        disabled: isSubmitting,
      }),
    ];
  }, [isSubmitting]);

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
      <View style={styles.contentActionRowRight}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={canSubmitPasswordChange ? 'Save password change' : 'Save password change disabled'}
          disabled={!canSubmitPasswordChange}
          onPress={handlePasswordChange}
          style={(state) => [
            styles.contentActionButton,
            !canSubmitPasswordChange ? styles.contentActionButtonDisabled : null,
            isHovered(state) && canSubmitPasswordChange ? styles.contentActionButtonHover : null,
            state.pressed && canSubmitPasswordChange ? styles.contentActionButtonPressed : null,
          ]}
        >
          <SaveIcon size={16} color={canSubmitPasswordChange ? theme.colors.navTextStrong : theme.colors.textMuted} />
          <Text style={[styles.contentActionButtonText, !canSubmitPasswordChange ? styles.contentActionButtonTextDisabled : null]}>
            {isSubmitting ? 'Saving...' : 'Save Password'}
          </Text>
        </Pressable>
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScreenContent>
  );
}

function isHovered(state: PressableStateCallbackType) {
  return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
  });
}
