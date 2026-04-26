import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, PressableStateCallbackType, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  CheckSquare2,
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  Plus as AddIcon,
  RefreshCw,
  RotateCcw as ResetIcon,
  Save as SaveIcon,
  Send,
} from 'lucide-react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { TooltipPressable } from '@components/ui/TooltipPressable';
import { useAppTheme } from '@theme/ThemeProvider';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { OrderItemCard, OrderItemCardData } from '@src/features/orders/components/OrderItemCard';
import { downloadAndShareBreakdownPdfNative } from '@src/features/orders/breakdown-download';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import {
  addOrderItem,
  checkoutOrderItem,
  dispatchOrder,
  getOrder,
  getOrderBreakdownPdf,
  listOrderItems,
  uncheckedOutOrderItem,
  updateOrder,
  updateOrderItem,
  voidOrder,
  voidOrderItem,
} from '@src/features/orders/api';
import { ENDPOINTS } from '@utils/config';

type OrderDetails = {
  orderNumber: number;
  orderBatch: number;
  status?: string;
  customerAccount?: number;
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

type OrderUpdatePayload = {
  customerRef?: string;
  orderContact?: string;
  deliveryAddress?: number;
  priceBand?: string;
};

type OrderEditForm = {
  customerRef: string;
  orderContact: string;
  deliveryAddress: string;
  priceBand: string;
};

type OrderItemEditForm = {
  description: string;
  patientInitial: string;
  patientSurname: string;
  side: string;
  price: string;
};

function toOrderEditForm(order: OrderDetails | null): OrderEditForm {
  return {
    customerRef: order?.customerRef ?? '',
    orderContact: order?.orderContact ?? '',
    deliveryAddress: order?.deliveryAddress !== undefined ? String(order.deliveryAddress) : '',
    priceBand: order?.priceBand ?? '',
  };
}

function toItemEditForm(item: OrderItemCardData | null): OrderItemEditForm {
  return {
    description: typeof item?.description === 'string' ? item.description : '',
    patientInitial: typeof item?.patientInitial === 'string' ? item.patientInitial : '',
    patientSurname: typeof item?.patientSurname === 'string' ? item.patientSurname : '',
    side: typeof item?.side === 'string' ? item.side : '',
    price: typeof item?.price === 'number' ? String(item.price) : '',
  };
}

function isItemCheckedOut(item: OrderItemCardData): boolean {
  if (item.checkedOut === true || item.isCheckedOut === true) {
    return true;
  }

  if (typeof item.checkedOutAt === 'string' && item.checkedOutAt.trim()) {
    return true;
  }

  if (typeof item.status === 'string' && item.status.toLowerCase().includes('checked out')) {
    return true;
  }

  return false;
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string; mode?: string; dispatch?: string }>();
  const { canMutate } = useAuth();
  const theme = useAppTheme();
  const router = useRouter();
  const { showConfirm, showDanger, showInfo, showSuccess, showWarning } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);
  const routeWantsEdit = params.mode === 'edit';
  const routeWantsDispatch = params.dispatch === 'true';

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderEditForm>(toOrderEditForm(null));
  const [items, setItems] = useState<OrderItemCardData[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [isMutatingItems, setIsMutatingItems] = useState(false);
  const [newItemSerialNumber, setNewItemSerialNumber] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [editingItemSerial, setEditingItemSerial] = useState<string | null>(null);
  const [itemFormData, setItemFormData] = useState<OrderItemEditForm>(toItemEditForm(null));
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);
  const [hasHandledRouteDispatch, setHasHandledRouteDispatch] = useState(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const canUpdate = (signal?: AbortSignal) => isMountedRef.current && !signal?.aborted;

  const loadItems = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      return;
    }

    setIsLoadingItems(true);
    setItemError(null);

    try {
      const response = await listOrderItems<OrderItemCardData>(
        orderNumber,
        orderBatch,
        undefined,
        { signal }
      );
      const nextItems = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      if (canUpdate(signal)) {
        setItems(nextItems);
      }
    } catch (err) {
      if (canUpdate(signal)) {
        setItemError(err instanceof Error ? err.message : 'Failed to load order items.');
      }
    } finally {
      if (canUpdate(signal)) {
        setIsLoadingItems(false);
      }
    }
  }, [isMountedRef, orderBatch, orderNumber]);

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!canUpdate(signal)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderNumber, orderBatch, { signal });
      if (canUpdate(signal)) {
        setOrder(response);
        if (!isEditingRef.current) {
          setFormData(toOrderEditForm(response));
        }
      }
    } catch (err) {
      if (canUpdate(signal)) {
        setError(err instanceof Error ? err.message : 'Failed to load order.');
      }
    } finally {
      if (canUpdate(signal)) {
        setIsLoading(false);
      }
    }
  }, [isMountedRef, orderBatch, orderNumber]);

  useEffect(() => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setError('Invalid order route parameters.');
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    void reload(controller.signal);
    void loadItems(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadItems, orderBatch, orderNumber, reload]);

  const performSave = async () => {
    if (!canMutate || isSaving) {
      return;
    }

    const deliveryAddressRaw = formData.deliveryAddress.trim();
    const hasDeliveryAddress =
      deliveryAddressRaw.length > 0;
    const parsedDeliveryAddress = hasDeliveryAddress ? Number(deliveryAddressRaw) : undefined;

    if (hasDeliveryAddress && !Number.isFinite(parsedDeliveryAddress)) {
      setError('Delivery address must be numeric.');
      return;
    }

    const payload: OrderUpdatePayload = {
      customerRef: formData.customerRef?.trim() || undefined,
      orderContact: formData.orderContact?.trim() || undefined,
      deliveryAddress: parsedDeliveryAddress,
      priceBand: formData.priceBand?.trim() || undefined,
    };

    setIsSaving(true);
    setError(null);
    try {
      const response = await updateOrder(orderNumber, orderBatch, payload);

      if (isMountedRef.current) {
        setOrder(response);
        setFormData(toOrderEditForm(response));
        setIsEditing(false);
        showSuccess(
          'Order updated',
          `Order ${orderNumber}/${orderBatch} was updated successfully.`
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save order changes.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const handleConfirmSave = async () => {
    if (isSaving) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Save order changes?',
      message: `This will update order ${orderNumber}/${orderBatch} with your current edits.`,
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });

    if (!confirmed) {
      return;
    }

    await performSave();
  };

  const handleConfirmReset = async () => {
    if (isSaving || !order) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values restored from the latest saved order.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setFormData(toOrderEditForm(order));
  };

  const handleCancelOrderEdit = useCallback(() => {
    setIsEditing(false);
    if (order) {
      setFormData(toOrderEditForm(order));
    }
  }, [order]);

  const handleDispatch = useCallback(async () => {
    if (!canMutate) return;

    const confirmed = await showConfirm({
      title: 'Mark Order as Dispatched',
      message: `Are you sure you want to mark order ${orderNumber}/${orderBatch} as dispatched? This action cannot be undone.`,
      confirmLabel: 'Dispatch',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    setIsDispatching(true);
    setError(null);
    try {
      await dispatchOrder(orderNumber, orderBatch);
      await reload();
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to dispatch order.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsDispatching(false);
      }
    }
  }, [canMutate, isMountedRef, orderBatch, orderNumber, reload, showConfirm]);

  const handleOpenTracking = useCallback(() => {
    router.push(`/(app)/orders/${orderNumber}/${orderBatch}/tracking` as never);
  }, [orderBatch, orderNumber, router]);

  const handleDownloadBreakdown = useCallback(async () => {
    try {
      const fileName = `order-${orderNumber}-${orderBatch}-breakdown.pdf`;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const pdfBlob = await getOrderBreakdownPdf(orderNumber, orderBatch);
        const objectUrl = URL.createObjectURL(pdfBlob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);

        showSuccess('Breakdown downloaded', `Saved ${fileName}.`);
        return;
      }

      const nativeResult = await downloadAndShareBreakdownPdfNative(
        ENDPOINTS.orders.breakdown(orderNumber, orderBatch),
        fileName
      );

      if (nativeResult.shared) {
        showSuccess('Breakdown ready', 'Download complete and share sheet opened.');
      } else {
        showInfo('Breakdown downloaded', `Saved ${fileName} to ${nativeResult.fileUri}.`);
      }
    } catch (err) {
      showDanger('Unable to download breakdown', err instanceof Error ? err.message : 'Breakdown download failed.');
    }
  }, [orderBatch, orderNumber, showDanger, showInfo, showSuccess]);

  const handleVoidOrder = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Void this order?',
      message: `Order ${orderNumber}/${orderBatch} will be marked as voided. Continue?`,
      confirmLabel: 'Void order',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await voidOrder(orderNumber, orderBatch);
      showSuccess('Order voided', `Order ${orderNumber}/${orderBatch} was voided.`);
      router.replace('/(app)/orders');
    } catch (err) {
      showDanger('Unable to void order', err instanceof Error ? err.message : 'Void order request failed.');
    }
  }, [canMutate, orderBatch, orderNumber, router, showConfirm, showDanger, showSuccess]);

  const handleAddItem = useCallback(async () => {
    if (!canMutate || isMutatingItems) {
      return;
    }

    const serialNumber = newItemSerialNumber.trim();
    if (!serialNumber) {
      setItemError('Serial number is required to add an item.');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Add item to order?',
      message: `Item ${serialNumber} will be added to order ${orderNumber}/${orderBatch}.`,
      confirmLabel: 'Add item',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    setIsMutatingItems(true);
    setItemError(null);
    try {
      await addOrderItem(orderNumber, orderBatch, {
        serialNumber,
        description: newItemDescription.trim() || undefined,
      });
      setNewItemSerialNumber('');
      setNewItemDescription('');
      await loadItems();
      showSuccess('Item added', `Item ${serialNumber} was added to this order.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item.';
      setItemError(message);
      showDanger('Unable to add item', message);
    } finally {
      if (isMountedRef.current) {
        setIsMutatingItems(false);
      }
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
    if (!editingItemSerial || isMutatingItems) {
      return;
    }

    const trimmedPrice = itemFormData.price.trim();
    const parsedPrice = trimmedPrice ? Number(trimmedPrice) : undefined;
    if (trimmedPrice && !Number.isFinite(parsedPrice)) {
      setItemError('Price must be numeric.');
      return;
    }

    const confirmed = await showConfirm({
      title: 'Save item changes?',
      message: `Item ${editingItemSerial} will be updated with your edits.`,
      confirmLabel: 'Save item',
      cancelLabel: 'Keep editing',
    });

    if (!confirmed) {
      return;
    }

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
      if (isMountedRef.current) {
        setIsMutatingItems(false);
      }
    }
  }, [editingItemSerial, isMountedRef, isMutatingItems, itemFormData.description, itemFormData.patientInitial, itemFormData.patientSurname, itemFormData.price, itemFormData.side, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  const handleToggleCheckout = useCallback(async (item: OrderItemCardData, checkedOut: boolean) => {
    if (!canMutate || isMutatingItems) {
      return;
    }

    const actionLabel = checkedOut ? 'Undo checkout' : 'Mark checked out';
    const confirmed = await showConfirm({
      title: `${actionLabel}?`,
      message: `${actionLabel} for item ${item.serialNumber}.`,
      confirmLabel: actionLabel,
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

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
      if (isMountedRef.current) {
        setIsMutatingItems(false);
      }
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showSuccess]);

  const handleVoidItem = useCallback(async (item: OrderItemCardData) => {
    if (!canMutate || isMutatingItems) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Void this item?',
      message: `Item ${item.serialNumber} will be marked as voided. Continue?`,
      confirmLabel: 'Void item',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

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
      if (isMountedRef.current) {
        setIsMutatingItems(false);
      }
    }
  }, [canMutate, isMountedRef, isMutatingItems, loadItems, orderBatch, orderNumber, showConfirm, showDanger, showWarning]);

  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit) {
      return;
    }

    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, routeWantsEdit]);

  useEffect(() => {
    if (!routeWantsDispatch || hasHandledRouteDispatch) {
      return;
    }

    if (isLoading || !order || isDispatching) {
      return;
    }

    if (order.status?.trim().toLowerCase() === 'dispatched') {
      setHasHandledRouteDispatch(true);
      return;
    }

    setHasHandledRouteDispatch(true);
    void handleDispatch();
  }, [handleDispatch, hasHandledRouteDispatch, isDispatching, isLoading, order, routeWantsDispatch]);

  const orderCardActions = useMemo<TopBarAction[]>(() => {
    if (!canMutate || !order) {
      return [];
    }

    if (isEditing) {
      return [
        buildIconTopBarAction({
          id: 'save-order',
          label: isSaving ? 'Saving...' : 'Save changes',
          accessibilityLabel: isSaving ? 'Saving order changes' : undefined,
          onPress: () => {
            void handleConfirmSave();
          },
          icon: SaveIcon,
          disabled: isSaving,
        }),
        buildIconTopBarAction({
          id: 'reset-order-form',
          label: 'Reset changes',
          onPress: () => {
            void handleConfirmReset();
          },
          icon: ResetIcon,
          disabled: isSaving || !order,
        }),
        buildIconTopBarAction({
          id: 'cancel-order-edit',
          label: 'Cancel edit',
          onPress: handleCancelOrderEdit,
          icon: CancelEditIcon,
          disabled: isSaving,
        }),
      ];
    }

    return [
      buildIconTopBarAction({
        id: 'edit-order',
        label: 'Edit order',
        onPress: () => setIsEditing(true),
        icon: EditIcon,
        disabled: isLoading || isSaving,
      }),
    ];
  }, [canMutate, handleCancelOrderEdit, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, order]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const backAction = buildBackTopBarAction({
      onPress: () => router.back(),
      label: 'Back to orders',
    });

    return [
      buildIconTopBarAction({
        id: 'refresh-order-details',
        label: 'Refresh order',
        onPress: () => {
          void reload();
          void loadItems();
        },
        icon: RefreshCw,
        disabled: isLoading,
      }),
      buildIconTopBarAction({
        id: 'view-order-tracking',
        label: 'View tracking',
        onPress: () => {
          handleOpenTracking();
        },
        icon: HistoryIcon,
        disabled: isLoading || !order,
      }),
      buildIconTopBarAction({
        id: 'download-order-breakdown',
        label: 'Download breakdown',
        onPress: () => {
          void handleDownloadBreakdown();
        },
        icon: DownloadIcon,
        disabled: isLoading || !order,
      }),
      buildIconTopBarAction({
        id: 'void-order',
        label: 'Void order',
        onPress: () => {
          void handleVoidOrder();
        },
        icon: ArchiveIcon,
        disabled: isLoading || !order || !canMutate,
      }),
      backAction,
    ];
  }, [
    canMutate,
    handleDownloadBreakdown,
    handleOpenTracking,
    handleVoidOrder,
    isLoading,
    loadItems,
    order,
    reload,
    router,
  ]);

  useScreenTopBar({ title: 'Order Detail', actions: topBarActions });

  return (
    <ScreenContent gap={10}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.meta}>Order: {orderNumber} / Batch: {orderBatch}</Text>

        {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isLoading && order ? (
          <ThemedCard style={styles.card} actions={orderCardActions}>
            <Text style={styles.cardItem}>Status: {order.status ?? 'Unknown'}</Text>
            <Text style={styles.cardItem}>Customer: {order.customerAccount ?? 'N/A'}</Text>

            {isEditing ? (
              <>
                <Text style={styles.label}>Customer Ref</Text>
                <ThemedInput
                  placeholder="Customer ref"
                  value={formData.customerRef ?? ''}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, customerRef: text }))}
                  editable={!isSaving}
                />

                <Text style={styles.label}>Order Contact</Text>
                <ThemedInput
                  placeholder="Order contact"
                  value={formData.orderContact ?? ''}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, orderContact: text }))}
                  editable={!isSaving}
                />

                <Text style={styles.label}>Delivery Address</Text>
                <ThemedInput
                  placeholder="Delivery address"
                  keyboardType="number-pad"
                  value={formData.deliveryAddress}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, deliveryAddress: text }))}
                  editable={!isSaving}
                />

                <Text style={styles.label}>Price Band</Text>
                <ThemedInput
                  placeholder="Price band"
                  value={formData.priceBand ?? ''}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, priceBand: text }))}
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
        ) : null}

        {canMutate && !isEditing ? (
          <View style={styles.contentActionRowRight}>
            {order?.status === 'Dispatched' ? (
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
                onPress={handleDispatch}
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

        <ThemedCard style={styles.card} title="Ordered Items">
          {isLoadingItems ? <Text style={styles.muted}>Loading order items...</Text> : null}
          {itemError ? <Text style={styles.error}>{itemError}</Text> : null}

          {canMutate ? (
            <View style={styles.itemCreateContainer}>
              <Text style={styles.label}>Add New Item</Text>
              <ThemedInput
                placeholder="Serial number"
                value={newItemSerialNumber}
                onChangeText={setNewItemSerialNumber}
                editable={!isMutatingItems}
              />
              <ThemedInput
                placeholder="Description (optional)"
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                editable={!isMutatingItems}
              />
              <TooltipPressable
                tooltip={isMutatingItems ? 'Adding item' : 'Add item to order'}
                accessibilityRole="button"
                accessibilityLabel={isMutatingItems ? 'Adding item' : 'Add item to order'}
                disabled={isMutatingItems}
                onPress={() => {
                  void handleAddItem();
                }}
                style={(state) => [
                  styles.contentActionButton,
                  styles.itemAddButton,
                  isMutatingItems ? styles.contentActionButtonDisabled : null,
                  isHovered(state) && !isMutatingItems ? styles.contentActionButtonHover : null,
                  state.pressed && !isMutatingItems ? styles.contentActionButtonPressed : null,
                ]}
              >
                <AddIcon size={18} color={isMutatingItems ? theme.colors.textMuted : theme.colors.navTextStrong} />
                <Text style={[styles.contentActionButtonText, isMutatingItems ? styles.contentActionButtonTextDisabled : null]}>
                  {isMutatingItems ? 'Adding...' : 'Add item'}
                </Text>
              </TooltipPressable>
            </View>
          ) : null}

          {!isLoadingItems && items.length === 0 ? <Text style={styles.muted}>No items found for this order.</Text> : null}

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
              onSaveEdit={() => {
                void handleSaveItemEdit();
              }}
              onCancelEdit={handleCancelItemEdit}
              onToggleCheckout={handleToggleCheckout}
              onVoid={handleVoidItem}
            />
          ))}



        </ThemedCard>
      </ScrollView>
    </ScreenContent>
  );
}

function isHovered(state: PressableStateCallbackType) {
  return (state as PressableStateCallbackType & { hovered?: boolean }).hovered === true;
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      gap: 6,
    },
    label: {
      ...common.meta,
      marginTop: 8,
    },
    contentActionRowRight: {
      ...common.contentActionRowRight,
      marginTop: 4,
    },
    scrollContent: {
      gap: 10,
      paddingBottom: 8,
    },
    itemCreateContainer: {
      gap: 8,
      marginTop: 8,
      marginBottom: 10,
    },
    itemAddButton: {
      alignSelf: 'flex-end',
    },

  });
}
