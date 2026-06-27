import { View, Text } from 'react-native';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { tokens } from '@src/theme/tokens';
import { BuilderResult } from '../api';

type Props = {
  totals: BuilderResult['totals'];
};

function money(v: number): string {
  return `£${v.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function num(v: number, dp = 0): string {
  return v.toLocaleString('en-GB', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

/** The five headline KPIs from the Access Stat Builder. */
export function StatKpiCards({ totals }: Props) {
  const cards = [
    { key: 'revenue', label: 'Revenue', value: money(totals.revenueTotal) },
    { key: 'orders', label: 'Orders', value: num(totals.orderCount) },
    { key: 'items', label: 'Items', value: num(totals.itemCount) },
    { key: 'avgPrice', label: 'Avg Price', value: money(totals.avgPrice) },
    { key: 'avgItems', label: 'Avg Items / Order', value: num(totals.avgItemsPerOrder, 2) },
  ];

  const styles = useThemedStyles((theme) => ({
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.sm,
    },
    card: {
      flexGrow: 1,
      flexBasis: 120,
      minWidth: 120,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: tokens.radii.md,
      padding: tokens.spacing.md,
      gap: 2,
    },
    value: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: theme.colors.textPrimary,
    },
    label: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  }));

  return (
    <View style={styles.row}>
      {cards.map((c) => (
        <View key={c.key} style={styles.card}>
          <Text style={styles.value}>{c.value}</Text>
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}
