import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { listCustomers, CustomerRecord } from '@src/features/customers/api';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ThemedSelect, SelectOption } from '@components/ui/ThemedSelect';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

type Props = {
  isEditing: boolean;
  linkedCustomerId: number | null | undefined;
  onChange: (id: number | null) => void;
};

export function LinkedCustomerField({ isEditing, linkedCustomerId, onChange }: Props) {
  const styles = useThemedStyles(createStyles);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    listCustomers({ limit: 100 }, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setCustomers(res.data ?? []);
        }
      })
      .catch(() => {
        // Silently ignore — dropdown shows empty on failure
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const options: SelectOption<number>[] = customers.map((c) => ({
    value: c.customerId,
    label: c.accountNumber ? `${c.accountNumber} — ${c.companyName}` : c.companyName,
  }));

  const resolvedName =
    linkedCustomerId != null
      ? (customers.find((c) => c.customerId === linkedCustomerId)?.companyName ?? `Customer #${linkedCustomerId}`)
      : '—';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Linked Customer Account</Text>
      {isEditing ? (
        isLoading ? (
          <LoadingSpinner size="small" />
        ) : (
          <ThemedSelect<number>
            value={linkedCustomerId ?? null}
            options={options}
            onChange={onChange}
            placeholder="Select a customer…"
            nullLabel="None (unlink)"
            style={styles.select}
          />
        )
      ) : (
        <Text style={styles.value}>{isLoading ? '…' : resolvedName}</Text>
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    field: { marginTop: theme.spacing.md },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    value: { fontSize: 15, color: theme.colors.textPrimary },
    loader: { alignSelf: 'flex-start', marginTop: 4 },
    select: { marginTop: 2 },
  });
}
