import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ThemedDatePicker } from '@components/ui/ThemedDatePicker';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { ThemedButton } from '@components/ui/ThemedButton';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { useAppTheme } from '@theme/ThemeProvider';
import { tokens } from '@src/theme/tokens';
import { StatBucket, StatGroupBy } from '../api';
import {
  BuilderPrefs,
  DEFAULT_BUILDER_PREFS,
  STATS_BUILDER_PREFS_KEY,
  bandClass,
  bucketRange,
  customerSelectionState,
  dateBucketMatches,
  parseBuilderPrefs,
  todayIso,
} from '../prefs';
import { useStatBuilder } from '../hooks/useStatBuilder';
import { useUserSetting } from '../hooks/useUserSetting';
import { useCustomerOptions } from '../hooks/useCustomerOptions';
import { StatKpiCards } from './StatKpiCards';

const GROUP_BY_OPTIONS: SelectOption<StatGroupBy>[] = [
  { value: 'model', label: 'Model' },
  { value: 'category', label: 'Category' },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function money(v: number): string {
  return `£${v.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "Stat Builder" — pick customers + dispatch-date range, group by model/category. */
export function StatBuilderPanel() {
  const { options: customers, isLoading: customersLoading } = useCustomerOptions();
  const { data, isLoading, error, run } = useStatBuilder();
  const theme = useAppTheme();

  // Persisted selection (customers, dates, group-by) — restored on next visit.
  const fallback = useMemo(() => DEFAULT_BUILDER_PREFS(), []);
  const { value: prefs, save } = useUserSetting<BuilderPrefs>(
    STATS_BUILDER_PREFS_KEY,
    fallback,
    parseBuilderPrefs,
  );
  const { customerIds, from, to, groupBy } = prefs;
  const selected = useMemo(() => new Set(customerIds), [customerIds]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const canRun = selected.size > 0 && ISO_DATE.test(from) && ISO_DATE.test(to);

  const setCustomerIds = (ids: number[]) => save({ ...prefs, customerIds: ids });
  const toggle = (id: number) =>
    setCustomerIds(
      selected.has(id) ? customerIds.filter((x) => x !== id) : [...customerIds, id],
    );

  // Quick-select (mirrors Access Select All / De-select All / Hospitals / Non-Hospitals).
  const selectAll = () => setCustomerIds(customers.map((c) => c.customerId));
  const clearAll = () => setCustomerIds([]);
  const selectByClass = (cls: 'hospital' | 'nonHospital') =>
    setCustomerIds(
      customers.filter((c) => bandClass(c.band) === cls).map((c) => c.customerId),
    );

  // Which quick-select group the current selection exactly matches (stays
  // highlighted until the user toggles a customer and it no longer holds).
  const selState = useMemo(
    () => customerSelectionState(customerIds, customers),
    [customerIds, customers],
  );

  // Date bucket shortcuts: set from/to to "this <period> to date".
  const applyBucket = (b: StatBucket) => {
    const r = bucketRange(b);
    save({ ...prefs, from: r.from, to: r.to });
  };
  const DATE_BUCKETS: { bucket: StatBucket; label: string }[] = [
    { bucket: 'year', label: 'Year' },
    { bucket: 'quarter', label: 'Quarter' },
    { bucket: 'month', label: 'Month' },
    { bucket: 'week', label: 'Week' },
  ];

  const onRun = () => {
    setValidationError(null);
    if (selected.size === 0) {
      setValidationError('Select at least one customer.');
      return;
    }
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
      setValidationError('Pick a valid From and To date.');
      return;
    }
    if (from > to) {
      setValidationError('"From" must be on or before "To".');
      return;
    }
    void run({ customerIds: [...selected], from, to, groupBy });
  };

  const styles = useThemedStyles((t) => ({
    sectionLabel: {
      fontSize: 12,
      color: t.colors.textMuted,
      marginBottom: 4,
      marginTop: tokens.spacing.sm,
    },
    quickRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.xs,
      marginBottom: tokens.spacing.xs,
    },
    quickBtn: {
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: tokens.radii.sm,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 6,
    },
    quickBtnText: { fontSize: 12, color: t.colors.textSecondary, fontWeight: '600' as const },
    selectedCount: { fontSize: 12, color: t.colors.textMuted },
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.xs,
    },
    chip: {
      borderWidth: 1,
      borderRadius: tokens.radii.sm,
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 6,
    },
    chipText: { fontSize: 13 },
    dateRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.sm,
    },
    dateField: { minWidth: 140, flexGrow: 1 },
    error: { color: t.colors.danger, fontSize: 14, marginTop: tokens.spacing.sm },
    runRow: { marginTop: tokens.spacing.md },
    table: { marginTop: tokens.spacing.lg },
    headerRow: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.borderStrong,
      paddingBottom: 6,
    },
    row: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
      paddingVertical: 6,
    },
    th: { fontSize: 12, fontWeight: '700' as const, color: t.colors.textSecondary },
    td: { fontSize: 13, color: t.colors.textPrimary },
    colDesc: { flex: 3, paddingRight: 8 },
    colNum: { flex: 1, textAlign: 'right' as const },
    empty: { color: t.colors.textMuted, fontSize: 14, marginTop: tokens.spacing.md },
  }));

  // A quick-select pill that stays highlighted while `active` holds true.
  const renderQuick = (
    key: string,
    label: string,
    onPress: () => void,
    active: boolean,
  ) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={[
        styles.quickBtn,
        active && {
          borderColor: theme.colors.accent,
          backgroundColor: theme.colors.accentMuted,
        },
      ]}
    >
      <Text style={[styles.quickBtnText, active && { color: theme.colors.accentText }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View>
      {/* Customer quick-select */}
      <Text style={styles.sectionLabel}>Customers</Text>
      <View style={styles.quickRow}>
        {renderQuick('all', 'Select all', selectAll, selState.all)}
        {renderQuick('none', 'Clear', clearAll, false)}
        {renderQuick('hosp', 'Hospitals', () => selectByClass('hospital'), selState.hospital)}
        {renderQuick(
          'nonhosp',
          'Non-Hospitals',
          () => selectByClass('nonHospital'),
          selState.nonHospital,
        )}
        <Text style={[styles.selectedCount, { alignSelf: 'center', marginLeft: 4 }]}>
          {selected.size} selected
        </Text>
      </View>

      {customersLoading ? (
        <LoadingSpinner size="small" />
      ) : (
        <ScrollView style={{ maxHeight: 160 }}>
          <View style={styles.chips}>
            {customers.map((c) => {
              const on = selected.has(c.customerId);
              return (
                <Pressable
                  key={c.customerId}
                  onPress={() => toggle(c.customerId)}
                  style={[
                    styles.chip,
                    {
                      borderColor: on ? theme.colors.accent : theme.colors.border,
                      backgroundColor: on
                        ? theme.colors.accentMuted
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: on ? theme.colors.accentText : theme.colors.textPrimary },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Date range shortcuts (Year / Quarter / Month / Week → this period to date) */}
      <Text style={styles.sectionLabel}>Date range</Text>
      <View style={styles.quickRow}>
        {DATE_BUCKETS.map(({ bucket, label }) =>
          renderQuick(
            `db-${bucket}`,
            label,
            () => applyBucket(bucket),
            dateBucketMatches(from, to, bucket),
          ),
        )}
      </View>

      {/* Date range + group by */}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.sectionLabel}>From</Text>
          <ThemedDatePicker
            value={from}
            onChange={(v) => save({ ...prefs, from: v })}
            max={to || todayIso()}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.sectionLabel}>To</Text>
          <ThemedDatePicker
            value={to}
            onChange={(v) => save({ ...prefs, to: v })}
            min={from}
            max={todayIso()}
          />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.sectionLabel}>Group by</Text>
          <ThemedSelect
            value={groupBy}
            options={GROUP_BY_OPTIONS}
            onChange={(v) => v && save({ ...prefs, groupBy: v })}
          />
        </View>
      </View>

      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.runRow}>
        <ThemedButton
          label={isLoading ? 'Running…' : 'Run query'}
          onPress={onRun}
          disabled={!canRun || isLoading}
        />
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={{ marginTop: tokens.spacing.lg }}>
          <LoadingSpinner />
        </View>
      ) : data ? (
        <View style={styles.table}>
          <StatKpiCards totals={data.totals} />

          <View style={[styles.headerRow, { marginTop: tokens.spacing.lg }]}>
            <Text style={[styles.th, styles.colDesc]}>
              {groupBy === 'category' ? 'Category' : 'Model / Description'}
            </Text>
            <Text style={[styles.th, styles.colNum]}>Qty</Text>
            <Text style={[styles.th, styles.colNum]}>Sales</Text>
          </View>
          {data.rows.length === 0 ? (
            <Text style={styles.empty}>No items dispatched in this range.</Text>
          ) : (
            data.rows.map((r, i) => (
              <View key={`${r.modelCode ?? r.category ?? 'row'}-${i}`} style={styles.row}>
                <Text style={[styles.td, styles.colDesc]}>
                  {groupBy === 'category'
                    ? r.category ?? '—'
                    : `${r.modelCode ?? '—'}${r.description ? ` · ${r.description}` : ''}`}
                </Text>
                <Text style={[styles.td, styles.colNum]}>{r.quantity}</Text>
                <Text style={[styles.td, styles.colNum]}>{money(r.sales)}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
