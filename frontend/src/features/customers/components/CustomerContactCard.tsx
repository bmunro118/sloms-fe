import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { ThemedSelect } from '@components/ui/ThemedSelect';
import { FieldPair } from '@components/ui/FieldPair';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { CustomerDetails, CustomerFormMode } from '../types';
import { usePriceBands } from '@features/price-list/hooks/usePriceBands';

type Props = {
  mode: CustomerFormMode;
  customer?: CustomerDetails;
  isSaving: boolean;
  formData: Partial<CustomerDetails>;
  onFormChange: (data: Partial<CustomerDetails>) => void;
};

export function CustomerContactCard({
  mode,
  customer,
  isSaving,
  formData,
  onFormChange,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isCompact = width < 768 || mode !== 'view';
  const theme = useAppTheme();
  
  // Fetch price bands for dropdown
  const { priceBands, isLoading: isLoadingPriceBands, error: priceBandsError } = usePriceBands();

  // Find display label for current band value (for view mode)
  const getBandDisplayLabel = (bandValue: string | undefined): string => {
    if (!bandValue) return 'N/A';
    const bandOption = priceBands.find((option) => option.value === bandValue);
    return bandOption?.label ?? bandValue;
  };

  return (
    <>
      {/* Contact Information */}
      <ThemedCard style={styles.card}>
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Contact Information</Text>

        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Contact Name</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Contact Name"
                  value={formData.contactName ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactName: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.contactName ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Email"
                  value={formData.contactEmail ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactEmail: text })}
                  keyboardType="email-address"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.contactEmail ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Phone"
                  value={formData.contactPhone ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactPhone: text })}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.contactPhone ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Mobile"
                  value={formData.contactMobile ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactMobile: text })}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.contactMobile ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Fax</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Fax"
                  value={formData.contactFax ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactFax: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.contactFax ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Report Email</Text>
              {mode !== 'view' ? (
                <ThemedInput
                  placeholder="Report Email"
                  value={formData.reportEmail ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, reportEmail: text })}
                  keyboardType="email-address"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer?.reportEmail ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Price Band</Text>
          {mode !== 'view' ? (
            isLoadingPriceBands ? (
              <LoadingSpinner size="small" message="Loading price bands..." />
            ) : priceBandsError ? (
              <Text style={[styles.fieldValue, { color: theme.colors.danger }]}>Error loading price bands</Text>
            ) : (
              <ThemedSelect
                value={formData.band ?? null}
                options={priceBands}
                onChange={(value) => onFormChange({ ...formData, band: value ?? undefined })}
                placeholder="Select Price Band"
                nullLabel="None"
                disabled={isSaving || isLoadingPriceBands}
              />
            )
          ) : (
            <Text style={styles.fieldValue}>{getBandDisplayLabel(customer?.band)}</Text>
          )}
        </View>
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
    },
    sectionTitleSpaced: { marginBottom: 12 },
    field: { marginTop: theme.spacing.md },
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
  });
}
