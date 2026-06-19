import { View, Text } from 'react-native';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { tokens } from '@src/theme/tokens';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

export interface OrderSummaryCardProps {
  label: string;
  sublabel?: string;
  value: number | null;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accentColor: string;
  isLoading?: boolean;
}

export function OrderSummaryCard({
  label,
  sublabel,
  value,
  icon: Icon,
  accentColor,
  isLoading,
}: OrderSummaryCardProps) {
  const styles = useThemedStyles((theme) => ({
    wrapper: {
      borderRadius: tokens.radii.lg,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flex: 1,
      minWidth: 140,
    },
    accentStrip: {
      height: 4,
      backgroundColor: accentColor,
    },
    body: {
      padding: tokens.spacing.lg,
      gap: tokens.spacing.xs,
    },
    iconRow: {
      marginBottom: tokens.spacing.xs,
    },
    value: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: theme.colors.textPrimary,
      lineHeight: 38,
    },
    label: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600' as const,
    },
    sublabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    dash: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: theme.colors.textMuted,
      lineHeight: 38,
    },
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.accentStrip} />
      <View style={styles.body}>
        <View style={styles.iconRow}>
          <Icon size={28} color={accentColor} />
        </View>
        {isLoading ? (
          <LoadingSpinner size="small" />
        ) : value !== null ? (
          <Text style={styles.value}>{value}</Text>
        ) : (
          <Text style={styles.dash}>—</Text>
        )}
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}
