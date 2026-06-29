import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ApiError } from '@utils/api';
import {
  TrustedDevice,
  TwoFactorMethod,
  disableTwoFactor,
  listTrustedDevices,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
} from '@features/auth/api';
import { TwoFactorEnrollment } from './TwoFactorEnrollment';

interface Props {
  method: TwoFactorMethod;
  enabled: boolean;
  /** Called after enable/disable so the parent can refetch the profile. */
  onChanged: () => void | Promise<void>;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'That code was incorrect. Please try again.';
    return err.code ?? err.message;
  }
  return err instanceof Error ? err.message : fallback;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function TwoFactorSettingsCard({ method, enabled, onChanged }: Props) {
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const { showConfirm } = useAppModal();

  const [mode, setMode] = useState<'idle' | 'enrolling' | 'disabling'>('idle');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const loadDevices = useCallback(async () => {
    if (!enabled) {
      setDevices([]);
      return;
    }
    setLoadingDevices(true);
    try {
      const result = await listTrustedDevices();
      if (isMountedRef.current) setDevices(result);
    } catch {
      // Non-critical — leave the list empty.
    } finally {
      if (isMountedRef.current) setLoadingDevices(false);
    }
  }, [enabled, isMountedRef]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const handleEnrollmentComplete = useCallback(async () => {
    if (!isMountedRef.current) return;
    setMode('idle');
    setStatus('Two-factor authentication is now enabled.');
    setError(null);
    await onChanged();
    await loadDevices();
  }, [onChanged, loadDevices, isMountedRef]);

  const handleDisable = useCallback(async () => {
    if (!disableCode.trim()) {
      setError('Enter a current code to confirm.');
      return;
    }
    const confirmed = await showConfirm({
      title: 'Disable two-factor authentication?',
      message:
        'This removes the second factor from your account and revokes every trusted device. Your account will be less secure.',
      confirmLabel: 'Disable 2FA',
      cancelLabel: 'Keep enabled',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      await disableTwoFactor(disableCode);
      if (!isMountedRef.current) return;
      setMode('idle');
      setDisableCode('');
      setStatus('Two-factor authentication has been disabled.');
      await onChanged();
      await loadDevices();
    } catch (err) {
      if (isMountedRef.current) setError(errorMessage(err, 'Unable to disable two-factor authentication.'));
    } finally {
      if (isMountedRef.current) setBusy(false);
    }
  }, [disableCode, showConfirm, onChanged, loadDevices, isMountedRef]);

  const handleRevoke = useCallback(
    async (device: TrustedDevice) => {
      const confirmed = await showConfirm({
        title: 'Revoke this device?',
        message: `${device.label ?? 'This device'} will need to pass two-factor verification again next time.`,
        confirmLabel: 'Revoke',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });
      if (!confirmed) return;
      try {
        await revokeTrustedDevice(device.id);
        await loadDevices();
      } catch (err) {
        if (isMountedRef.current) setError(errorMessage(err, 'Unable to revoke device.'));
      }
    },
    [showConfirm, loadDevices, isMountedRef],
  );

  const handleRevokeAll = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Revoke all trusted devices?',
      message: 'Every device will need to pass two-factor verification again on next sign-in.',
      confirmLabel: 'Revoke all',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await revokeAllTrustedDevices();
      await loadDevices();
    } catch (err) {
      if (isMountedRef.current) setError(errorMessage(err, 'Unable to revoke devices.'));
    }
  }, [showConfirm, loadDevices, isMountedRef]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status</Text>
        <Text style={[styles.statusValue, enabled ? styles.statusOn : styles.statusOff]}>
          {enabled ? 'Enabled' : 'Disabled'}
          {enabled ? ` · ${method === 'email' ? 'Email code' : 'Authenticator app'}` : ''}
        </Text>
      </View>

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error && mode === 'idle' ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* ── Enable ─────────────────────────────────────────────────────────── */}
      {!enabled && mode !== 'enrolling' ? (
        <ThemedButton
          label="Enable two-factor authentication"
          variant="solid"
          onPress={() => {
            setStatus(null);
            setError(null);
            setMode('enrolling');
          }}
          style={styles.actionButton}
        />
      ) : null}

      {!enabled && mode === 'enrolling' ? (
        <View style={styles.flowBlock}>
          <TwoFactorEnrollment
            method={method}
            scopedToken={null}
            authed
            showRememberDevice={false}
            submitLabel="Verify & enable"
            onComplete={handleEnrollmentComplete}
          />
          <ThemedButton
            label="Cancel"
            variant="outline"
            onPress={() => setMode('idle')}
            style={styles.actionButton}
          />
        </View>
      ) : null}

      {/* ── Disable ────────────────────────────────────────────────────────── */}
      {enabled && mode !== 'disabling' ? (
        <ThemedButton
          label="Disable two-factor authentication"
          variant="danger"
          onPress={() => {
            setStatus(null);
            setError(null);
            setMode('disabling');
          }}
          style={styles.actionButton}
        />
      ) : null}

      {enabled && mode === 'disabling' ? (
        <View style={styles.flowBlock}>
          <Text style={styles.helpText}>
            Enter a current {method === 'email' ? 'email' : 'authenticator'} code (or a recovery code) to
            confirm.
          </Text>
          <ThemedInput
            placeholder="Current code"
            keyboardType={method === 'email' ? 'number-pad' : 'default'}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            value={disableCode}
            onChangeText={setDisableCode}
            editable={!busy}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttonRow}>
            <ThemedButton
              label="Cancel"
              variant="outline"
              onPress={() => {
                setMode('idle');
                setDisableCode('');
                setError(null);
              }}
              disabled={busy}
              style={styles.rowButton}
            />
            <ThemedButton
              label={busy ? 'Disabling…' : 'Confirm disable'}
              variant="danger"
              onPress={handleDisable}
              disabled={busy}
              style={styles.rowButton}
            />
          </View>
        </View>
      ) : null}

      {/* ── Trusted devices ────────────────────────────────────────────────── */}
      {enabled ? (
        <View style={styles.devicesBlock}>
          <Text style={styles.subTitle}>Trusted devices</Text>
          {loadingDevices ? (
            <LoadingSpinner size="small" message="Loading devices…" />
          ) : devices.length === 0 ? (
            <Text style={styles.helpText}>No trusted devices. You'll verify on every new sign-in.</Text>
          ) : (
            <>
              {devices.map((device) => (
                <View key={device.id} style={styles.deviceRow}>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceLabel}>{device.label ?? 'Unknown device'}</Text>
                    <Text style={styles.deviceMeta}>
                      Last used {formatDate(device.lastSeenAt)} · expires {formatDate(device.expiresAt)}
                    </Text>
                  </View>
                  <ThemedButton
                    label="Revoke"
                    variant="outline"
                    onPress={() => handleRevoke(device)}
                    style={styles.revokeButton}
                  />
                </View>
              ))}
              <ThemedButton
                label="Revoke all devices"
                variant="danger"
                onPress={handleRevokeAll}
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      gap: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusLabel: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    statusOn: {
      color: theme.colors.accent,
    },
    statusOff: {
      color: theme.colors.textMuted,
    },
    flowBlock: {
      gap: 12,
    },
    devicesBlock: {
      gap: 10,
    },
    helpText: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    status: {
      fontSize: 14,
      color: theme.colors.accent,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.danger,
    },
    actionButton: {
      alignSelf: 'flex-start',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    rowButton: {
      flex: 1,
    },
    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    deviceInfo: {
      flex: 1,
      gap: 2,
    },
    deviceLabel: {
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    deviceMeta: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    revokeButton: {
      minWidth: 90,
    },
  });
}
