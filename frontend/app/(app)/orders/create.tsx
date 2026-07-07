import { Redirect, useRouter } from 'expo-router';
import { PackageCheck as CreateIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { usePriceBands } from '@features/price-list/hooks/usePriceBands';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createOrder, addOrderItem } from '@src/features/orders/api';
import {
  ItemsCard,
  AddItemCard,
  PendingItemCard,
  type PendingItem,
} from '@src/features/orders/components/ItemsCard';
import { usePendingItems } from '@src/features/orders/hooks/usePendingItems';
import { useCurrentVatRate } from '@src/features/orders/hooks/useCurrentVatRate';
import { Address, CustomerRecord, listAddresses, listCustomers } from '@src/features/customers/api';
import { PriceListItem, listPriceListItems } from '@src/features/price-list/api';

export default function CreateOrderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showDanger, showWarning } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [orderBatch, setOrderBatch] = useState('');
  const [customerAccount, setCustomerAccount] = useState<number | null>(null);
  const [customerRef, setCustomerRef] = useState('');
  const [orderContact, setOrderContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<number | null>(null);
  const [receivedOn, setReceivedOn] = useState('');
  const [priceBand, setPriceBand] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState(false);
  const { pendingItems, isSaving, handleAddPendingItem, handleRemovePendingItem, handleUpdatePendingItem, handleResetPendingItems, setIsSaving } = usePendingItems();
  const { vatRate } = useCurrentVatRate();
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [isLoadingPriceList, setIsLoadingPriceList] = useState(false);
  const { priceBands, isLoading: isLoadingPriceBands, error: priceBandsError } = usePriceBands();

  // Auto-populate price band when customer changes
  useEffect(() => {
    if (customerAccount !== null) {
      const band = customers.find((c) => c.customerId === customerAccount)?.band;
      if (band) setPriceBand(band);
    } else {
      setPriceBand('');
    }
  }, [customerAccount, customers]);

  // Fetch customers
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingCustomers(true);
    listCustomers({ limit: 100 }, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setCustomers(res.data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCustomers(false);
      });
    return () => controller.abort();
  }, []);

  // Fetch price list
  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingPriceList(true);
    listPriceListItems(undefined, { signal: controller.signal })
      .then((plResponse) => {
        if (!controller.signal.aborted) {
          const plData = Array.isArray(plResponse) ? plResponse : plResponse.data ?? [];
          setPriceList(plData);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPriceList(false);
      });
    return () => controller.abort();
  }, []);

  const customerOptions = useMemo<SelectOption<number>[]>(
    () =>
      customers.map((c) => ({
        value: c.customerId,
        label: c.accountNumber ? `${c.accountNumber} — ${c.companyName}` : c.companyName,
      })),
    [customers]
  );

  const deliveryAddressOptions = useMemo<SelectOption<number>[]>(() => {
    return deliveryAddresses.map((address, index) => {
      const line = address.delAddressLn1 ?? address.delPostCode ?? `Address ${index + 1}`;
      const city = address.delTownOrCity ? `, ${address.delTownOrCity}` : '';
      const defaultBadge = address.defaultAddress ? ' (Default)' : '';
      return {
        value: address.addressId,
        label: `${line}${city}${defaultBadge}`,
      };
    });
  }, [deliveryAddresses]);

  // Pending items: using usePendingItems hook

  const isDirty = useMemo(
    () =>
      customerAccount !== null ||
      orderBatch !== '' ||
      customerRef !== '' ||
      orderContact !== '' ||
      priceBand !== '' ||
      receivedOn !== '' ||
      deliveryAddress !== null ||
      pendingItems.length > 0,
    [customerAccount, orderBatch, customerRef, orderContact, priceBand, receivedOn, deliveryAddress, pendingItems.length],
  );

  const { guardAction, skipNextGuard } = useUnsavedChangesGuard({ isDirty });

  useEffect(() => {
    if (customerAccount === null) {
      setDeliveryAddresses([]);
      setDeliveryAddress(null);
      return;
    }
    const controller = new AbortController();
    setIsLoadingDeliveryAddresses(true);
    listAddresses(customerAccount, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const nextAddresses = Array.isArray(response.data) ? response.data : [];
        setDeliveryAddresses(nextAddresses);
        setDeliveryAddress((current) => {
          if (nextAddresses.some((address) => address.addressId === current)) {
            return current;
          }
          const defaultAddress = nextAddresses.find((address) => address.defaultAddress);
          return defaultAddress?.addressId ?? null;
        });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('[OrderCreate] Failed to load customer addresses:', err);
          setDeliveryAddresses([]);
          setDeliveryAddress(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDeliveryAddresses(false);
      });

    return () => controller.abort();
  }, [customerAccount]);

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

    const trimmedOrderBatch = orderBatch.trim();
    const parsedOrderBatch = trimmedOrderBatch.length > 0 ? Number(trimmedOrderBatch) : undefined;
    if (trimmedOrderBatch.length > 0 && parsedOrderBatch !== undefined && (!Number.isFinite(parsedOrderBatch) || parsedOrderBatch <= 0)) {
      const msg = 'Order batch must be a valid positive number.';
      setError(msg);
      showDanger('Required field', msg);
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
    console.log('[OrderCreate] Submitting order — customerAccount:', customerAccount);
    try {
      const trimmedPriceBand = priceBand.trim();
      const trimmedCustomerRef = customerRef.trim();
      const trimmedOrderContact = orderContact.trim();
      const payload = {
        orderBatch: parsedOrderBatch,
        customerAccount,
        customerRef: trimmedCustomerRef || undefined,
        orderContact: trimmedOrderContact || undefined,
        deliveryAddress: deliveryAddress ?? undefined,
        receivedOn: trimmedReceivedOn || undefined,
        priceBand: trimmedPriceBand || undefined,
      };
      console.log('[OrderCreate] Payload:', payload);

      const result = await createOrder(payload);
      console.log('[OrderCreate] Order created successfully:', result);

      // Submit pending items sequentially
      const createdOrderNumber = result.orderNumber;
      const createdOrderBatch: number = result.orderBatch ?? parsedOrderBatch ?? 1;
      const failedItems: string[] = [];

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          try {
            await addOrderItem(createdOrderNumber, createdOrderBatch, {
              serialNumber: item.itemId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice ?? 0,
              vatRate: item.vatRate ?? vatRate ?? undefined,
            } as Parameters<typeof addOrderItem>[2]);
          } catch (itemErr) {
            console.warn('[OrderCreate] Failed to add item:', item.itemId, itemErr);
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
      console.error('[OrderCreate] API error:', err);
      if (isMountedRef.current) {
        showDanger('Create Order Failed', err instanceof Error ? err.message : 'Failed to create order. Please try again.');
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
    orderBatch,
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

    const selectedCustomer = customers.find((c) => c.customerId === customerAccount);
    const customerLabel = selectedCustomer
      ? selectedCustomer.accountNumber
        ? `${selectedCustomer.accountNumber} — ${selectedCustomer.companyName}`
        : selectedCustomer.companyName
      : `customer account ${customerAccount}`;

    const confirmed = await showConfirm({
      title: 'Create new order?',
      message: `A new order will be created for ${customerLabel} with order batch ${orderBatch}${pendingItems.length > 0 ? ` and ${pendingItems.length} line item(s)` : ''}.`,
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    await performCreate();
  }, [isCreatingOrder, isSaving, showConfirm, customerAccount, customers, orderBatch, pendingItems.length, performCreate]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
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
            setOrderBatch('');
            setCustomerAccount(null);
            setCustomerRef('');
            setOrderContact('');
            setDeliveryAddress(null);
            setReceivedOn('');
            setDeliveryAddresses([]);
            setPriceBand('');
            handleResetPendingItems();
            setError(null);
          });
        },
        icon: ResetIcon,
        disabled: isCreatingOrder || isSaving,
      }),
      buildBackTopBarAction({
        onPress: () => void guardAction(() => router.back()),
      }),
    ];
  }, [handleCreate, handleResetPendingItems, isCreatingOrder, isSaving, guardAction, router, pendingItems.length]);

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
        keyboardType="number-pad"
        placeholder="Order batch (optional)"
        style={styles.input}
        value={orderBatch}
        onChangeText={setOrderBatch}
        editable={!isSaving}
      />
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

