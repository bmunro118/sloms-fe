import {
  Ban,
  CheckCircle2,
  CheckSquare2 as CheckedOutIcon,
  Clock3,
  PencilOff as CancelEditIcon,
  Pencil as EditIcon,
  Save as SaveIcon,
  Square as MarkCheckoutIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { ItemEditForm, OrderItemEditValues } from './ItemsCard/ItemEditForm';

export type { OrderItemEditValues } from './ItemsCard/ItemEditForm';

export interface OrderItemCardData {
  serialNumber: string;
  description?: string;
  patientInitial?: string;
  patientSurname?: string;
  side?: string;
  price?: number | string;
  void?: boolean;
  checkedOut?: boolean;
  checkoutDateStamp?: string;
  [key: string]: unknown;
}

interface OrderItemCardProps {
  item: OrderItemCardData;
  canMutate: boolean;
  isBusy?: boolean;
  isCheckedOut: boolean;
  isEditing?: boolean;
  editValues?: OrderItemEditValues;
  onEdit: (item: OrderItemCardData) => void;
  onEditValueChange?: (field: keyof OrderItemEditValues, value: string) => void;
  onSaveEdit?: (item: OrderItemCardData) => void;
  onCancelEdit?: () => void;
  onToggleCheckout: (item: OrderItemCardData, checkedOut: boolean) => void;
  onVoid: (item: OrderItemCardData) => void;
}

function formatSide(side: unknown): string {
  if (side === 'L') return 'Left';
  if (side === 'R') return 'Right';
  return typeof side === 'string' && side.trim() ? side : 'N/A';
}

function formatPatient(item: OrderItemCardData): string {
  const initial = typeof item.patientInitial === 'string' ? item.patientInitial.trim() : '';
  const surname = typeof item.patientSurname === 'string' ? item.patientSurname.trim() : '';

  if (!initial && !surname) {
    return 'N/A';
  }

  return [initial, surname].filter(Boolean).join(' ');
}

function deriveItemStatus(item: OrderItemCardData, isCheckedOut: boolean): 'Active' | 'CheckedOut' | 'Voided' {
  if (item.void) return 'Voided';
  if (isCheckedOut) return 'CheckedOut';
  return 'Active';
}

export function OrderItemCard({
  item,
  canMutate,
  isBusy = false,
  isCheckedOut,
  isEditing = false,
  editValues,
  onEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onToggleCheckout,
  onVoid,
}: OrderItemCardProps) {
  const styles = useThemedStyles(createStyles);

  const resolvedEditValues: OrderItemEditValues = {
    description: editValues?.description ?? '',
    patientInitial: editValues?.patientInitial ?? '',
    patientSurname: editValues?.patientSurname ?? '',
    side: editValues?.side ?? '',
    price: editValues?.price ?? '',
  };

  const actions = useMemo<TopBarAction[]>(() => {
    if (!canMutate) {
      return [];
    }

    if (isEditing) {
      return [
        buildIconTopBarAction({
          id: `save-order-item-${item.serialNumber}`,
          label: isBusy ? 'Saving item' : 'Save item',
          onPress: () => onSaveEdit?.(item),
          icon: SaveIcon,
          disabled: isBusy,
        }),
        buildIconTopBarAction({
          id: `cancel-order-item-edit-${item.serialNumber}`,
          label: 'Cancel edit',
          onPress: () => onCancelEdit?.(),
          icon: CancelEditIcon,
          disabled: isBusy,
        }),
      ];
    }

    return [
      buildIconTopBarAction({
        id: `checkout-order-item-${item.serialNumber}`,
        label: isCheckedOut ? 'Undo checkout' : 'Mark checked out',
        onPress: () => onToggleCheckout(item, isCheckedOut),
        icon: isCheckedOut ? CheckedOutIcon : MarkCheckoutIcon,
        disabled: isBusy,
      }),
      buildIconTopBarAction({
        id: `void-order-item-${item.serialNumber}`,
        label: 'Void item',
        onPress: () => onVoid(item),
        icon: Ban,
        disabled: isBusy,
      }),
      buildIconTopBarAction({
        id: `edit-order-item-${item.serialNumber}`,
        label: 'Edit item',
        onPress: () => onEdit(item),
        icon: EditIcon,
        disabled: isBusy,
      }),
    ];
  }, [canMutate, isBusy, isCheckedOut, isEditing, item, onCancelEdit, onEdit, onSaveEdit, onToggleCheckout, onVoid]);

  const derivedStatus = deriveItemStatus(item, isCheckedOut);

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

  const statusIcon = useMemo(() => {
    switch (derivedStatus) {
      case 'CheckedOut': return CheckCircle2;
      case 'Voided': return Ban;
      default: return Clock3;
    }
  }, [derivedStatus]);

  const StatusIcon = statusIcon;

  return (
    <ThemedCard title={`Item ${item.serialNumber}`} actions={actions} style={styles.card}>
      <View style={styles.itemHeader}>
        <View style={[styles.statusBadge, statusBadgeStyle[derivedStatus]]}>
          <StatusIcon size={14} color={statusTextStyle[derivedStatus].color} />
          <Text style={[styles.statusText, statusTextStyle[derivedStatus]]}>
            {statusLabel[derivedStatus]}
          </Text>
        </View>
      </View>

      {isEditing ? (
        <>
          <ItemEditForm
            values={resolvedEditValues}
            isBusy={isBusy}
            onChange={(field, value) => onEditValueChange?.(field, value)}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Checkout</Text>
            <Text style={styles.fieldValue}>{isCheckedOut ? 'Checked out' : 'Not checked out'}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.fieldValue}>{typeof item.description === 'string' && item.description.trim() ? item.description : 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Patient</Text>
            <Text style={styles.fieldValue}>{formatPatient(item)}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Side</Text>
            <Text style={styles.fieldValue}>{formatSide(item.side)}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price</Text>
            <Text style={styles.fieldValue}>{typeof item.price === 'number' ? `£${item.price.toFixed(2)}` : 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Checkout</Text>
            <Text style={styles.fieldValue}>{isCheckedOut ? 'Checked out' : 'Not checked out'}</Text>
          </View>
        </>
      )}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    card: common.card,
    field: { marginTop: theme.spacing.md },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    itemHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: theme.spacing.sm,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statusText: {
      fontWeight: '700' as const,
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
  };
}
