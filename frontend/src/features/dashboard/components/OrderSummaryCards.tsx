import { View, Text, useWindowDimensions } from 'react-native';
import { Inbox, Wrench, PackageCheck, Truck } from 'lucide-react-native';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { tokens } from '@src/theme/tokens';
import { useAppTheme } from '@theme/ThemeProvider';
import { useOrderSummary } from '../hooks/useOrderSummary';
import { OrderSummaryCard } from './OrderSummaryCard';

export function OrderSummaryCards() {
  const { data, isLoading, error } = useOrderSummary();
  const { width } = useWindowDimensions();
  const theme = useAppTheme();
  const numColumns = width >= 480 ? 2 : 1;

  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: tokens.spacing.md,
    },
    errorText: {
      color: t.colors.danger,
      fontSize: 14,
    },
    cardWrapper: {
      width: numColumns === 1 ? '100%' : '48%',
    },
  }));

  const cardWidth = numColumns === 1 ? '100%' : '48%';

  const cardConfigs = [
    {
      key: 'received',
      label: 'Received',
      sublabel: 'Awaiting Production',
      icon: Inbox,
      accentColor: theme.colors.statusInProgressText,
      value: data.received,
    },
    {
      key: 'inProduction',
      label: 'In Production',
      sublabel: undefined,
      icon: Wrench,
      accentColor: theme.colors.accent,
      value: data.inProduction,
    },
    {
      key: 'ready',
      label: 'Ready',
      sublabel: 'Awaiting Dispatch',
      icon: PackageCheck,
      accentColor: theme.colors.statusCompleteText,
      value: data.ready,
    },
    {
      key: 'dispatched',
      label: 'Dispatched',
      sublabel: 'Last 48 hours',
      icon: Truck,
      accentColor: theme.colors.textMuted,
      value: data.recentlyDispatched,
    },
  ];

  return (
    <View>
      {error && !isLoading ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      <View style={styles.container}>
        {cardConfigs.map((card) => (
          <View key={card.key} style={{ width: cardWidth }}>
            <OrderSummaryCard
              label={card.label}
              sublabel={card.sublabel}
              value={isLoading ? null : card.value}
              icon={card.icon}
              accentColor={card.accentColor}
              isLoading={isLoading}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
