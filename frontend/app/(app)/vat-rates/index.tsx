import { Redirect } from 'expo-router';
import { Plus as AddIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import {
  VatRate,
  closeVatRate,
  createVatRate,
  getCurrentVatRate,
  listVatRates,
} from '@src/features/vat-rates/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { featureFlags } from '@utils/features';

export default function VatRatesScreen() {
  const { isAdmin, role } = useAuth();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();

  const isAdminOrManager = role === 'Admin' || role === 'Manager';

  // ── List state ────────────────────────────────────────────────────────────────
  const [rates, setRates] = useState<VatRate[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Current rate state ────────────────────────────────────────────────────────
  const [currentRate, setCurrentRate] = useState<VatRate | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // ── Create form state (Admin only) ────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createRate, setCreateRate] = useState('');
  const [createLabel, setCreateLabel] = useState('');
  const [createValidFrom, setCreateValidFrom] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ── Close state ───────────────────────────────────────────────────────────────
  const [closingId, setClosingId] = useState<number | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePullToRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTick((t) => t + 1);
  }, []);

  const isLoading = isLoadingList || isLoadingCurrent;

  useEffect(() => {
    if (!isLoading) setIsRefreshing(false);
  }, [isLoading]);

  // ── Load all rates ────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingList(true);
    setListError(null);

    (async () => {
      try {
        const response = await listVatRates({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setRates(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setListError(err instanceof Error ? err.message : 'Failed to load VAT rates.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingList(false);
      }
    })();

    return () => controller.abort();
  }, [refreshTick]);

  // ── Load current rate ─────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingCurrent(true);
    setCurrentError(null);

    (async () => {
      try {
        const rate = await getCurrentVatRate({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setCurrentRate(rate ?? null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          // 404 means no current rate is set — not a hard error
          setCurrentRate(null);
          if (!(err instanceof Error && err.message.includes('404'))) {
            setCurrentError(err instanceof Error ? err.message : 'Failed to load current rate.');
          }
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingCurrent(false);
      }
    })();

    return () => controller.abort();
  }, [refreshTick]);

  // ── Create handler ────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    const parsedRate = parseFloat(createRate);
    if (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100) {
      showDanger('Invalid rate', 'Enter a percentage between 0 and 100.');
      return;
    }
    if (!createValidFrom.match(/^\d{4}-\d{2}-\d{2}$/)) {
      showDanger('Invalid date', 'Enter a valid date in YYYY-MM-DD format.');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Create VAT rate?',
      message: `Add a ${parsedRate}% rate effective from ${createValidFrom}${createLabel ? ` (${createLabel})` : ''}.`,
      confirmLabel: 'Create',
    });
    if (!confirmed) return;

    setIsCreating(true);
    try {
      await createVatRate({
        rate: parsedRate,
        validFrom: createValidFrom,
        ...(createLabel.trim() ? { label: createLabel.trim() } : {}),
      });
      showSuccess('VAT rate created');
      setCreateRate('');
      setCreateLabel('');
      setCreateValidFrom('');
      setShowCreateForm(false);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showDanger('Create failed', err instanceof Error ? err.message : 'Could not create VAT rate.');
    } finally {
      setIsCreating(false);
    }
  }, [createRate, createLabel, createValidFrom, showConfirm, showSuccess, showDanger]);

  // ── Close handler ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(async (rate: VatRate) => {
    const today = new Date().toISOString().split('T')[0];

    const confirmed = await showConfirm({
      title: 'Close VAT rate?',
      message: `This will set the end date of the ${rate.rate}% rate to today (${today}). This cannot be undone.`,
      confirmLabel: 'Close Rate',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    setClosingId(rate.id);
    try {
      await closeVatRate(rate.id, { validTo: today });
      showSuccess('VAT rate closed', `The ${rate.rate}% rate has been closed.`);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      showDanger('Close failed', err instanceof Error ? err.message : 'Could not close VAT rate.');
    } finally {
      setClosingId(null);
    }
  }, [showConfirm, showSuccess, showDanger]);

  // ── TopBar actions ────────────────────────────────────────────────────────────
  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [];

    if (isAdmin) {
      actions.push(
        buildIconTopBarAction({
          id: 'add-vat-rate',
          label: showCreateForm ? 'Cancel adding rate' : 'Add VAT rate',
          onPress: () => setShowCreateForm((v) => !v),
          icon: AddIcon,
          disabled: isCreating,
        })
      );
    }

    return actions;
  }, [isAdmin, showCreateForm, isCreating]);

  useScreenTopBar({ title: 'VAT Rates', actions: topBarActions });

  // Feature flag guard — redirect to dashboard if disabled
  if (!featureFlags.vatRatesPage) {
    return <Redirect href="/(app)/dashboard" />;
  }

  if (!isAdminOrManager) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />
          ) : undefined
        }>

        {/* ── Current rate card ── */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Current Rate</Text>
          {isLoadingCurrent ? (
            <LoadingSpinner message="Loading current rate..." />
          ) : currentError ? (
            <Text style={styles.error}>{currentError}</Text>
          ) : currentRate ? (
            <VatRateRow
              rate={currentRate}
              isCurrent
              isAdmin={isAdmin}
              isClosing={closingId === currentRate.id}
              onClose={() => handleClose(currentRate)}
            />
          ) : (
            <Text style={styles.muted}>No active VAT rate set.</Text>
          )}
        </ThemedCard>

        {/* ── Create form (Admin only) ── */}
        {isAdmin && showCreateForm ? (
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>New VAT Rate</Text>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Rate (%)</Text>
              <ThemedInput
                value={createRate}
                onChangeText={setCreateRate}
                placeholder="e.g. 20"
                keyboardType="decimal-pad"
                editable={!isCreating}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Label (optional)</Text>
              <ThemedInput
                value={createLabel}
                onChangeText={setCreateLabel}
                placeholder="e.g. Standard UK"
                editable={!isCreating}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Effective from (YYYY-MM-DD)</Text>
              <ThemedInput
                value={createValidFrom}
                onChangeText={setCreateValidFrom}
                placeholder="e.g. 2025-01-01"
                editable={!isCreating}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.formActions}>
              <ThemedButton
                label={isCreating ? 'Creating…' : 'Create Rate'}
                onPress={handleCreate}
                disabled={isCreating || !createRate || !createValidFrom}
                style={styles.actionButton}
              />
              <ThemedButton
                label="Cancel"
                onPress={() => setShowCreateForm(false)}
                variant="secondary"
                disabled={isCreating}
                style={styles.actionButton}
              />
            </View>
          </ThemedCard>
        ) : null}

        {/* ── All rates list ── */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Rate History</Text>
          {isLoadingList ? (
            <LoadingSpinner message="Loading rate history..." />
          ) : listError ? (
            <Text style={styles.error}>{listError}</Text>
          ) : rates.length === 0 ? (
            <Text style={styles.muted}>No VAT rates found.</Text>
          ) : (
            rates.map((rate) => (
              <VatRateRow
                key={rate.id}
                rate={rate}
                isCurrent={currentRate?.id === rate.id}
                isAdmin={isAdmin}
                isClosing={closingId === rate.id}
                onClose={() => handleClose(rate)}
              />
            ))
          )}
        </ThemedCard>

      </ScrollView>
    </ScreenContent>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────

function VatRateRow({
  rate,
  isCurrent,
  isAdmin,
  isClosing,
  onClose,
}: {
  rate: VatRate;
  isCurrent: boolean;
  isAdmin: boolean;
  isClosing: boolean;
  onClose: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const isClosed = Boolean(rate.validTo);

  return (
    <View style={styles.rateRow}>
      <View style={styles.rateRowMain}>
        <View style={styles.rateRowHeader}>
          <Text style={styles.rateValue}>{rate.rate}%</Text>
          {isCurrent ? <Text style={styles.currentBadge}>Current</Text> : null}
          {isClosed ? <Text style={styles.closedBadge}>Closed</Text> : null}
        </View>
        {rate.label ? <Text style={styles.rateLabel}>{rate.label}</Text> : null}
        <Text style={styles.rateDates}>
          {`From: ${formatDate(rate.validFrom)}`}
          {rate.validTo ? `  ·  To: ${formatDate(rate.validTo)}` : '  ·  Open-ended'}
        </Text>
      </View>
      {isAdmin && !isClosed ? (
        <ThemedButton
          label={isClosing ? 'Closing…' : 'Close'}
          onPress={onClose}
          variant="secondary"
          disabled={isClosing}
          tooltip="Set end date on this rate"
          style={styles.closeButton}
        />
      ) : null}
    </View>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
    },
    card: common.card,
    formField: {
      marginTop: theme.spacing.md,
    },
    fieldLabel: common.fieldLabel,
    formActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flexShrink: 1,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      gap: theme.spacing.sm,
    },
    rateRowMain: {
      flex: 1,
    },
    rateRowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    rateValue: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    currentBadge: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      color: theme.colors.accent,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      borderRadius: theme.radii.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
    },
    closedBadge: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      color: theme.colors.textMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
    },
    rateLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    rateDates: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    closeButton: {
      flexShrink: 0,
    },
  });
}
