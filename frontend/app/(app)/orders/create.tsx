import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { useIsMountedRef } from '@src/hooks/useIsMountedRef';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
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
  useScreenTitle('Create Order');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerAccount, setCustomerAccount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  const handleCreate = async () => {
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
  };

  return (
    <ScreenContent gap={10}>
      <ThemedInput
        keyboardType="number-pad"
        placeholder="Order number"
        style={styles.input}
        value={orderNumber}
        onChangeText={setOrderNumber}
      />
      <ThemedInput
        keyboardType="number-pad"
        placeholder="Customer account"
        style={styles.input}
        value={customerAccount}
        onChangeText={setCustomerAccount}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ThemedButton
        label={isSaving ? 'Saving...' : 'Create'}
        onPress={handleCreate}
        disabled={isSaving}
        style={styles.button}
      />
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    title: {
      ...common.title,
      marginBottom: 4,
    },
    button: {
      marginTop: 4,
      paddingVertical: 11,
    },
  });
}
