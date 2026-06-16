import { Text, View } from 'react-native';
import { FieldPair } from '@components/ui/FieldPair';
import type { Address } from '../api';
import type { StylesRef } from './addresses-styles';

type Props = {
  address: Address;
  styles: StylesRef;
  compact?: boolean;
};

export function AddressDetail({ address, styles, compact = false }: Props) {
  return (
    <View style={styles.detailBlock}>
      <FieldPair
        compact={compact}
        left={
          address.delBuildingName ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Building Name</Text>
              <Text style={styles.fieldValue}>{address.delBuildingName}</Text>
            </View>
          ) : null
        }
        right={
          address.delAddressLn1 ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address Line 1</Text>
              <Text style={styles.fieldValue}>{address.delAddressLn1}</Text>
            </View>
          ) : null
        }
      />
      <FieldPair
        compact={compact}
        left={
          address.delAddressLn2 ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address Line 2</Text>
              <Text style={styles.fieldValue}>{address.delAddressLn2}</Text>
            </View>
          ) : null
        }
        right={
          address.delTownOrCity ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Town / City</Text>
              <Text style={styles.fieldValue}>{address.delTownOrCity}</Text>
            </View>
          ) : null
        }
      />
      <FieldPair
        compact={compact}
        left={
          address.delCounty ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>County</Text>
              <Text style={styles.fieldValue}>{address.delCounty}</Text>
            </View>
          ) : null
        }
        right={
          address.delPostCode ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Postcode</Text>
              <Text style={styles.fieldValue}>{address.delPostCode}</Text>
            </View>
          ) : null
        }
      />
      <FieldPair
        compact={compact}
        left={
          address.siteContactName ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Site Contact Name</Text>
              <Text style={styles.fieldValue}>{address.siteContactName}</Text>
            </View>
          ) : null
        }
        right={
          address.siteContactEmail ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Site Contact Email</Text>
              <Text style={styles.fieldValue}>{address.siteContactEmail}</Text>
            </View>
          ) : null
        }
      />
      <FieldPair
        compact={compact}
        left={
          address.siteContactPhone ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Site Contact Phone</Text>
              <Text style={styles.fieldValue}>{address.siteContactPhone}</Text>
            </View>
          ) : null
        }
        right={
          address.siteContactMobile ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Site Contact Mobile</Text>
              <Text style={styles.fieldValue}>{address.siteContactMobile}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
