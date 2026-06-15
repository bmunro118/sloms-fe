import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { CustomerDetails } from '../types';

type Props = {
  customer: CustomerDetails;
  isEditing: boolean;
  isSaving: boolean;
  formData: Partial<CustomerDetails>;
  onFormChange: (data: Partial<CustomerDetails>) => void;
};

export function CustomerInfoCard({ customer, isEditing, isSaving, formData, onFormChange }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {/* Company Information */}
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Company Information</Text>

        {isEditing ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Company Name *</Text>
            <ThemedInput
              placeholder="Company Name"
              value={formData.companyName ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, companyName: text })}
              editable={!isSaving}
            />
          </View>
        ) : (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Company Name</Text>
            <Text style={styles.fieldValue}>{customer.companyName ?? 'N/A'}</Text>
          </View>
        )}

        {isEditing ? (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <ThemedInput
                placeholder="Account Number"
                value={formData.accountNumber ?? ''}
                onChangeText={(text) => onFormChange({ ...formData, accountNumber: text })}
                editable={!isSaving}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Centre Number</Text>
              <ThemedInput
                placeholder="Centre Number"
                value={formData.centreNumber ?? ''}
                onChangeText={(text) => onFormChange({ ...formData, centreNumber: text })}
                editable={!isSaving}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              <Text style={styles.fieldValue}>{customer.accountNumber ?? 'N/A'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Centre Number</Text>
              <Text style={styles.fieldValue}>{customer.centreNumber ?? 'N/A'}</Text>
            </View>
          </>
        )}
      </ThemedCard>

      {/* Invoice Address */}
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Invoice Address</Text>

        {isEditing ? (
          <>
            {(
              [
                { key: 'invBuildingName', label: 'Building Name', placeholder: 'Building Name' },
                { key: 'invAddressLn1', label: 'Address Line 1', placeholder: 'Address Line 1' },
                { key: 'invAddressLn2', label: 'Address Line 2', placeholder: 'Address Line 2' },
                { key: 'invTownOrCity', label: 'Town/City', placeholder: 'Town or City' },
                { key: 'invCounty', label: 'County', placeholder: 'County' },
                { key: 'invPostCode', label: 'Postcode', placeholder: 'Postcode' },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <ThemedInput
                  placeholder={placeholder}
                  value={(formData[key] as string) ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, [key]: text })}
                  editable={!isSaving}
                />
              </View>
            ))}
          </>
        ) : (
          <>
            {customer.invBuildingName ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Building Name</Text>
                <Text style={styles.fieldValue}>{customer.invBuildingName}</Text>
              </View>
            ) : null}
            {customer.invAddressLn1 ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Address Line 1</Text>
                <Text style={styles.fieldValue}>{customer.invAddressLn1}</Text>
              </View>
            ) : null}
            {customer.invAddressLn2 ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Address Line 2</Text>
                <Text style={styles.fieldValue}>{customer.invAddressLn2}</Text>
              </View>
            ) : null}
            {customer.invTownOrCity ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Town / City</Text>
                <Text style={styles.fieldValue}>{customer.invTownOrCity}</Text>
              </View>
            ) : null}
            {customer.invCounty ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>County</Text>
                <Text style={styles.fieldValue}>{customer.invCounty}</Text>
              </View>
            ) : null}
            {customer.invPostCode ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Postcode</Text>
                <Text style={styles.fieldValue}>{customer.invPostCode}</Text>
              </View>
            ) : null}
          </>
        )}
      </ThemedCard>
    </>
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
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    field: { marginTop: theme.spacing.md },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
