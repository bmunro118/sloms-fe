import { Redirect, useRouter } from 'expo-router';
import { PackageCheck as CreateIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
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
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createOrder } from '@src/features/orders/api';
import { Address, CustomerRecord, listAddresses, listCustomers } from '@src/features/customers/api';

export default function CreateOrderScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showDanger } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [orderNumber, setOrderNumber] = useState('');
  const [orderBatch, setOrderBatch] = useState('');
  const [customerAccount, setCustomerAccount] = useState<number | null>(null);
  const [customerRef, setCustomerRef] = useState('');
  const [orderContact, setOrderContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<number | null>(null);
  const [receivedOn, setReceivedOn] = useState('');
  const [priceBand, setPriceBand] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState(false);

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
        value: address.id,
        label: `${line}${city}${defaultBadge}`,
      };
    });
  }, [deliveryAddresses]);

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
          if (nextAddresses.some((address) => address.id === current)) {
            return current;
          }
          const defaultAddress = nextAddresses.find((address) => address.defaultAddress);
          return defaultAddress?.id ?? null;
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

    const parsedOrderNumber = Number(orderNumber);
    if (!Number.isFinite(parsedOrderNumber) || parsedOrderNumber <= 0) {
      const msg = 'Order number must be a valid positive number.';
      setError(msg);
      showDanger('Required field', msg);
      return;
    }

    const trimmedOrderBatch = orderBatch.trim();
    const parsedOrderBatch = trimmedOrderBatch.length > 0 ? Number(trimmedOrderBatch) : undefined;
    if (trimmedOrderBatch.length > 0 && (!Number.isFinite(parsedOrderBatch) || parsedOrderBatch <= 0)) {
      const msg = 'Order batch must be a valid positive number.';
      setError(msg);
      showDanger('Required field', msg);
      return;
    }

    if (customerAccount === null) {
      const msg = 'Please select a customer account.';
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

    setIsSaving(true);
    setError(null);
    console.log('[OrderCreate] Submitting order — orderNumber:', parsedOrderNumber, 'customerAccount:', customerAccount);
    try {
      const trimmedPriceBand = priceBand.trim();
      const trimmedCustomerRef = customerRef.trim();
      const trimmedOrderContact = orderContact.trim();
      const payload = {
        orderNumber: parsedOrderNumber,
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
      router.replace('/(app)/orders');
    } catch (err) {
      console.error('[OrderCreate] API error:', err);
      if (isMountedRef.current) {
        showDanger('Create Order Failed', err instanceof Error ? err.message : 'Failed to create order. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [canMutate, customerAccount, customerRef, deliveryAddress, isMountedRef, orderBatch, orderContact, orderNumber, priceBand, receivedOn, router, showDanger]);

  const handleCreate = useCallback(async () => {
    if (isSaving) {
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
        message: `A new order will be created for ${customerLabel} with order number ${orderNumber}.`,
      confirmLabel: 'Create',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    await performCreate();
  }, [isSaving, showConfirm, customerAccount, customers, orderNumber, performCreate]);

  const isDirty = useMemo(
    () => orderNumber !== '' || customerAccount !== null || orderBatch !== '' || customerRef !== '' || orderContact !== '' || priceBand !== '' || receivedOn !== '',
    [orderNumber, customerAccount, orderBatch, customerRef, orderContact, priceBand, receivedOn],
  );

  const { guardAction } = useUnsavedChangesGuard({ isDirty });

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
        label: isSaving ? 'Creating order...' : 'Create order',
        accessibilityLabel: isSaving ? 'Creating order' : undefined,
        onPress: handleCreate,
        icon: CreateIcon,
        disabled: isSaving,
        primary: true,
      }),
      buildIconTopBarAction({
        id: 'reset-create-order-form',
        label: 'Reset form',
        onPress: () => {
          void guardAction(() => {
            setOrderNumber('');
            setOrderBatch('');
            setCustomerAccount(null);
            setCustomerRef('');
            setOrderContact('');
            setDeliveryAddress(null);
            setReceivedOn('');
            setDeliveryAddresses([]);
            setPriceBand('');
            setError(null);
          });
        },
        icon: ResetIcon,
        disabled: isSaving,
      }),
      buildBackTopBarAction({
        onPress: () => void guardAction(() => router.back()),
      }),
    ];
  }, [handleCreate, isSaving, guardAction, router]);

  useScreenTopBar({ title: 'Create Order', actions: topBarActions });

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent gap={10}>
      <ThemedInput
        keyboardType="number-pad"
        placeholder="Order number"
        style={styles.input}
        value={orderNumber}
        onChangeText={setOrderNumber}
        editable={!isSaving}
      />
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
      <ThemedInput
        placeholder="Price band (optional)"
        style={styles.input}
        value={priceBand}
        onChangeText={setPriceBand}
        editable={!isSaving}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    loader: { alignSelf: 'flex-start', marginTop: 4 },
  });
}
