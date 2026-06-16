import { Plus as AddIcon, Search as SearchIcon } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import {
  addOrderItem,
  checkoutOrderItem,
  listOrderItems,
  uncheckedOutOrderItem,
  updateOrderItem,
  voidOrderItem,
} from '../api';
import { isItemCheckedOut, toItemEditForm } from '../types';
import { OrderItemCard, OrderItemCardData, OrderItemEditValues } from './OrderItemCard';

interface OrderItemsSectionProps {
  orderNumber: number;
  orderBatch: number;
  canMutate: boolean;
  /** Increment to trigger an items reload from the parent screen. */
  refreshSignal?: number;
}

export function OrderItemsSection({
  orderNumber,
  orderBatch,
  canMutate,
  refreshSignal,
}: OrderItemsSectionProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const { showConfirm, showDanger, showSuccess, showWarning } = useAppModal();

  const [items, setItems] = useState<OrderItemCardData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [isMutatingItems, setIsMutatingItems] = useState(false);
  const [newItemSerialNumber, setNewItemSerialNumber] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItemSerial, setEditingItemSerial] = useState<string | null>(null);
  const [itemFormData, setItemFormData] = useState<OrderItemEditValues>(toItemEditForm(null));

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) return;
    setIsLoadingItems(true);
    setItemError(null);
    try {
      const response = await listOrderItems<OrderItemCardData>(orderNumber, orderBatch, undefined, { signal });
      const nextItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];
      if (isMountedRef.current && !signal?.aborted) setItems(nextItems);
    } catch (err) {
      if (isMountedRef.current && !signal?.aborted)
        setItemError(err instanceof Error ? err.message : 'Failed to load order items.');
    } finally {
      if (isMountedRef.current && !signal?.aborted) setIsLoadingItems(false);
    }
  }, [isMountedRef, orderBatch, orderNumber]);

  useEffect(() => {
    const controller = new AbortController();
    void loadItems(controller.signal);
    return () => { controller.abort(); };
  }, [loadItems, refreshSignal]);

  const handleAddItem = useCallback(async () => {
    if (!canMutate || isMutatingItems) return;
    const serialNumber = newItemSerialNumber.trim();
    if (!serialNumber) { setItemError('Serial number is required to add an item.'); return; }

    const confirmed = await showConfirm({
      title: 'Add item to order?',
      message: `Item ${serialNumber} will be added to order ${orderNumber}/${orderBatch}.`,
      confirmLabel: 'Add item',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setIsMutatingItems(true);
    setItemError(null);
    try {
      await addOrderItem(orderNumber, orderBatch, { serialNumber, description: newItemDescription.trim() || undefined });
      setNewItemSerialNumber('');
      setNewItemDescription('');
      await loadItems();
      showSuccess('Item added', `Item ${serialNumber} was added to this order.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      setItemError(message);
      showDanger('Unable to add item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, newItemDescription, newItemSerialNumber, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  const handleBeginEditItem = useCallback((item: OrderItemCardData) => {
    setEditingItemSerial(item.serialNumber);
    setItemFormData(toItemEditForm(item));
  }, []);

  const handleCancelItemEdit = useCallback(() => {
    setEditingItemSerial(null);
    setItemFormData(toItemEditForm(null));
  }, []);

  const handleSaveItemEdit = useCallback(async () => {
    if (!editingItemSerial || isMutatingItems) return;
    const trimmedPrice = itemFormData.price.trim();
    const parsedPrice = trimmedPrice ? Number(trimmedPrice) : undefined;
    if (trimmedPrice && !Number.isFinite(parsedPrice)) { setItemError('Price must be numeric.'); return; }

    const confirmed = await showConfirm({
      title: 'Save item changes?',
      message: `Item ${editingItemSerial} will be updated with your edits.`,
      confirmLabel: 'Save item',
      cancelLabel: 'Keep editing',
    });
    if (!confirmed) return;

    setIsMutatingItems(true);
    setItemError(null);
    try {
      await updateOrderItem(orderNumber, orderBatch, editingItemSerial, {
        description: itemFormData.description.trim() || undefined,
        patientInitial: itemFormData.patientInitial.trim() || undefined,
        patientSurname: itemFormData.patientSurname.trim() || undefined,
        orientation: itemFormData.side.trim() || undefined,
        price: parsedPrice,
      });
      setEditingItemSerial(null);
      setItemFormData(toItemEditForm(null));
      await loadItems();
      showSuccess('Item updated', `Item ${editingItemSerial} was updated.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item.';
      setItemError(message);
      showDanger('Unable to update item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [editingItemSerial, isMountedRef, isMutatingItems, itemFormData, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  const handleToggleCheckout = useCallback(async (item: OrderItemCardData, checkedOut: boolean) => {
    if (!canMutate || isMutatingItems) return;
    const actionLabel = checkedOut ? 'Undo checkout' : 'Mark checked out';
    const confirmed = await showConfirm({
      title: `${actionLabel}?`,
      message: `${actionLabel} for item ${item.serialNumber}.`,
      confirmLabel: actionLabel,
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setIsMutatingItems(true);
    setItemError(null);
    try {
      if (checkedOut) {
        await uncheckedOutOrderItem(orderNumber, orderBatch, item.serialNumber);
      } else {
        await checkoutOrderItem(orderNumber, orderBatch, item.serialNumber);
      }
      await loadItems();
      showSuccess('Item status updated', `Item ${item.serialNumber} was updated.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update checkout state.';
      setItemError(message);
      showDanger('Unable to update item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  const handleVoidItem = useCallback(async (item: OrderItemCardData) => {
    if (!canMutate || isMutatingItems) return;
    const confirmed = await showConfirm({
      title: 'Void this item?',
      message: `Item ${item.serialNumber} will be marked as voided. Continue?`,
      confirmLabel: 'Void item',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    setIsMutatingItems(true);
    setItemError(null);
    try {
      await voidOrderItem(orderNumber, orderBatch, item.serialNumber);
      await loadItems();
      showWarning('Item voided', `Item ${item.serialNumber} was voided.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to void item.';
      setItemError(message);
      showDanger('Unable to void item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showWarning]);

  return (
    <ThemedCard style={styles.card} title="Ordered Items">
      {isLoadingItems ? <LoadingSpinner message="Loading order items..." /> : null}
      {itemError ? <Text style={styles.error}>{itemError}</Text> : null}

      {canMutate ? (
        <View style={styles.itemCreateContainer}>
          <Text style={styles.label}>Add New Item</Text>
          <ThemedInput
            placeholder="Serial number"
            value={newItemSerialNumber}
            onChangeText={setNewItemSerialNumber}
            editable={!isMutatingItems}
            onSubmitEditing={() => { void handleAddItem(); }}
            rightAccessory={
              <ThemedButton
                variant="icon"
                icon={<SearchIcon size={18} color={isMutatingItems ? theme.colors.textMuted : theme.colors.navTextStrong} />}
                onPress={() => { void handleAddItem(); }}
                disabled={isMutatingItems}
                tooltip="Look up serial number"
                style={{ backgroundColor: 'transparent', borderWidth: 0 }}
              />
            }
          />
          <ThemedInput
            placeholder="Description (optional)"
            value={newItemDescription}
            onChangeText={setNewItemDescription}
            editable={!isMutatingItems}
          />
          <ThemedButton
            variant="outline"
            label={isMutatingItems ? 'Adding...' : 'Add item'}
            icon={<AddIcon size={16} color={isMutatingItems ? theme.colors.textMuted : theme.colors.navTextStrong} />}
            onPress={() => { void handleAddItem(); }}
            disabled={isMutatingItems}
            style={styles.itemAddButton}
            tooltip={isMutatingItems ? 'Adding item' : 'Add item to order'}
          />
        </View>
      ) : null}

      {!isLoadingItems && items.length === 0 ? (
        <Text style={styles.muted}>No items found for this order.</Text>
      ) : null}

      {items.map((item) => (
        <OrderItemCard
          key={item.serialNumber}
          item={item}
          canMutate={canMutate}
          isBusy={isMutatingItems}
          isCheckedOut={isItemCheckedOut(item)}
          isEditing={editingItemSerial === item.serialNumber}
          editValues={itemFormData}
          onEdit={handleBeginEditItem}
          onEditValueChange={(field, value) => {
            setItemFormData((previous) => ({ ...previous, [field]: value }));
          }}
          onSaveEdit={() => { void handleSaveItemEdit(); }}
          onCancelEdit={handleCancelItemEdit}
          onToggleCheckout={handleToggleCheckout}
          onVoid={handleVoidItem}
        />
      ))}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    error: common.error,
    muted: common.muted,
    label: { ...common.meta, marginTop: 8 },
    card: { ...common.card, gap: 6 },
    itemCreateContainer: { gap: 8, marginTop: 8, marginBottom: 10 },
    itemAddButton: { alignSelf: 'flex-end' },
  });
}
