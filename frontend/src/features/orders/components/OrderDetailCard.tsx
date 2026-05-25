import { CheckSquare2, Send } from 'lucide-react-native';
import { PressableStateCallbackType, StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { TopBarAction } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { OrderDetails, OrderEditForm } from '../types';

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
  onDispatch,
}: OrderDetailCardProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!order) return null;

  return (
    <>
      <ThemedCard style={styles.card} actions={cardActions}>
        <Text style={styles.cardItem}>Status: {order.status ?? 'Unknown'}</Text>
        <Text style={styles.cardItem}>Customer: {order.customerAccount ?? 'N/A'}</Text>

        {isEditing ? (
          <>
            <Text style={styles.label}>Customer Ref</Text>
            <ThemedInput
              placeholder="Customer ref"
              value={formData.customerRef ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, customerRef: text })}
              editable={!isSaving}
            />
            <Text style={styles.label}>Order Contact</Text>
            <ThemedInput
              placeholder="Order contact"
              value={formData.orderContact ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, orderContact: text })}
              editable={!isSaving}
            />
            <Text style={styles.label}>Delivery Address</Text>
            <ThemedInput
              placeholder="Delivery address"
              keyboardType="number-pad"
              value={formData.deliveryAddress}
              onChangeText={(text) => onFormChange({ ...formData, deliveryAddress: text })}
              editable={!isSaving}
            />
            <Text style={styles.label}>Price Band</Text>
            <ThemedInput
              placeholder="Price band"
              value={formData.priceBand ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, priceBand: text })}
              editable={!isSaving}
            />
          </>
        ) : (
          <>
            <Text style={styles.cardItem}>Ref: {order.customerRef ?? 'N/A'}</Text>
            <Text style={styles.cardItem}>Order Contact: {order.orderContact ?? 'N/A'}</Text>
            <Text style={styles.cardItem}>Delivery Address: {order.deliveryAddress ?? 'N/A'}</Text>
            <Text style={styles.cardItem}>Price Band: {order.priceBand ?? 'N/A'}</Text>
          </>
        )}
      </ThemedCard>

      {canMutate && !isEditing ? (
        <View style={styles.contentActionRowRight}>
          {order.status === 'Dispatched' ? (
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
    label: { ...common.meta, marginTop: 8 },
    contentActionRowRight: { ...common.contentActionRowRight, marginTop: 4 },
  });
}
