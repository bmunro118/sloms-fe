import { Redirect, useRouter } from 'expo-router';
import { Plus as CreateIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { isStaff, canMutate } = useAuth();
  const styles = useThemedStyles(createStyles);
  const isMountedRef = useIsMountedRef();
  const [orderNumber, setOrderNumber] = useState('');
  const [customerAccount, setCustomerAccount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleCreate = useCallback(async () => {
    if (!canMutate) {
      setError('Your role does not allow creating orders.');
      return;
    }

    const parsedOrderNumber = Number(orderNumber);
    const parsedCustomer = Number(customerAccount);
    if (!Number.isFinite(parsedOrderNumber) || !Number.isFinite(parsedCustomer)) {
      setError('Order number and customer account must be numeric.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await apiRequest(ENDPOINTS.orders.list, {
        method: 'POST',
        requireAuth: true,
        body: {
          orderNumber: parsedOrderNumber,
          customerAccount: parsedCustomer,
        },
      });
      router.replace('/(app)/orders');
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to create order.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [canMutate, customerAccount, isMountedRef, orderNumber, router]);

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
          setCustomerAccount('');
          setError(null);
        },
        icon: ResetIcon,
        disabled: isSaving,
      }),
    ];
  }, [handleCreate, isSaving]);

  useScreenTopBar({ title: 'Create Order', actions: topBarActions });

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
      <ThemedInput
        keyboardType="number-pad"
        placeholder="Customer account"
        style={styles.input}
        value={customerAccount}
        onChangeText={setCustomerAccount}
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
  });
}
