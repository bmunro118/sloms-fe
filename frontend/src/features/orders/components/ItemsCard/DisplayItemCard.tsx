import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ban, CheckCircle2, Clock3 } from 'lucide-react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderItemCardData } from '../OrderItemCard';
import { isItemCheckedOut } from '@src/features/orders/types';

// ── Helpers ────────────────────────────────────────────────────────────────────────

function formatPatient(item: OrderItemCardData): string {
  const initial = typeof item.patientInitial === 'string' ? item.patientInitial.trim() : '';
  const surname = typeof item.patientSurname === 'string' ? item.patientSurname.trim() : '';
  if (!initial && !surname) return 'N/A';
  return [initial, surname].filter(Boolean).join(' ');
}

function deriveItemStatus(item: OrderItemCardData): 'Active' | 'CheckedOut' | 'Voided' {
  if (item.void) return 'Voided';
  if (isItemCheckedOut(item)) return 'CheckedOut';
  return 'Active';
}

// ── Props ───────────────────────────────────────────────────────────────────────────

export interface DisplayItemCardProps {
  item: OrderItemCardData;
}

// ── Styles ──────────────────────────────────────────────────────────────────────────

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      marginBottom: theme.spacing.sm,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusText: {
      fontWeight: '700',
      fontSize: 12,
    },
    badgeActive: {
      backgroundColor: theme.colors.statusReceived,
      borderColor: theme.colors.border,
    },
    badgeComplete: {
      backgroundColor: theme.colors.statusComplete,
      borderColor: theme.colors.accent,
    },
    badgeVoided: {
      backgroundColor: theme.colors.dangerSurface,
      borderColor: theme.colors.danger,
    },
    badgeTextActive: {
      color: theme.colors.statusReceivedText,
    },
    badgeTextComplete: {
      color: theme.colors.statusCompleteText,
    },
    badgeTextVoided: {
      color: theme.colors.danger,
    },
    field: {
      marginTop: theme.spacing.sm,
    },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────────────

export function DisplayItemCard({ item }: DisplayItemCardProps) {
  const styles = useThemedStyles(createStyles);

  // Status styling
  const statusBadgeStyle = useMemo(() => ({
    Active: styles.badgeActive,
    CheckedOut: styles.badgeComplete,
    Voided: styles.badgeVoided,
  }), [styles]);

  const statusTextStyle = useMemo(() => ({
    Active: styles.badgeTextActive,
    CheckedOut: styles.badgeTextComplete,
    Voided: styles.badgeTextVoided,
  }), [styles]);

  const statusLabel = useMemo(() => ({
    Active: 'Active',
    CheckedOut: 'Checked out',
    Voided: 'Voided',
  }), []);

  const derivedStatus = deriveItemStatus(item);
  const checkedOut = isItemCheckedOut(item);

  const statusIcon = useMemo(() => {
    switch (derivedStatus) {
      case 'CheckedOut': return CheckCircle2;
      case 'Voided': return Ban;
      default: return Clock3;
    }
  }, [derivedStatus]);

  const StatusIcon = statusIcon;

  return (
    <ThemedCard
      key={item.serialNumber}
      title={`Item ${item.serialNumber}`}
      style={styles.card}
    >
      {/* Status badge */}
      <View style={styles.itemHeader}>
        <View style={[styles.statusBadge, statusBadgeStyle[derivedStatus]]}>
          <StatusIcon size={14} color={statusTextStyle[derivedStatus].color} />
          <Text style={[styles.statusText, statusTextStyle[derivedStatus]]}>
            {statusLabel[derivedStatus]}
          </Text>
        </View>
      </View>

      {/* Item details */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Description</Text>
        <Text style={styles.fieldValue}>
          {typeof item.description === 'string' && item.description.trim() ? item.description : 'N/A'}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Patient</Text>
        <Text style={styles.fieldValue}>{formatPatient(item)}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Side</Text>
        <Text style={styles.fieldValue}>
          {typeof item.orientation === 'string' && item.orientation.trim()
            ? item.orientation
            : (typeof item.side === 'string' && item.side.trim() ? item.side : 'N/A')}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Price</Text>
        <Text style={styles.fieldValue}>
          {typeof item.price === 'number' ? `£${item.price.toFixed(2)}` : 'N/A'}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Checkout</Text>
        <Text style={styles.fieldValue}>{checkedOut ? 'Checked out' : 'Not checked out'}</Text>
      </View>
    </ThemedCard>
  );
}
