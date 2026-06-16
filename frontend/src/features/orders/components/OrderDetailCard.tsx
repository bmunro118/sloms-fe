import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { SelectOption, ThemedSelect } from '@components/ui/ThemedSelect';
import { TopBarAction } from '@context/ScreenTitleContext';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderDetails, OrderEditForm, resolveOrderStatus } from '../types';

interface OrderDetailCardProps {
  order: OrderDetails | null;
  isEditing: boolean;
  isSaving: boolean;
  formData: OrderEditForm;
  onFormChange: (data: OrderEditForm) => void;
  cardActions: TopBarAction[];
  deliveryAddressOptions: SelectOption<number>[];
  isLoadingDeliveryAddresses: boolean;
}

export function OrderDetailCard({
  order,
  isEditing,
  isSaving,
  formData,
  onFormChange,
  cardActions,
  deliveryAddressOptions,
  isLoadingDeliveryAddresses,
}: OrderDetailCardProps) {
  const styles = useThemedStyles(createStyles);

  if (!order) return null;

  return (
    <ThemedCard style={styles.card} actions={cardActions}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Status</Text>
        <Text style={styles.fieldValue}>{resolveOrderStatus(order) ?? 'Unknown'}</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Customer</Text>
        <Text style={styles.fieldValue}>{order.customerAccount ?? 'N/A'}</Text>
      </View>

      {isEditing ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer Ref</Text>
            <ThemedInput
              placeholder="Customer ref"
              value={formData.customerRef ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, customerRef: text })}
              editable={!isSaving}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order Contact</Text>
            <ThemedInput
              placeholder="Order contact"
              value={formData.orderContact ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, orderContact: text })}
              editable={!isSaving}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <ThemedSelect<number>
              value={formData.deliveryAddress}
              options={deliveryAddressOptions}
              onChange={(value) => onFormChange({ ...formData, deliveryAddress: value })}
              placeholder={isLoadingDeliveryAddresses ? 'Loading addresses…' : 'Select delivery address…'}
              nullLabel="No delivery address"
              disabled={isSaving || isLoadingDeliveryAddresses}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price Band</Text>
            <ThemedInput
              placeholder="Price band"
              value={formData.priceBand ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, priceBand: text })}
              editable={!isSaving}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Customer Ref</Text>
            <Text style={styles.fieldValue}>{order.customerRef ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Order Contact</Text>
            <Text style={styles.fieldValue}>{order.orderContact ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <Text style={styles.fieldValue}>{order.deliveryAddress ?? 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price Band</Text>
            <Text style={styles.fieldValue}>{order.priceBand ?? 'N/A'}</Text>
          </View>
        </>
      )}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, gap: 6 },
    field: { marginTop: theme.spacing.md },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
