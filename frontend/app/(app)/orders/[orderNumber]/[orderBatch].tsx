import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Pencil as EditIcon,
  PencilOff as CancelEditIcon,
  RotateCcw as ResetIcon,
  Save as SaveIcon,
  Send,
} from 'lucide-react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedCard } from '@components/ui/ThemedCard';
import { SelectOption } from '@components/ui/ThemedSelect';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction, goBackWithBrowserFallback } from '@src/features/app-shell';
import { Address, listAddresses } from '@src/features/customers/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard, normaliseForDirtyCheck } from '@src/hooks/useUnsavedChangesGuard';
import { downloadAndShareBreakdownPdfNative } from '@src/features/orders/breakdown-download';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import {
  dispatchOrder,
  getOrder,
  getOrderBreakdownPdf,
  updateOrder,
  voidOrder,
} from '@src/features/orders/api';
import { ENDPOINTS } from '@utils/config';
import {
  OrderDetails,
  OrderEditForm,
  OrderUpdatePayload,
  resolveOrderStatus,
  toOrderEditForm,
} from '@src/features/orders/types';
import { OrderDetailCard } from '@src/features/orders/components/OrderDetailCard';
import { OrderItemsCard } from '@src/features/orders/components/OrderItemsCard';
import { OrderProgressTimeline } from '@src/features/orders/components/OrderProgressTimeline';
import { OrderTrackingSummaryCard } from '@src/features/orders/components/OrderTrackingSummaryCard';
import { OrderSystemNotificationsCard } from '@src/features/orders/components/OrderSystemNotificationsCard';
import { OrderUpdatesCard } from '@src/features/orders/components/OrderUpdatesCard';
import { useOrderCustomer } from '@src/features/orders/hooks/useOrderCustomer';
import { useOrderTracking } from '@src/features/orders/useOrderTracking';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string; mode?: string; dispatch?: string }>();
  const { canMutate, isStaff } = useAuth();
  const router = useRouter();
  const { showConfirm, showDanger, showInfo, showSuccess } = useAppModal();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);
  const routeWantsEdit = params.mode === 'edit';
  const routeWantsDispatch = params.dispatch === 'true';
  // Order state
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderEditForm>(toOrderEditForm(null));
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState(false);
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);
  const [hasHandledRouteDispatch, setHasHandledRouteDispatch] = useState(false);
  const [itemsRefreshSignal, setItemsRefreshSignal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isEditingRef = useRef(false);
  // Tracking data (extracted into dedicated hook)
  const {
    tracking,
    isLoadingTracking,
    trackingError,
    updates,
    trackingItems,
    currentStatus: trackingStatus,
    lastUpdateTimestamp,
    journeySteps,
    detectedProblems,
    updateFilterOptions,
    filteredUpdates,
    selectedStatusFilter,
    setSelectedStatusFilter,
    expandedUpdateId,
    setExpandedUpdateId,
    isFilterOpen,
    setIsFilterOpen,
    selectedFilterLabel,
    loadTracking,
  } = useOrderTracking(orderNumber, orderBatch);
  const { customerName, customerAccountNumber } = useOrderCustomer(order?.customerAccount);

  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  const deliveryAddressOptions = useMemo<SelectOption<number>[]>(() =>
    deliveryAddresses.map((address, index) => {
      const line = address.delAddressLn1 ?? address.delPostCode ?? `Address ${index + 1}`;
      const city = address.delTownOrCity ? `, ${address.delTownOrCity}` : '';
      const defaultBadge = address.defaultAddress ? ' (Default)' : '';
      return { value: address.addressId, label: `${line}${city}${defaultBadge}` };
    }), [deliveryAddresses]);
  // Data loading
  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!isMountedRef.current || signal?.aborted) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderNumber, orderBatch, { signal });
      if (isMountedRef.current && !signal?.aborted) {
        setOrder(response);
        if (!isEditingRef.current) setFormData(toOrderEditForm(response));
      }
    } catch (err) {
      if (isMountedRef.current && !signal?.aborted) setError(err instanceof Error ? err.message : 'Failed to load order.');
    } finally {
      if (isMountedRef.current && !signal?.aborted) setIsLoading(false);
    }
  }, [isMountedRef, orderBatch, orderNumber]);
  useEffect(() => {
    if (!Number.isFinite(orderNumber) || !Number.isFinite(orderBatch)) {
      setError('Invalid order route parameters.');
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    void reload(controller.signal); void loadTracking(controller.signal);
    return () => { controller.abort(); };
  }, [orderBatch, orderNumber, reload, loadTracking]);
  // Delivery addresses
  useEffect(() => {
    if (!order?.customerAccount) { setDeliveryAddresses([]); return; }
    const controller = new AbortController();
    setIsLoadingDeliveryAddresses(true);
    listAddresses(order.customerAccount, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setDeliveryAddresses(Array.isArray(response.data) ? response.data : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error('[OrderDetail] Failed to load customer delivery addresses:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDeliveryAddresses(false);
      });
    return () => { controller.abort(); };
  }, [order?.customerAccount]);
  // Save / reset / cancel
  const performSave = async () => {
    if (!canMutate || isSaving) return;
    const payload: OrderUpdatePayload = {
      customerRef: formData.customerRef?.trim() || undefined,
      orderContact: formData.orderContact?.trim() || undefined,
      deliveryAddress: formData.deliveryAddress ?? undefined,
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
  // Unsaved changes guard
  const isDirty = useMemo(
    () => isEditing && !!order && JSON.stringify(normaliseForDirtyCheck(formData)) !== JSON.stringify(normaliseForDirtyCheck(toOrderEditForm(order))),
    [isEditing, formData, order],
  );

  const { guardAction } = useUnsavedChangesGuard({ isDirty });

  const handleCancelOrderEdit = useCallback(() => {
    void guardAction(() => {
      setIsEditing(false);
      if (order) setFormData(toOrderEditForm(order));
    });
  }, [guardAction, order]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);
  // Dispatch / download / void
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
        const status = typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status : undefined;
        const code = typeof (err as { code?: unknown }).code === 'string'
          ? (err as { code: string }).code.toLowerCase() : '';
        if (status === 400 && (code.includes('delivery') || code.includes('address') || !order?.deliveryAddress)) {
          showDanger('Customer has no delivery address',
            'This order cannot be dispatched because no valid delivery address is selected. Add a customer delivery address, set it on the order, then try dispatch again.');
          return;
        }
        showDanger('Dispatch failed', err instanceof Error ? err.message : 'Failed to dispatch order. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setIsDispatching(false);
    }
  }, [canMutate, isMountedRef, order, orderBatch, orderNumber, reload, showConfirm, showDanger]);

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
        ENDPOINTS.orders.breakdown(orderNumber, orderBatch), fileName);
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

  // Route-driven actions
  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit || !order) return;
    setFormData(toOrderEditForm(order));
    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, order, routeWantsEdit]);

  useEffect(() => {
    if (!routeWantsDispatch || hasHandledRouteDispatch) return;
    if (isLoading || !order || isDispatching) return;
    if (resolveOrderStatus(order)?.trim().toLowerCase() === 'dispatched') {
      setHasHandledRouteDispatch(true);
      return;
    }
    setHasHandledRouteDispatch(true);
    void handleDispatch();
  }, [handleDispatch, hasHandledRouteDispatch, isDispatching, isLoading, order, routeWantsDispatch]);
  // Card-level actions (edit/save/cancel for OrderDetailCard)
  const orderCardActions = useMemo<TopBarAction[]>(() => {
    if (!canMutate || !order) return [];
    if (isEditing) {
      return [
        buildIconTopBarAction({ id: 'save-order', label: isSaving ? 'Saving...' : 'Save changes', onPress: () => { void handleConfirmSave(); }, icon: SaveIcon, disabled: isSaving }),
        buildIconTopBarAction({ id: 'reset-order-form', label: 'Reset changes', onPress: () => { void handleConfirmReset(); }, icon: ResetIcon, disabled: isSaving || !order }),
        buildIconTopBarAction({ id: 'cancel-order-edit', label: 'Cancel edit', onPress: handleCancelOrderEdit, icon: CancelEditIcon, disabled: isSaving }),
      ];
    }
    return [
      buildIconTopBarAction({ id: 'edit-order', label: 'Edit order', onPress: () => setIsEditing(true), icon: EditIcon, disabled: isLoading || isSaving }),
    ];
  }, [canMutate, handleCancelOrderEdit, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, order]);
  // TopBar actions
  const topBarActions = useMemo<TopBarAction[]>(() => {
    const backAction = buildBackTopBarAction({ onPress: () => void guardAction(goBackWithBrowserFallback), label: 'Back to orders' });
    const actions: TopBarAction[] = [];
    // Dispatch action
    if (canMutate && order) {
      const dispatched = resolveOrderStatus(order) === 'Dispatched';
      actions.push(buildIconTopBarAction({
        id: 'dispatch-order',
        label: dispatched ? 'Order dispatched' : (isDispatching ? 'Dispatching...' : 'Mark as dispatched'),
        onPress: () => { void handleDispatch(); },
        icon: Send,
        disabled: isDispatching || dispatched || isLoading || !order,
        primary: true,
      }));
    }
    actions.push(
      buildIconTopBarAction({ id: 'download-order-breakdown', label: 'Download breakdown', onPress: () => { void handleDownloadBreakdown(); }, icon: DownloadIcon, disabled: isLoading || !order }),
      buildIconTopBarAction({ id: 'void-order', label: 'Void order', onPress: () => { void handleVoidOrder(); }, icon: ArchiveIcon, disabled: isLoading || !order || !canMutate, secondary: true }),
      backAction,
    );
    return actions;
  }, [canMutate, guardAction, handleDispatch, handleDownloadBreakdown, handleVoidOrder, isDispatching, isLoading, order]);

  useScreenTopBar({ title: 'Order Detail', actions: topBarActions });

  // Render
  const isLoadingAny = isLoading || isLoadingTracking;
  const displayError = error ?? trackingError;

  return (
    <ScreenContent gap={10}>
      {isLoadingAny ? <LoadingSpinner message="Loading order..." fullScreen /> : null}
      {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

      {!isLoadingAny && !displayError ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl
                refreshing={isRefreshing && (isLoading || isLoadingTracking)}
                onRefresh={() => { void guardAction(async () => { setIsRefreshing(true); void reload(); void loadTracking(); setItemsRefreshSignal((n) => n + 1); }); }}
              />
            ) : undefined
          }>
          {/* CARD 1: Order Details — read-only summary (tracking + order data) or editable form */}
          {isEditing ? (
            <OrderDetailCard
              order={order}
              isEditing={true}
              isSaving={isSaving}
              formData={formData}
              onFormChange={setFormData}
              cardActions={orderCardActions}
              deliveryAddressOptions={deliveryAddressOptions}
              isLoadingDeliveryAddresses={isLoadingDeliveryAddresses}
              customerName={customerName}
              customerAccountNumber={customerAccountNumber}
            />
          ) : (
            <OrderTrackingSummaryCard
              order={order}
              tracking={tracking}
              currentStatus={trackingStatus}
              lastUpdateTimestamp={lastUpdateTimestamp}
              updatesCount={updates.length}
              itemsCount={trackingItems.length}
              isEditing={false}
              cardActions={orderCardActions}
              customerName={customerName}
              customerAccountNumber={customerAccountNumber}
              deliveryAddressOptions={deliveryAddressOptions}
            />
          )}

          {/* CARD 2: System Notifications (staff only) */}
          <OrderSystemNotificationsCard
            detectedProblems={detectedProblems}
            isStaff={isStaff}
          />

          {/* CARD 3: Order Progress (timeline rail from tracking) */}
          <ThemedCard style={styles.card} title="Order Progress">
            <OrderProgressTimeline steps={journeySteps} />
          </ThemedCard>

          {/* CARD 4: Updates (filterable status timeline from tracking) */}
          <OrderUpdatesCard
            updates={filteredUpdates}
            updateFilterOptions={updateFilterOptions}
            selectedStatusFilter={selectedStatusFilter}
            onFilterChange={(value) => { setSelectedStatusFilter(value); setIsFilterOpen(false); }}
            isFilterOpen={isFilterOpen}
            onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
            expandedUpdateId={expandedUpdateId}
            onToggleExpand={(id) => setExpandedUpdateId(id)}
            selectedFilterLabel={selectedFilterLabel}
          />

          {/* CARD 5: Unified Items — tracking-style status badges + full management */}
          <OrderItemsCard
            orderNumber={orderNumber}
            orderBatch={orderBatch}
            canMutate={canMutate}
            refreshSignal={itemsRefreshSignal}
            priceBand={order?.priceBand ?? ''}
          />

        </ScrollView>
      ) : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    scrollContent: { gap: 10, paddingBottom: 8 },
    card: { ...common.card, gap: 8 },
  });
}
