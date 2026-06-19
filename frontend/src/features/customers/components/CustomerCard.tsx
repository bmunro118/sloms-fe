import { useRouter } from 'expo-router';
import { Pencil as EditCustomerIcon } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Text } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface CustomerCardData {
  customerId: number;
  companyName?: string;
  accountNumber?: string;
}

interface CustomerCardProps {
  customer: CustomerCardData;
  canMutate: boolean;
}

export function CustomerCard({ customer, canMutate }: CustomerCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  const handleOpenCustomer = useCallback(() => {
    router.push(`/(app)/customers/${customer.customerId}` as never);
  }, [customer.customerId, router]);

  const handleOpenCustomerEdit = useCallback(() => {
    router.push(`/(app)/customers/${customer.customerId}?mode=edit` as never);
  }, [customer.customerId, router]);

  const actions = useMemo<TopBarAction[]>(() => {
    return [
      buildIconTopBarAction({
        id: `edit-customer-${customer.customerId}`,
        label: 'Edit customer',
        onPress: handleOpenCustomerEdit,
        icon: EditCustomerIcon,
        hidden: !canMutate,
      }),
    ];
  }, [canMutate, customer.customerId, handleOpenCustomerEdit]);

  return (
    <ThemedCard
      style={styles.card}
      title={customer.companyName ?? `Customer #${customer.customerId}`}
      actions={actions}
      onPress={handleOpenCustomer}
    >
      <Text style={styles.cardMeta}>Account: {customer.accountNumber ?? 'N/A'}</Text>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    card: common.card,
    cardMeta: common.cardMeta,
  };
}
