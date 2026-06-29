import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ApiError } from '@utils/api';
import {
  CompleteResponse,
  SetupResponse,
  TwoFactorMethod,
  enableTwoFactor,
  enableTwoFactorAuthed,
  setupTwoFactor,
  setupTwoFactorAuthed,
} from '@features/auth/api';
import { RecoveryCodesPanel } from './RecoveryCodesPanel';
import { RememberDeviceToggle } from './RememberDeviceToggle';

interface Props {
  method: TwoFactorMethod;
  /** Scoped login token (bearer clients). Ignored when `authed` is true. */
  scopedToken: string | null;
  /** Use the full session token instead of a scoped token (account screen). */
  authed?: boolean;
  showRememberDevice?: boolean;
  submitLabel?: string;
  onComplete: (response: CompleteResponse) => void | Promise<void>;
}

function codeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'That code was incorrect. Please try again.';
    return err.code ?? err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export function TwoFactorEnrollment({
  method,
  scopedToken,
  authed = false,
  showRememberDevice = true,
  submitLabel = 'Verify & enable',
  onComplete,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();

  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [completed, setCompleted] = useState<CompleteResponse | null>(null);

  const runSetup = useCallback(async () => {
    setLoadingSetup(true);
    setSetupError(null);
    try {
      const result = authed ? await setupTwoFactorAuthed() : await setupTwoFactor(scopedToken);
      if (isMountedRef.current) setSetup(result);
    } catch (err) {
      if (isMountedRef.current) setSetupError(codeError(err));
    } finally {
      if (isMountedRef.current) setLoadingSetup(false);
    }
  }, [authed, scopedToken, isMountedRef]);

  useEffect(() => {
    void runSetup();
  }, [runSetup]);

  const handleEnable = useCallback(async () => {
    if (!code.trim()) {
      setError('Enter the verification code.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = authed
        ? await enableTwoFactorAuthed(code)
        : await enableTwoFactor(scopedToken, code, rememberDevice);

      if (!isMountedRef.current) return;

      if (response.recoveryCodes && response.recoveryCodes.length > 0) {
        // Hold on the recovery-codes step until the user acknowledges them.
        setCompleted(response);
        setRecoveryCodes(response.recoveryCodes);
        return;
      }
      await onComplete(response);
    } catch (err) {
      if (isMountedRef.current) setError(codeError(err));
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }, [authed, code, rememberDevice, scopedToken, onComplete, isMountedRef]);

  const instructions = useMemo(() => {
    if (method === 'email') {
      return setup?.sentTo
        ? `We sent a 6-digit code to ${setup.sentTo}. Enter it below to finish enabling two-factor authentication.`
        : 'Enter the 6-digit code we emailed you to finish enabling two-factor authentication.';
    }
    return 'Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password…), then enter the 6-digit code it shows.';
  }, [method, setup?.sentTo]);

  if (recoveryCodes && completed) {
    return (
      <View style={styles.container}>
        <RecoveryCodesPanel codes={recoveryCodes} />
        <ThemedButton
          label="I've saved my codes — continue"
          variant="solid"
          onPress={() => onComplete(completed)}
          style={styles.fullButton}
          testID="twofa-recovery-continue"
        />
      </View>
    );
  }

  if (loadingSetup) {
    return <LoadingSpinner message="Preparing two-factor setup…" />;
  }

  if (setupError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{setupError}</Text>
        <ThemedButton label="Try again" variant="outline" onPress={runSetup} style={styles.fullButton} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>{instructions}</Text>

      {method === 'totp' && setup?.qrDataUrl ? (
        <View style={styles.qrWrap}>
          <Image source={{ uri: setup.qrDataUrl }} style={styles.qr} resizeMode="contain" />
          {setup.otpauthUrl ? (
            <>
              <Text style={styles.manualLabel}>Can't scan? Enter this key manually:</Text>
              <Text style={styles.manualKey} selectable testID="twofa-otpauth-uri">
                {setup.otpauthUrl}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      <ThemedInput
        placeholder="6-digit code"
        keyboardType="number-pad"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        value={code}
        onChangeText={setCode}
        style={styles.input}
        editable={!submitting}
        testID="twofa-enroll-code"
      />

      {method === 'email' ? (
        <ThemedButton
          label="Send a new code"
          variant="outline"
          onPress={runSetup}
          disabled={submitting}
          style={styles.linkButton}
        />
      ) : null}

      {showRememberDevice ? (
        <RememberDeviceToggle value={rememberDevice} onChange={setRememberDevice} disabled={submitting} />
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ThemedButton
        label={submitting ? 'Verifying…' : submitLabel}
        variant="solid"
        onPress={handleEnable}
        disabled={submitting}
        style={styles.fullButton}
        testID="twofa-enroll-submit"
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
    qrWrap: {
      alignItems: 'center',
      gap: 8,
    },
    qr: {
      width: 200,
      height: 200,
      backgroundColor: '#ffffff',
      borderRadius: 8,
    },
    manualLabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    manualKey: {
      fontFamily: 'monospace',
      fontSize: 11,
      color: theme.colors.textSecondary,
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
    errorText: {
      color: theme.colors.danger,
      textAlign: 'center',
    },
  });
}
