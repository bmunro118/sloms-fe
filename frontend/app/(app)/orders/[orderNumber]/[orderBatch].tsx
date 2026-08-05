import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import {
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  ScanLine,
  Send,
} from 'lucide-react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { SelectOption } from '@components/ui/ThemedSelect';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction, goBackWithBrowserFallback } from '@src/features/app-shell';
import { Address, listAddresses } from '@src/features/customers/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useFeatureFlag } from '@src/hooks/useFeatureFlag';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useOrderDetailMutations } from '@src/features/orders/hooks/useOrderDetailMutations';
import { useOrderDetailScan } from '@src/features/orders/hooks/useOrderDetailScan';
import { OrderDetailRefreshProvider, useOrderDetailRefresh } from '@src/features/orders/hooks/useOrderDetailRefresh';
import { OrderScanSection } from '@src/features/orders/components/OrderScanSection';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { getOrder } from '@src/features/orders/api';
import {
  OrderDetails,
  OrderEditForm,
  resolveOrderStatus,
} from '@src/features/orders/types';
import { OrderDetailCard } from '@src/features/orders/components/OrderDetailCard';
import { OrderItemsCard } from '@src/features/orders/components/OrderItemsCard';
import { OrderHistoryCard } from '@src/features/orders/components/OrderHistoryCard';
import { OrderTrackingSummaryCard } from '@src/features/orders/components/OrderTrackingSummaryCard';
import { OrderSystemNotificationsCard } from '@src/features/orders/components/OrderSystemNotificationsCard';
import { useOrderCustomer } from '@src/features/orders/hooks/useOrderCustomer';
import { useOrderTracking } from '@src/features/orders/useOrderTracking';

function OrderDetailScreenContent() {
  const params = useLocalSearchParams<{ orderNumber: string; orderBatch: string; mode?: string; dispatch?: string }>();
  const { canMutate, isStaff } = useAuth();
  const scanLabelsEnabled = useFeatureFlag('scanLabels');
  const orderNumber = Number(params.orderNumber);
  const orderBatch = Number(params.orderBatch);

  const router = useRouter();
  const { showConfirm, showDanger, showInfo, showSuccess } = useAppModal();
  const navigation = useNavigation<NavigationProp<ReactNavigation.RootParamList>>();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const routeWantsEdit = params.mode === 'edit';
  const routeWantsDispatch = params.dispatch === 'true';
  
  // Refresh coordination (must be declared before any hook that uses it)
  const { trackingRefreshSignal, triggerTrackingRefresh } = useOrderDetailRefresh();

  const {
    isModalVisible,
    openScanner,
    closeScanner,
    manualText,
    setManualText,
    handleManualSubmit,
    step,
    capturedPhoto,
    correctionText,
    onPhotoTaken,
    onRetake,
    onCorrectionConfirm,
    extraction,
    isLoading: isScanning,
    error: scanError,
    handleConfirmExtraction,
    lastCreatedItem,
    refreshSignal,
    resetLastCreatedItem,
  } = useOrderDetailScan(orderNumber, orderBatch, triggerTrackingRefresh);
  
  // Order state
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Tracking data (extracted into dedicated hook)
  const {
    tracking,
    isLoadingTracking,
    trackingError,
    updates,
    trackingItems,
    currentStatus: trackingStatus,
    lastUpdateTimestamp,
    detectedProblems,
    updateFilterOptions,
    filteredTimelineEntries,
    selectedStatusFilter,
    setSelectedStatusFilter,
    expandedUpdateId,
    setExpandedUpdateId,
    isFilterOpen,
    setIsFilterOpen,
    selectedFilterLabel,
    loadTracking,
  } = useOrderTracking(orderNumber, orderBatch, trackingRefreshSignal);
  const { customerName, customerAccountNumber } = useOrderCustomer(order?.customerAccount);

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!isMountedRef.current || signal?.aborted) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getOrder(orderNumber, orderBatch, { signal });
      if (isMountedRef.current && !signal?.aborted) {
        setOrder(response);
      }
    } catch (err) {
      if (isMountedRef.current && !signal?.aborted) setError(err instanceof Error ? err.message : 'Failed to load order.');
    } finally {
      if (isMountedRef.current && !signal?.aborted) setIsLoading(false);
    }
  }, [isMountedRef, orderBatch, orderNumber]);

  const handleTrackingRefresh = useCallback(() => {
    triggerTrackingRefresh();
  }, [triggerTrackingRefresh]);

  const {
    isDispatching,
    isEditing,
    setIsEditing,
    isSaving,
    formData,
    setFormData,
    itemsRefreshSignal,
    setItemsRefreshSignal,
    isDirty,
    guardAction,
    handleConfirmSave,
    handleConfirmReset,
    handleDispatch,
    handleDownloadBreakdown,
    handleVoidOrder,
    handleCancelOrderEdit,
    orderCardActions,
  } = useOrderDetailMutations({
    orderNumber, orderBatch, order, canMutate, isMountedRef,
    routeWantsEdit, routeWantsDispatch, isLoading,
    navigation, router,
    showConfirm, showDanger, showSuccess, showInfo,
    reload,
    onTrackingRefresh: handleTrackingRefresh,
  });

  const combinedItemsRefreshSignal = itemsRefreshSignal + refreshSignal;

  const deliveryAddressOptions = useMemo<SelectOption<number>[]>(() =>
    deliveryAddresses.map((address, index) => {
      const line = address.delAddressLn1 ?? address.delPostCode ?? `Address ${index + 1}`;
      const city = address.delTownOrCity ? `, ${address.delTownOrCity}` : '';
      const defaultBadge = address.defaultAddress ? ' (Default)' : '';
      return { value: address.addressId, label: `${line}${city}${defaultBadge}` };
    }), [deliveryAddresses]);
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
        if (!controller.signal.aborted) { /* silent error handling for delivery addresses */ }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDeliveryAddresses(false);
      });
    return () => { controller.abort(); };
  }, [order?.customerAccount]);
  // Show success toast when a new item is created from label scan
  useEffect(() => {
    if (lastCreatedItem) {
      showSuccess('Item added', 'A new item was successfully added from the scanned label.');
      resetLastCreatedItem();
    }
  }, [lastCreatedItem, showSuccess, resetLastCreatedItem]);
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
    );

    if (scanLabelsEnabled && isStaff) {
      actions.push(
        buildIconTopBarAction({
          id: 'scan-labels',
          label: 'Scan Labels',
          onPress: openScanner,
          icon: ScanLine,
          disabled: isLoading || !order || isScanning,
        })
      );
    }

    actions.push(backAction);
    return actions;
  }, [canMutate, guardAction, handleDispatch, handleDownloadBreakdown, handleVoidOrder, isDispatching, isLoading, isScanning, isStaff, order, openScanner, scanLabelsEnabled]);

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

          {/* CARD 3: Order History (unified vertical timeline — history + pending steps) */}
          <OrderHistoryCard
            entries={filteredTimelineEntries}
            updateFilterOptions={updateFilterOptions}
            selectedStatusFilter={selectedStatusFilter}
            onFilterChange={(value) => { setSelectedStatusFilter(value); setIsFilterOpen(false); }}
            isFilterOpen={isFilterOpen}
            onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
            expandedUpdateId={expandedUpdateId}
            onToggleExpand={(id) => setExpandedUpdateId(id)}
            selectedFilterLabel={selectedFilterLabel}
            currentStatus={trackingStatus}
          />

          {/* CARD 5: Unified Items — tracking-style status badges + full management */}
          <OrderItemsCard
            orderNumber={orderNumber}
            orderBatch={orderBatch}
            canMutate={canMutate}
            refreshSignal={combinedItemsRefreshSignal}
            priceBand={order?.priceBand ?? ''}
            onTrackingRefresh={handleTrackingRefresh}
          />

        </ScrollView>
      ) : null}
      <OrderScanSection
        scanLabelsEnabled={scanLabelsEnabled}
        isModalVisible={isModalVisible}
        onClose={closeScanner}
        onLabelScanned={() => {}}
        manualText={manualText}
        setManualText={setManualText}
        handleManualSubmit={handleManualSubmit}
        step={step}
        capturedPhoto={capturedPhoto}
        correctionText={correctionText}
        onPhotoTaken={onPhotoTaken}
        onRetake={onRetake}
        onCorrectionConfirm={onCorrectionConfirm}
        extraction={extraction}
        isLoading={isScanning}
        error={scanError}
        onConfirmExtraction={handleConfirmExtraction}
      />
    </ScreenContent>
  );
}

export default function OrderDetailScreen() {
  return (
    <OrderDetailRefreshProvider>
      <OrderDetailScreenContent />
    </OrderDetailRefreshProvider>
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
