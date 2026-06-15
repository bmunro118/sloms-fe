import { CheckSquare2, Send } from 'lucide-react-native';
import { PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { SelectOption, ThemedSelect } from '@components/ui/ThemedSelect';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderDetails, OrderEditForm, resolveOrderStatus } from '../types';

function isHovered(state: PressableStateCallbackType) {
  return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
}

interface OrderDetailCardProps {
  order: OrderDetails | null;
  isEditing: boolean;
  isSaving: boolean;
  formData: OrderEditForm;
  onFormChange: (data: OrderEditForm) => void;
  cardActions: TopBarAction[];
  isDispatching: boolean;
  canMutate: boolean;
  deliveryAddressOptions: SelectOption<number>[];
  isLoadingDeliveryAddresses: boolean;
  onDispatch: () => void;
}

export function OrderDetailCard({
  order,
  isEditing,
  isSaving,
  formData,
  onFormChange,
  cardActions,
  isDispatching,
  canMutate,
  deliveryAddressOptions,
  isLoadingDeliveryAddresses,
  onDispatch,
}: OrderDetailCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!order) return null;

  return (
    <>
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

      {canMutate && !isEditing ? (
        <View style={styles.contentActionRowRight}>
          {resolveOrderStatus(order) === 'Dispatched' ? (
            <TooltipPressable
              tooltip="Order dispatched"
              accessibilityRole="button"
              accessibilityLabel="Order dispatched"
              disabled={true}
              style={[styles.contentActionButton, styles.contentActionButtonDisabled]}
            >
              <CheckSquare2 size={20} color={theme.colors.textMuted} />
              <Text style={[styles.contentActionButtonText, styles.contentActionButtonTextDisabled]}>
                Dispatched
              </Text>
            </TooltipPressable>
          ) : (
            <TooltipPressable
              tooltip={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
              accessibilityRole="button"
              accessibilityLabel={isDispatching ? 'Dispatching order' : 'Mark order as dispatched'}
              disabled={isDispatching}
              onPress={onDispatch}
              style={(state) => [
                styles.contentActionButton,
                isDispatching ? styles.contentActionButtonDisabled : null,
                isHovered(state) && !isDispatching ? styles.contentActionButtonHover : null,
                state.pressed && !isDispatching ? styles.contentActionButtonPressed : null,
              ]}
            >
              <Send size={20} color={isDispatching ? theme.colors.textMuted : theme.colors.navTextStrong} />
              <Text style={[styles.contentActionButtonText, isDispatching ? styles.contentActionButtonTextDisabled : null]}>
                {isDispatching ? 'Dispatching...' : 'Mark as dispatched'}
              </Text>
            </TooltipPressable>
          )}
        </View>
      ) : null}
    </>
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
    contentActionRowRight: { ...common.contentActionRowRight, marginTop: 4 },
  });
}
