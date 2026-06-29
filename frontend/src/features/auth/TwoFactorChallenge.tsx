import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ApiError } from '@utils/api';
import {
  CompleteResponse,
  TwoFactorMethod,
  resendTwoFactorCode,
  verifyTwoFactor,
} from '@features/auth/api';
import { RememberDeviceToggle } from './RememberDeviceToggle';

interface Props {
  method: TwoFactorMethod;
  scopedToken: string | null;
  onComplete: (response: CompleteResponse) => void | Promise<void>;
  showRememberDevice?: boolean;
}

function codeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'That code was incorrect. Please try again.';
    return err.code ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export function TwoFactorChallenge({
  method,
  scopedToken,
  onComplete,
  showRememberDevice = true,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();

  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleVerify = useCallback(async () => {
    if (!code.trim()) {
      setError('Enter your verification code.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await verifyTwoFactor(scopedToken, code, rememberDevice);
      if (isMountedRef.current) await onComplete(response);
    } catch (err) {
      if (isMountedRef.current) setError(codeError(err));
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }, [code, rememberDevice, scopedToken, onComplete, isMountedRef]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      const { sentTo } = await resendTwoFactorCode(scopedToken);
      if (isMountedRef.current) setNotice(`A new code was sent to ${sentTo}.`);
    } catch (err) {
      if (isMountedRef.current) setError(codeError(err));
    } finally {
      if (isMountedRef.current) setResending(false);
    }
  }, [scopedToken, isMountedRef]);

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        {method === 'email'
          ? 'Enter the 6-digit code we emailed you. You can also use a recovery code.'
          : 'Enter the 6-digit code from your authenticator app. You can also use a recovery code.'}
      </Text>

      <ThemedInput
        placeholder="Code or recovery code"
        keyboardType={method === 'email' ? 'number-pad' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        value={code}
        onChangeText={setCode}
        style={styles.input}
        editable={!submitting}
        testID="twofa-verify-code"
      />

      {method === 'email' ? (
        <ThemedButton
          label={resending ? 'Sending…' : 'Send a new code'}
          variant="outline"
          onPress={handleResend}
          disabled={resending || submitting}
          style={styles.linkButton}
        />
      ) : null}

      {showRememberDevice ? (
        <RememberDeviceToggle value={rememberDevice} onChange={setRememberDevice} disabled={submitting} />
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ThemedButton
        label={submitting ? 'Verifying…' : 'Verify'}
        variant="solid"
        onPress={handleVerify}
        disabled={submitting}
        style={styles.fullButton}
        testID="twofa-verify-submit"
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: 400,
      alignSelf: 'center',
      gap: 12,
    },
    instructions: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    input: {
      width: '100%',
      fontSize: 16,
    },
    linkButton: {
      alignSelf: 'flex-start',
    },
    fullButton: {
      width: '100%',
    },
    notice: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.danger,
      textAlign: 'center',
    },
  });
}
