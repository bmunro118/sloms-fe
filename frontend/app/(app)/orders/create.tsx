import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@context/AuthContext';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { isStaff, canMutate } = useAuth();
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
      setError(err instanceof Error ? err.message : 'Failed to create order.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Order</Text>

      <TextInput
        keyboardType="number-pad"
        placeholder="Order number"
        style={styles.input}
        value={orderNumber}
        onChangeText={setOrderNumber}
      />
      <TextInput
        keyboardType="number-pad"
        placeholder="Customer account"
        style={styles.input}
        value={customerAccount}
        onChangeText={setCustomerAccount}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleCreate} style={[styles.button, isSaving ? styles.disabled : null]} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Create'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: '#b91c1c',
  },
  disabled: {
    opacity: 0.65,
  },
});
