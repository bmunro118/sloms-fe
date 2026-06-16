import { Text, View } from 'react-native';
import { ThemedInput } from '@components/ui/ThemedInput';
import type { CreateAddressPayload } from '../api';
import type { StylesRef } from './addresses-styles';

export const ADDRESS_FIELDS: {
  key: keyof CreateAddressPayload;
  label: string;
  placeholder: string;
  kb?: 'default' | 'email-address' | 'phone-pad';
}[] = [
  { key: 'siteCompanyName', label: 'Site Company Name', placeholder: 'Site Company Name' },
  { key: 'delBuildingName', label: 'Building Name', placeholder: 'Building Name' },
  { key: 'delAddressLn1', label: 'Address Line 1', placeholder: 'Address Line 1' },
  { key: 'delAddressLn2', label: 'Address Line 2', placeholder: 'Address Line 2' },
  { key: 'delTownOrCity', label: 'Town / City', placeholder: 'Town or City' },
  { key: 'delCounty', label: 'County', placeholder: 'County' },
  { key: 'delPostCode', label: 'Postcode', placeholder: 'Postcode' },
  { key: 'siteContactName', label: 'Site Contact Name', placeholder: 'Site Contact Name' },
  { key: 'siteContactEmail', label: 'Site Contact Email', placeholder: 'Email', kb: 'email-address' },
  { key: 'siteContactPhone', label: 'Site Contact Phone', placeholder: 'Phone', kb: 'phone-pad' },
  { key: 'siteContactMobile', label: 'Site Contact Mobile', placeholder: 'Mobile', kb: 'phone-pad' },
];

type Props = {
  form: CreateAddressPayload;
  onChange: (patch: Partial<CreateAddressPayload>) => void;
  disabled: boolean;
  styles: StylesRef;
};

export function AddressForm({ form, onChange, disabled, styles }: Props) {
  return (
    <>
      {ADDRESS_FIELDS.map(({ key, label, placeholder, kb }) => (
        <View key={key} style={styles.formGroup}>
          <Text style={styles.label}>{label}</Text>
          <ThemedInput
            placeholder={placeholder}
            value={(form[key] as string) ?? ''}
            onChangeText={(text) => onChange({ [key]: text })}
            keyboardType={kb ?? 'default'}
            editable={!disabled}
          />
        </View>
      ))}
    </>
  );
}
