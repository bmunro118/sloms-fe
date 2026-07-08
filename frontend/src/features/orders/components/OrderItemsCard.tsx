import { PencilOff as CancelEditIcon, Pencil as EditIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { normaliseForDirtyCheck, useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { useAppTheme } from '@theme/ThemeProvider';
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
import { ItemsCard, AddItemCard, type PendingItem } from './ItemsCard';
import { PriceListItem, listPriceListItems } from '@src/features/price-list/api';
import { getCurrentVatRate, parseVatRate } from '@src/features/vat-rates/api';

interface OrderItemsCardProps {
  orderNumber: number;
  orderBatch: number;
  canMutate: boolean;
  refreshSignal?: number;
  priceBand?: string;
}

export function OrderItemsCard({
  orderNumber,
  orderBatch,
  canMutate,
  refreshSignal,
  priceBand = '',
}: OrderItemsCardProps) {
  const theme = useAppTheme();
  const isMountedRef = useIsMountedRef();
  const { showConfirm, showDanger, showSuccess, showWarning } = useAppModal();

  const [items, setItems] = useState<OrderItemCardData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [isMutatingItems, setIsMutatingItems] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingItemSerial, setEditingItemSerial] = useState<string | null>(null);
  const [itemFormData, setItemFormData] = useState<OrderItemEditValues>(toItemEditForm(null));
  const originalItemFormDataRef = useRef<OrderItemEditValues>(toItemEditForm(null));
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [vatRate, setVatRate] = useState<number>(20);
  const [isLoadingPriceList, setIsLoadingPriceList] = useState(false);

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) return;
    setIsLoadingItems(true);
    setItemError(null);
    try {
      const response = await listOrderItems<OrderItemCardData>(orderNumber, orderBatch, undefined, { signal });
      const nextItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.data) ? response.data : [];
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

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingPriceList(true);
    Promise.all([
      listPriceListItems(undefined, { signal: controller.signal }),
      getCurrentVatRate({ signal: controller.signal }),
    ])
      .then(([plResponse, vrResponse]) => {
        if (!controller.signal.aborted) {
          const plData = Array.isArray(plResponse) ? plResponse : plResponse.data ?? [];
          setPriceList(plData);
          setVatRate(parseVatRate(vrResponse.rate) ?? 20);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPriceList(false);
      });
    return () => controller.abort();
  }, []);

  const isItemFormDirty = editingItemSerial !== null && (
    JSON.stringify(normaliseForDirtyCheck(itemFormData)) !==
    JSON.stringify(normaliseForDirtyCheck(originalItemFormDataRef.current))
  );

  const { guardAction: guardCancelItem } = useUnsavedChangesGuard({
    isDirty: isItemFormDirty,
  });

  const handleAddItem = useCallback(async (item: PendingItem) => {
    if (!canMutate || isMutatingItems) return;
    const confirmed = await showConfirm({
      title: 'Add item to order?',
      message: `A new item will be added to order ${orderNumber}/${orderBatch}.`,
      confirmLabel: 'Add item',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;
    setIsMutatingItems(true);
    setItemError(null);
    try {
      const created = await addOrderItem<OrderItemCardData>(orderNumber, orderBatch, {
        serialNumber: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
      await loadItems();
      showSuccess(
        'Item added',
        created?.serialNumber
          ? `Item ${created.serialNumber} was added to this order.`
          : 'A new item was added to this order.',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      setItemError(message);
      showDanger('Unable to add item', message);
    } finally {
      if (isMountedRef.current) setIsMutatingItems(false);
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess, vatRate]);

  const handleBeginEditItem = useCallback((item: OrderItemCardData) => {
    const initial = toItemEditForm(item);
    originalItemFormDataRef.current = initial;
    setEditingItemSerial(item.serialNumber);
    setItemFormData(initial);
  }, []);

  const handleCancelItemEdit = useCallback(() => {
    void guardCancelItem(() => {
      setEditingItemSerial(null);
      setItemFormData(toItemEditForm(null));
    });
  }, [guardCancelItem]);

  const handleEditValueChange = useCallback((field: keyof OrderItemEditValues, value: string) => {
    setItemFormData((prev) => ({ ...prev, [field]: value }));
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
        side: itemFormData.side.trim() || undefined,
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

  const handleCancelSectionEdit = useCallback(() => {
    void guardCancelItem(() => {
      setIsEditingSection(false);
      setEditingItemSerial(null);
      setItemFormData(toItemEditForm(null));
    });
  }, [guardCancelItem]);

  const cardActions: TopBarAction[] = useMemo(() => {
    if (!canMutate) return [];
    if (isEditingSection) {
      return [
        buildIconTopBarAction({
          id: 'cancel-items-edit',
          label: 'Cancel edit',
          onPress: handleCancelSectionEdit,
          icon: CancelEditIcon,
          disabled: isMutatingItems,
        }),
      ];
    }
    return [
      buildIconTopBarAction({
        id: 'edit-items',
        label: 'Edit items',
        onPress: () => setIsEditingSection(true),
        icon: EditIcon,
        disabled: isMutatingItems,
      }),
    ];
  }, [canMutate, handleCancelSectionEdit, isEditingSection, isMutatingItems]);

  return (
    <ItemsCard
      mode={isEditingSection ? 'edit' : 'display'}
      title="Items"
      actions={cardActions}
      isLoading={isLoadingItems}
      emptyMessage="No items found for this order."
      addItemCard={isEditingSection ? (
        <AddItemCard
          priceList={priceList}
          vatRate={vatRate}
          priceBand={priceBand}
          isLoadingPriceList={isLoadingPriceList}
          isAddingItem={isMutatingItems}
          onAddItem={handleAddItem}
        />
      ) : null}
    >
      {itemError ? <Text style={{ color: theme.colors.danger, marginBottom: theme.spacing.sm }}>{itemError}</Text> : null}
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
          onEditValueChange={handleEditValueChange}
          onSaveEdit={handleSaveItemEdit}
          onCancelEdit={handleCancelItemEdit}
          onToggleCheckout={handleToggleCheckout}
          onVoid={handleVoidItem}
        />
      ))}
    </ItemsCard>
  );
}
