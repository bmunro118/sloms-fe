import { useMemo } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { useAuth } from '@context/AuthContext';
import { TwoFactorEnrollment } from '@features/auth/TwoFactorEnrollment';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';

export default function TwoFactorEnrollScreen() {
  const { pendingTwoFactor, completeTwoFactor, cancelTwoFactor } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // The AuthGuard redirects away when there is no pending enrollment; render
  // nothing in the brief window before that happens.
  if (!pendingTwoFactor || pendingTwoFactor.mode !== 'enroll') {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={Platform.OS !== 'web'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('@assets/images/branding/Sonic-Labs-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Set up two-factor authentication</Text>
        <Text style={styles.subtitle}>
          Your account requires a second factor before you can access the portal.
        </Text>

        <TwoFactorEnrollment
          method={pendingTwoFactor.method}
          scopedToken={pendingTwoFactor.token}
          onComplete={completeTwoFactor}
        />

        <ThemedButton
          label="Cancel and sign out"
          variant="secondary"
          onPress={cancelTwoFactor}
          style={styles.cancelButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
      paddingVertical: 40,
      gap: 12,
    },
    logo: {
      width: 180,
      height: 100,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textMuted,
      textAlign: 'center',
      maxWidth: 400,
      marginBottom: 8,
    },
    cancelButton: {
      width: '100%',
      maxWidth: 400,
      marginTop: 4,
    },
  });
}
