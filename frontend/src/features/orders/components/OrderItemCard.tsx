import {
  Ban as VoidIcon,
  CheckSquare2 as CheckedOutIcon,
  PencilOff as CancelEditIcon,
  Pencil as EditIcon,
  Save as SaveIcon,
  Square as MarkCheckoutIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface OrderItemCardData {
  serialNumber: string;
  description?: string;
  patientInitial?: string;
  patientSurname?: string;
  orientation?: string;
  side?: string;
  price?: number | string;
  void?: boolean;
  checkedOut?: boolean;
  checkoutDateStamp?: string;
  [key: string]: unknown;
}

export type OrderItemEditValues = {
  description: string;
  patientInitial: string;
  patientSurname: string;
  side: string;
  price: string;
};

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

function formatPatient(item: OrderItemCardData): string {
  const initial = typeof item.patientInitial === 'string' ? item.patientInitial.trim() : '';
  const surname = typeof item.patientSurname === 'string' ? item.patientSurname.trim() : '';

  if (!initial && !surname) {
    return 'N/A';
  }

  return [initial, surname].filter(Boolean).join(' ');
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
        icon: VoidIcon,
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

  return (
    <ThemedCard title={`Item ${item.serialNumber}`} actions={actions} style={styles.card}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Status</Text>
        <Text style={styles.fieldValue}>{item.void ? 'Voided' : isCheckedOut ? 'Checked out' : 'Active'}</Text>
      </View>

      {isEditing ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <ThemedInput
              placeholder="Description"
              value={resolvedEditValues.description}
              onChangeText={(text) => onEditValueChange?.('description', text)}
              editable={!isBusy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Patient Initial</Text>
            <ThemedInput
              placeholder="Patient initial"
              value={resolvedEditValues.patientInitial}
              onChangeText={(text) => onEditValueChange?.('patientInitial', text)}
              editable={!isBusy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Patient Surname</Text>
            <ThemedInput
              placeholder="Patient surname"
              value={resolvedEditValues.patientSurname}
              onChangeText={(text) => onEditValueChange?.('patientSurname', text)}
              editable={!isBusy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Side</Text>
            <ThemedInput
              placeholder="L or R"
              value={resolvedEditValues.side}
              onChangeText={(text) => onEditValueChange?.('side', text)}
              editable={!isBusy}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price</Text>
            <ThemedInput
              placeholder="Price"
              keyboardType="decimal-pad"
              value={resolvedEditValues.price}
              onChangeText={(text) => onEditValueChange?.('price', text)}
              editable={!isBusy}
            />
          </View>

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
            <Text style={styles.fieldValue}>{typeof item.orientation === 'string' && item.orientation.trim() ? item.orientation : (typeof item.side === 'string' && item.side.trim() ? item.side : 'N/A')}</Text>
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
  };
}
