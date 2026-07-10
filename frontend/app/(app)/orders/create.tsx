import { Redirect, useRouter } from 'expo-router';
import { PackageCheck as CreateIcon, RotateCcw as ResetIcon, ScanLine } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect } from '@components/ui/ThemedSelect';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction, goBackWithBrowserFallback } from '@src/features/app-shell';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppModal } from '@src/hooks/useAppModal';
import { useFeatureFlag } from '@src/hooks/useFeatureFlag';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { usePriceBands } from '@features/price-list/hooks/usePriceBands';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createOrder, addOrderItem } from '@src/features/orders/api';
import { ApiError } from '@utils/api';
import {
  ItemsCard,
  AddItemCard,
  PendingItemCard,
  type PendingItem,
} from '@src/features/orders/components/ItemsCard';
import { usePendingItems } from '@src/features/orders/hooks/usePendingItems';
import { useCurrentVatRate } from '@src/features/orders/hooks/useCurrentVatRate';
import { useCreateOrderData } from '@src/features/orders/hooks/useCreateOrderData';
import { ScanLabelsModal, useScanLabel } from '@features/scan-labels';

export default function CreateOrderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showDanger, showWarning } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const scanLabelsEnabled = useFeatureFlag('scanLabels');
  const [customerAccount, setCustomerAccount] = useState<number | null>(null);
  const [customerRef, setCustomerRef] = useState('');
  const [orderContact, setOrderContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<number | null>(null);
  const [receivedOn, setReceivedOn] = useState('');
  const [priceBand, setPriceBand] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleLabelScanned = useCallback((label: string) => {
    // Handle scanned label - can be extended for actual label processing
  }, []);

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
  } = useScanLabel({ onLabelScanned: handleLabelScanned });
  const { pendingItems, isSaving, handleAddPendingItem, handleRemovePendingItem, handleUpdatePendingItem, handleResetPendingItems, setIsSaving } = usePendingItems();
  const { vatRate } = useCurrentVatRate();
  const {
    customerOptions,
    isLoadingCustomers,
    deliveryAddresses,
    deliveryAddressOptions,
    isLoadingDeliveryAddresses,
    priceList,
    isLoadingPriceList,
    selectedCustomer,
  } = useCreateOrderData(customerAccount);
  const { priceBands, isLoading: isLoadingPriceBands, error: priceBandsError } = usePriceBands();

  // Auto-populate price band when customer changes
  useEffect(() => {
    if (customerAccount !== null) {
      const band = selectedCustomer?.band;
      if (band) setPriceBand(band);
    } else {
      setPriceBand('');
    }
  }, [customerAccount, selectedCustomer]);

  // Pending items: using usePendingItems hook

  const isDirty = useMemo(
    () =>
      customerAccount !== null ||
      customerRef !== '' ||
      orderContact !== '' ||
      priceBand !== '' ||
      receivedOn !== '' ||
      deliveryAddress !== null ||
      pendingItems.length > 0,
    [customerAccount, customerRef, orderContact, priceBand, receivedOn, deliveryAddress, pendingItems.length],
  );

  const { guardAction, skipNextGuard } = useUnsavedChangesGuard({ isDirty });
  // Set default delivery address when the customer address list loads
  useEffect(() => {
    if (customerAccount === null) {
      setDeliveryAddress(null);
      return;
    }
    setDeliveryAddress((current) => {
      if (deliveryAddresses.some((address) => address.addressId === current)) {
        return current;
      }
      const defaultAddress = deliveryAddresses.find((address) => address.defaultAddress);
      return defaultAddress?.addressId ?? null;
    });
  }, [customerAccount, deliveryAddresses]);

  const performCreate = useCallback(async () => {
    if (!canMutate) {
      const msg = 'Your role does not allow creating orders.';
      setError(msg);
      showDanger('Permission denied', msg);
      return;
    }

    if (customerAccount === null) {
      const msg = 'Please select a customer account.';
      setError(msg);
      showDanger('Required field', msg);
      return;
    }

    if (pendingItems.length === 0) {
      const msg = 'Please add at least one line item.';
      setError(msg);
      showDanger('Required field', msg);
      return;
    }

    if (vatRate === null) {
      const msg = 'No active VAT rate is configured. Please set up a VAT rate before creating orders.';
      setError(msg);
      showDanger('VAT rate unavailable', msg);
      return;
    }

    const trimmedReceivedOn = receivedOn.trim();
    if (trimmedReceivedOn.length > 0 && Number.isNaN(Date.parse(trimmedReceivedOn))) {
      const msg = 'Received on must be a valid ISO date/time value.';
      setError(msg);
      showDanger('Invalid date', msg);
      return;
    }

    setIsCreatingOrder(true);
    setIsSaving(true);
    setError(null);
    try {
      const trimmedPriceBand = priceBand.trim();
      const trimmedCustomerRef = customerRef.trim();
      const trimmedOrderContact = orderContact.trim();
      const payload = {
        customerAccount,
        customerRef: trimmedCustomerRef || undefined,
        orderContact: trimmedOrderContact || undefined,
        deliveryAddress: deliveryAddress ?? undefined,
        receivedOn: trimmedReceivedOn || undefined,
        priceBand: trimmedPriceBand || undefined,
      };

      const result = await createOrder(payload);

      // Submit pending items sequentially
      const createdOrderNumber = result.orderNumber;
      const createdOrderBatch: number = result.orderBatch ?? 1;
      const failedItems: string[] = [];

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          try {
            await addOrderItem(createdOrderNumber, createdOrderBatch, {
              modelCode: item.itemId,
              description: item.description,
              price: item.unitPrice ?? 0,
              patientInitial: item.patientInitial,
              patientSurname: item.patientSurname,
              side: item.side,
            } as Parameters<typeof addOrderItem>[2]);
          } catch (itemErr) {
            failedItems.push(item.description || item.itemId);
          }
        }
      }

      // Show warning if any items failed
      if (failedItems.length > 0 && isMountedRef.current) {
        showWarning(
          'Order created - some items not added',
          `Order ${createdOrderNumber}/${createdOrderBatch} was created, but the following items could not be added: ${failedItems.join(', ')}. You can add them manually on the order detail screen.`
        );
      }

      skipNextGuard();
      router.replace(`/(app)/orders/${createdOrderNumber}/${createdOrderBatch}` as never);
    } catch (err) {
      if (isMountedRef.current) {
        const detail = err instanceof ApiError && err.code ? err.code : err instanceof Error ? err.message : 'Failed to create order. Please try again.';
        showDanger('Create Order Failed', detail);
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreatingOrder(false);
        setIsSaving(false);
      }
    }
  }, [
    canMutate,
    customerAccount,
    customerRef,
    deliveryAddress,
    isMountedRef,
    orderContact,
    pendingItems,
    priceBand,
    receivedOn,
    router,
    setIsSaving,
    showDanger,
    showWarning,
    skipNextGuard,
    vatRate,
  ]);


  const handleCreate = useCallback(async () => {
    if (isCreatingOrder || isSaving) {
      return;
    }

    const customerLabel = selectedCustomer
      ? selectedCustomer.accountNumber
        ? `${selectedCustomer.accountNumber} — ${selectedCustomer.companyName}`
        : selectedCustomer.companyName
      : `customer account ${customerAccount}`;

    const confirmed = await showConfirm({
      title: 'Create new order?',
      message: `A new order will be created for ${customerLabel}${pendingItems.length > 0 ? ` with ${pendingItems.length} line item(s)` : ''}.`,
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    await performCreate();
  }, [isCreatingOrder, isSaving, showConfirm, customerAccount, selectedCustomer, pendingItems.length, performCreate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildIconTopBarAction({
        id: 'submit-create-order',
        label: isCreatingOrder ? 'Creating order...' : 'Create order',
        accessibilityLabel: isCreatingOrder ? 'Creating order' : undefined,
        onPress: handleCreate,
        icon: CreateIcon,
        disabled: isCreatingOrder || isSaving || pendingItems.length === 0,
        primary: true,
      }),
      buildIconTopBarAction({
        id: 'reset-create-order-form',
        label: 'Reset form',
        onPress: () => {
          void guardAction(() => {
            setCustomerAccount(null);
            setCustomerRef('');
            setOrderContact('');
            setDeliveryAddress(null);
            setReceivedOn('');
            setPriceBand('');
            handleResetPendingItems();
            setError(null);
          });
        },
        icon: ResetIcon,
        disabled: isCreatingOrder || isSaving,
      }),
    ];

    if (scanLabelsEnabled) {
      actions.push(
        buildIconTopBarAction({
          id: 'scan-labels',
          label: 'Scan Labels',
          onPress: openScanner,
          icon: ScanLine,
          disabled: isCreatingOrder || isSaving,
        })
      );
    }

    actions.push(
      buildBackTopBarAction({
        onPress: () => void guardAction(goBackWithBrowserFallback),
      })
    );

    return actions;
  }, [handleCreate, handleResetPendingItems, isCreatingOrder, isSaving, guardAction, pendingItems.length, scanLabelsEnabled, openScanner]);

  useScreenTopBar({ title: 'Create Order', actions: topBarActions });

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent gap={10}>
      {isLoadingCustomers ? (
        <LoadingSpinner size="small" message="Loading customers..." />
      ) : (
        <ThemedSelect<number>
          value={customerAccount}
          options={customerOptions}
          onChange={setCustomerAccount}
          placeholder="Select customer account…"
          nullLabel="None"
          disabled={isSaving}
          style={styles.input}
        />
      )}
      <ThemedInput
        placeholder="Customer reference (optional)"
        style={styles.input}
        value={customerRef}
        onChangeText={setCustomerRef}
        editable={!isSaving}
      />
      <ThemedInput
        placeholder="Order contact (optional)"
        style={styles.input}
        value={orderContact}
        onChangeText={setOrderContact}
        editable={!isSaving}
      />
      {isLoadingDeliveryAddresses ? (
        <LoadingSpinner size="small" message="Loading delivery addresses..." />
      ) : (
        <ThemedSelect<number>
          value={deliveryAddress}
          options={deliveryAddressOptions}
          onChange={setDeliveryAddress}
          placeholder={customerAccount === null ? 'Select customer first…' : 'Select delivery address…'}
          nullLabel="No delivery address"
          disabled={isSaving || customerAccount === null}
          style={styles.input}
        />
      )}
      <ThemedInput
        placeholder="Received on (ISO, optional) e.g. 2024-06-01T09:00:00.000Z"
        style={styles.input}
        value={receivedOn}
        onChangeText={setReceivedOn}
        editable={!isSaving}
      />
      {isLoadingPriceBands ? (
        <LoadingSpinner size="small" message="Loading price bands..." />
      ) : priceBandsError ? (
        null
      ) : (
        <ThemedSelect<string>
          value={priceBand ?? null}
          options={priceBands}
          onChange={(value) => setPriceBand(value ?? '')}
          placeholder="Select Price Band"
          nullLabel="None"
          disabled={isSaving || isLoadingPriceBands}
          style={styles.input}
        />
      )}

      <View style={styles.vatRow}>
        <Text style={styles.vatLabel}>VAT</Text>
        <Text style={styles.vatValue}>{vatRate === undefined ? '...' : vatRate === null ? 'UNAVAILABLE' : `${vatRate}%`}</Text>
      </View>

      {/* Line Items Grid */}
      <ItemsCard
        mode="edit"
        title="Line Items"
        isLoading={isLoadingPriceList && priceList.length === 0}
        emptyMessage="No line items added yet"
        addItemCard={
          <AddItemCard
            priceList={priceList}
            vatRate={vatRate}
            priceBand={priceBand}
            isLoadingPriceList={isLoadingPriceList}
            isAddingItem={isSaving}
            onAddItem={handleAddPendingItem}
          />
        }
      >
        {pendingItems.map((item) => (
          <PendingItemCard
            key={item.id}
            item={item}
            isAddingItem={isSaving}
            onUpdateItem={handleUpdatePendingItem}
            onRemoveItem={handleRemovePendingItem}
          />
        ))}
      </ItemsCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {scanLabelsEnabled && (
        <ScanLabelsModal
          visible={isModalVisible}
          onClose={closeScanner}
          onLabelScanned={handleLabelScanned}
          manualText={manualText}
          setManualText={setManualText}
          handleManualSubmit={handleManualSubmit}
          step={step}
          capturedPhoto={capturedPhoto}
          correctionText={correctionText}
          onPhotoTaken={onPhotoTaken}
          onRetake={onRetake}
          onCorrectionConfirm={onCorrectionConfirm}
        />
      )}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    loader: { alignSelf: 'flex-start', marginTop: 4 },
    vatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    vatLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.colors.textSecondary,
    },
    vatValue: {
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
  });
}

