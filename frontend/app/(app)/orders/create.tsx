import { Redirect, useRouter } from 'expo-router';
import { PackageCheck as CreateIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildCloseTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { createOrder } from '@src/features/orders/api';
import { listCustomers, CustomerRecord } from '@src/features/customers/api';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showDanger } = useAppModal();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [orderNumber, setOrderNumber] = useState('');
  const [customerAccount, setCustomerAccount] = useState<number | null>(null);
  const [priceBand, setPriceBand] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

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

  const performCreate = useCallback(async () => {
    if (!canMutate) {
      setError('Your role does not allow creating orders.');
      return;
    }

    const parsedOrderNumber = Number(orderNumber);
    if (!Number.isFinite(parsedOrderNumber) || parsedOrderNumber <= 0) {
      setError('Order number must be a valid positive number.');
      return;
    }

    if (customerAccount === null) {
      setError('Please select a customer account.');
      return;
    }

    setIsSaving(true);
    setError(null);
    console.log('[OrderCreate] Submitting order — orderNumber:', parsedOrderNumber, 'customerAccount:', customerAccount);
    try {
      const trimmedPriceBand = priceBand.trim();
      const payload = {
        orderNumber: parsedOrderNumber,
        customerAccount,
        priceBand: trimmedPriceBand || undefined,
      };
      console.log('[OrderCreate] Payload:', payload);

      const result = await createOrder(payload);
      console.log('[OrderCreate] Order created successfully:', result);
      router.replace('/(app)/orders');
    } catch (err) {
      console.error('[OrderCreate] API error:', err);
      if (isMountedRef.current) {
        await showDanger({
          title: 'Create Order Failed',
          message: err instanceof Error ? err.message : 'Failed to create order. Please try again.',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [canMutate, customerAccount, isMountedRef, orderNumber, priceBand, router, showDanger]);

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

  const topBarActions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: 'submit-create-order',
        label: isSaving ? 'Creating order...' : 'Create order',
        accessibilityLabel: isSaving ? 'Creating order' : undefined,
        onPress: handleCreate,
        icon: CreateIcon,
        disabled: isSaving,
      }),
      buildIconTopBarAction({
        id: 'reset-create-order-form',
        label: 'Reset form',
        onPress: () => {
          setOrderNumber('');
          setCustomerAccount(null);
          setPriceBand('');
          setError(null);
        },
        icon: ResetIcon,
        disabled: isSaving,
      }),
      buildCloseTopBarAction({
        onPress: () => router.replace('/(app)/orders'),
        label: 'Close create order',
      }),
    ];
  }, [handleCreate, isSaving, router]);

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
        <ActivityIndicator size="small" style={styles.loader} />
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
