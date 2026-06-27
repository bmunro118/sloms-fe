import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { tokens } from '@src/theme/tokens';
import {
  StatBucket,
  StatMetric,
  BUCKET_LABELS,
  METRIC_LABELS,
  formatMetric,
  metricValue,
} from '../api';
import { useTimeseries } from '../hooks/useTimeseries';
import { useCustomerOptions } from '../hooks/useCustomerOptions';
import { useUserSetting } from '../hooks/useUserSetting';
import {
  GraphPrefs,
  DEFAULT_GRAPH_PREFS,
  STATS_GRAPH_PREFS_KEY,
  parseGraphPrefs,
} from '../prefs';
import { BarChart, BarDatum } from './BarChart';

const BUCKET_OPTIONS: SelectOption<StatBucket>[] = (
  ['year', 'quarter', 'month', 'week'] as StatBucket[]
).map((b) => ({ value: b, label: BUCKET_LABELS[b] }));

const METRIC_OPTIONS: SelectOption<StatMetric>[] = (
  ['revenue', 'orders', 'items', 'avgPrice'] as StatMetric[]
).map((m) => ({ value: m, label: METRIC_LABELS[m] }));

/** "Revenue Graphs" — bucketed time-series with metric + optional customer filter. */
export function TimeseriesPanel() {
  // Persisted graph settings (bucket / metric / customer) — restored on revisit.
  const fallback = useMemo(() => DEFAULT_GRAPH_PREFS(), []);
  const { value: prefs, save } = useUserSetting<GraphPrefs>(
    STATS_GRAPH_PREFS_KEY,
    fallback,
    parseGraphPrefs,
  );
  const { bucket, metric, customerId } = prefs;
  const setBucket = (b: StatBucket) => save({ ...prefs, bucket: b });
  const setMetric = (m: StatMetric) => save({ ...prefs, metric: m });
  const setCustomerId = (id: number | null) => save({ ...prefs, customerId: id });

  const { options: customers } = useCustomerOptions();
  const customerOptions: SelectOption<number>[] = customers.map((c) => ({
    value: c.customerId,
    label: c.label,
  }));

  // Note: `metric` is intentionally NOT part of the fetch query. Each point
  // carries every measure, so switching metric is a pure client-side reselect.
  const query = useMemo(
    () => ({
      bucket,
      customerId: customerId != null ? [customerId] : undefined,
    }),
    [bucket, customerId],
  );
  const { data, isLoading, error } = useTimeseries(query);

  const chartData: BarDatum[] = (data?.series ?? []).map((p) => ({
    label: p.period,
    value: metricValue(p, metric),
  }));

  const styles = useThemedStyles((theme) => ({
    controls: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.sm,
      marginBottom: tokens.spacing.md,
    },
    control: { minWidth: 150, flexGrow: 1 },
    controlLabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    error: { color: theme.colors.danger, fontSize: 14 },
    range: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: tokens.spacing.sm,
    },
  }));

  return (
    <View>
      <View style={styles.controls}>
        <View style={styles.control}>
          <Text style={styles.controlLabel}>Bucket</Text>
          <ThemedSelect
            value={bucket}
            options={BUCKET_OPTIONS}
            onChange={(v) => v && setBucket(v)}
          />
        </View>
        <View style={styles.control}>
          <Text style={styles.controlLabel}>Metric</Text>
          <ThemedSelect
            value={metric}
            options={METRIC_OPTIONS}
            onChange={(v) => v && setMetric(v)}
          />
        </View>
        <View style={styles.control}>
          <Text style={styles.controlLabel}>Customer</Text>
          <ThemedSelect
            value={customerId}
            options={customerOptions}
            onChange={setCustomerId}
            placeholder="All customers"
            nullLabel="All customers"
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <BarChart
            data={chartData}
            formatValue={(v) => formatMetric(v, metric)}
          />
          {data ? (
            <Text style={styles.range}>
              {data.from} → {data.to} · {METRIC_LABELS[metric]} by{' '}
              {BUCKET_LABELS[bucket].toLowerCase()}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}
