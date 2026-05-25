import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { Address } from '../types';

type Props = {
  addresses: Address[];
};

export function CustomerDeliveryAddressesCard({ addresses }: Props) {
  const styles = useThemedStyles(createStyles);

  if (addresses.length === 0) return null;

  return (
    <ThemedCard style={styles.card}>
      <Text style={styles.sectionTitle}>Delivery Addresses</Text>
      {addresses.map((address, idx) => {
        const isLast = idx === addresses.length - 1;
        const key = `${address.id ?? 'address'}-${idx}`;

        return (
          <View key={key} style={[styles.addressBlock, isLast && styles.addressBlockLast]}>
            <Text style={styles.addressTitle}>
              Address {idx + 1}
              {address.defaultAddress && (
                <Text style={styles.defaultBadge}> (Default)</Text>
              )}
            </Text>
            {address.siteCompanyName && <Text style={styles.item}>{address.siteCompanyName}</Text>}
            {address.delBuildingName && <Text style={styles.item}>{address.delBuildingName}</Text>}
            {address.delAddressLn1 && <Text style={styles.item}>{address.delAddressLn1}</Text>}
            {address.delAddressLn2 && <Text style={styles.item}>{address.delAddressLn2}</Text>}
            {address.delTownOrCity && <Text style={styles.item}>{address.delTownOrCity}</Text>}
            {address.delCounty && <Text style={styles.item}>{address.delCounty}</Text>}
            {address.delPostCode && <Text style={styles.item}>{address.delPostCode}</Text>}
            {address.siteContactName && (
              <Text style={styles.item}>Contact: {address.siteContactName}</Text>
            )}
            {address.siteContactEmail && (
              <Text style={styles.item}>Email: {address.siteContactEmail}</Text>
            )}
          </View>
        );
      })}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: { ...common.card, marginBottom: 16 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    item: common.cardItem,
    addressBlock: {
      paddingBottom: 12,
      marginBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    addressBlockLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    addressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    defaultBadge: {
      fontSize: 12,
      color: theme.colors.accent,
      fontWeight: '400',
    },
  });
}
