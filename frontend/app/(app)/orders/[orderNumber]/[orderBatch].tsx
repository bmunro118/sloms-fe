import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import {
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  RefreshCw,
  RotateCcw as ResetIcon,
  Save as SaveIcon,
} from 'lucide-react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { downloadAndShareBreakdownPdfNative } from '@src/features/orders/breakdown-download';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { dispatchOrder, getOrder, getOrderBreakdownPdf, updateOrder, voidOrder } from '@src/features/orders/api';
import { ENDPOINTS } from '@utils/config';
import { OrderDetails, OrderEditForm, OrderUpdatePayload, toOrderEditForm } from '@src/features/orders/types';
import { OrderDetailCard } from '@src/features/orders/components/OrderDetailCard';
import { OrderItemsSection } from '@src/features/orders/components/OrderItemsSection';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string; mode?: string; dispatch?: string }>();
  const { canMutate } = useAuth();
  const router = useRouter();
  const { showConfirm, showDanger, showInfo, showSuccess } = useAppModal();
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
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);
  const [hasHandledRouteDispatch, setHasHandledRouteDispatch] = useState(false);
  const [itemsRefreshSignal, setItemsRefreshSignal] = useState(0);
  const isEditingRef = useRef(false);

  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  const canUpdate = (signal?: AbortSignal) => isMountedRef.current && !signal?.aborted;

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!canUpdate(signal)) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderNumber, orderBatch, { signal });
      if (canUpdate(signal)) {
        setOrder(response);
        if (!isEditingRef.current) setFormData(toOrderEditForm(response));
      }
    } catch (err) {
      if (canUpdate(signal)) setError(err instanceof Error ? err.message : 'Failed to load order.');
    } finally {
      if (canUpdate(signal)) setIsLoading(false);
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
    return () => { controller.abort(); };
  }, [orderBatch, orderNumber, reload]);

  const performSave = async () => {
    if (!canMutate || isSaving) return;
    const deliveryAddressRaw = formData.deliveryAddress.trim();
    const hasDeliveryAddress = deliveryAddressRaw.length > 0;
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
        showSuccess('Order updated', `Order ${orderNumber}/${orderBatch} was updated successfully.`);
      }
    } catch (err) {
      if (isMountedRef.current) setError(err instanceof Error ? err.message : 'Failed to save order changes.');
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    const confirmed = await showConfirm({
      title: 'Save order changes?',
      message: `This will update order ${orderNumber}/${orderBatch} with your current edits.`,
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });
    if (!confirmed) return;
    await performSave();
  };

  const handleConfirmReset = async () => {
    if (isSaving || !order) return;
    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values restored from the latest saved order.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    setFormData(toOrderEditForm(order));
  };

  const handleCancelOrderEdit = useCallback(() => {
    setIsEditing(false);
    if (order) setFormData(toOrderEditForm(order));
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
      if (isMountedRef.current) setError(err instanceof Error ? err.message : 'Failed to dispatch order.');
    } finally {
      if (isMountedRef.current) setIsDispatching(false);
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
    if (!canMutate) return;
    const confirmed = await showConfirm({
      title: 'Void this order?',
      message: `Order ${orderNumber}/${orderBatch} will be marked as voided. Continue?`,
      confirmLabel: 'Void order',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      await voidOrder(orderNumber, orderBatch);
      showSuccess('Order voided', `Order ${orderNumber}/${orderBatch} was voided.`);
      router.replace('/(app)/orders');
    } catch (err) {
      showDanger('Unable to void order', err instanceof Error ? err.message : 'Void order request failed.');
    }
  }, [canMutate, orderBatch, orderNumber, router, showConfirm, showDanger, showSuccess]);

  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit || !order) return;
    setFormData(toOrderEditForm(order));
    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, order, routeWantsEdit]);

  useEffect(() => {
    if (!routeWantsDispatch || hasHandledRouteDispatch) return;
    if (isLoading || !order || isDispatching) return;
    if (order.status?.trim().toLowerCase() === 'dispatched') {
      setHasHandledRouteDispatch(true);
      return;
    }
    setHasHandledRouteDispatch(true);
    void handleDispatch();
  }, [handleDispatch, hasHandledRouteDispatch, isDispatching, isLoading, order, routeWantsDispatch]);

  const orderCardActions = useMemo<TopBarAction[]>(() => {
    if (!canMutate || !order) return [];
    if (isEditing) {
      return [
        buildIconTopBarAction({ id: 'save-order', label: isSaving ? 'Saving...' : 'Save changes', accessibilityLabel: isSaving ? 'Saving order changes' : undefined, onPress: () => { void handleConfirmSave(); }, icon: SaveIcon, disabled: isSaving }),
        buildIconTopBarAction({ id: 'reset-order-form', label: 'Reset changes', onPress: () => { void handleConfirmReset(); }, icon: ResetIcon, disabled: isSaving || !order }),
        buildIconTopBarAction({ id: 'cancel-order-edit', label: 'Cancel edit', onPress: handleCancelOrderEdit, icon: CancelEditIcon, disabled: isSaving }),
      ];
    }
    return [
      buildIconTopBarAction({ id: 'edit-order', label: 'Edit order', onPress: () => setIsEditing(true), icon: EditIcon, disabled: isLoading || isSaving }),
    ];
  }, [canMutate, handleCancelOrderEdit, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, order]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const backAction = buildBackTopBarAction({ onPress: () => router.back(), label: 'Back to orders' });
    return [
      buildIconTopBarAction({
        id: 'refresh-order-details',
        label: 'Refresh order',
        onPress: () => { void reload(); setItemsRefreshSignal((n) => n + 1); },
        icon: RefreshCw,
        disabled: isLoading,
      }),
      buildIconTopBarAction({ id: 'view-order-tracking', label: 'View tracking', onPress: handleOpenTracking, icon: HistoryIcon, disabled: isLoading || !order }),
      buildIconTopBarAction({ id: 'download-order-breakdown', label: 'Download breakdown', onPress: () => { void handleDownloadBreakdown(); }, icon: DownloadIcon, disabled: isLoading || !order }),
      buildIconTopBarAction({ id: 'void-order', label: 'Void order', onPress: () => { void handleVoidOrder(); }, icon: ArchiveIcon, disabled: isLoading || !order || !canMutate }),
      backAction,
    ];
  }, [canMutate, handleDownloadBreakdown, handleOpenTracking, handleVoidOrder, isLoading, order, reload, router]);

  useScreenTopBar({ title: 'Order Detail', actions: topBarActions });

  return (
    <ScreenContent gap={10}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.meta}>Order: {orderNumber} / Batch: {orderBatch}</Text>
        {isLoading ? <Text style={styles.muted}>Loading...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading ? (
          <OrderDetailCard
            order={order}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            onFormChange={setFormData}
            cardActions={orderCardActions}
            isDispatching={isDispatching}
            canMutate={canMutate}
            onDispatch={() => { void handleDispatch(); }}
          />
        ) : null}
        <OrderItemsSection
          orderNumber={orderNumber}
          orderBatch={orderBatch}
          canMutate={canMutate}
          refreshSignal={itemsRefreshSignal}
        />
      </ScrollView>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    scrollContent: { gap: 10, paddingBottom: 8 },
  });
}
