import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { FieldPair } from '@components/ui/FieldPair';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { CustomerDetails, CustomerFormMode } from '../types';

type Props = {
  mode: CustomerFormMode;
  customer?: CustomerDetails;
  isSaving: boolean;
  formData: Partial<CustomerDetails>;
  onFormChange: (data: Partial<CustomerDetails>) => void;
};

export function CustomerInfoCard({ mode, customer, isSaving, formData, onFormChange }: Props) {
  const { width } = useWindowDimensions();
  const isCompact = width < 768 || mode !== 'view';
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {/* Company Information */}
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Company Information</Text>

        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{mode !== 'view' ? 'Company Name *' : 'Company Name'}</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Company Name"
                  value={formData.companyName ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, companyName: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.companyName ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Account Number</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Account Number"
                  value={formData.accountNumber ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, accountNumber: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.accountNumber ?? 'N/A'}</Text>
              )}
            </View>
          }
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Centre Number</Text>
          {mode !== 'view' ? (
            <ThemedInput
              placeholder="Centre Number"
              value={formData.centreNumber ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, centreNumber: text })}
              editable={!isSaving}
            />
          ) : (
            <Text style={styles.fieldValue}>{customer?.centreNumber ?? 'N/A'}</Text>
          )}
        </View>
      </ThemedCard>

      {/* Invoice Address */}
      <ThemedCard style={styles.card}>
        <Text style={styles.sectionTitle}>Invoice Address</Text>

        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Building Name</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Building Name"
                  value={formData.invBuildingName ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invBuildingName: text })}
                  editable={!isSaving}
                />
              ) : customer?.invBuildingName ? (
                <Text style={styles.fieldValue}>{customer.invBuildingName}</Text>
              ) : null}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address Line 1</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Address Line 1"
                  value={formData.invAddressLn1 ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invAddressLn1: text })}
                  editable={!isSaving}
                />
              ) : customer?.invAddressLn1 ? (
                <Text style={styles.fieldValue}>{customer.invAddressLn1}</Text>
              ) : null}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Address Line 2</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Address Line 2"
                  value={formData.invAddressLn2 ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invAddressLn2: text })}
                  editable={!isSaving}
                />
              ) : customer?.invAddressLn2 ? (
                <Text style={styles.fieldValue}>{customer.invAddressLn2}</Text>
              ) : null}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Town / City</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Town or City"
                  value={formData.invTownOrCity ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invTownOrCity: text })}
                  editable={!isSaving}
                />
              ) : customer?.invTownOrCity ? (
                <Text style={styles.fieldValue}>{customer.invTownOrCity}</Text>
              ) : null}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>County</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="County"
                  value={formData.invCounty ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invCounty: text })}
                  editable={!isSaving}
                />
              ) : customer?.invCounty ? (
                <Text style={styles.fieldValue}>{customer.invCounty}</Text>
              ) : null}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Postcode</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Postcode"
                  value={formData.invPostCode ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, invPostCode: text })}
                  editable={!isSaving}
                />
              ) : customer?.invPostCode ? (
                <Text style={styles.fieldValue}>{customer.invPostCode}</Text>
              ) : null}
            </View>
          }
        />
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
