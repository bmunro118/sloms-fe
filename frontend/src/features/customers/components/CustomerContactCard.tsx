import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { FieldPair } from '@components/ui/FieldPair';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useAppTheme } from '@theme/ThemeProvider';
import { useThemedStyles } from '@theme/useThemedStyles';
import { CustomerDetails } from '../types';
import { ThemedButton } from '@components/ui/ThemedButton';

type Props = {
  customer: CustomerDetails;
  isEditing: boolean;
  isSaving: boolean;
  formData: Partial<CustomerDetails>;
  onFormChange: (data: Partial<CustomerDetails>) => void;
  canMutate: boolean;
  onSuspend: () => void;
  onReinstate: () => void;
};

export function CustomerContactCard({
  customer,
  isEditing,
  isSaving,
  formData,
  onFormChange,
  canMutate,
  onSuspend,
  onReinstate,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const isCompact = width < 768 || isEditing;
  const theme = useAppTheme();

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
              {isEditing ? (
                <ThemedInput
                  placeholder="Contact Name"
                  value={formData.contactName ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactName: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.contactName ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              {isEditing ? (
                <ThemedInput
                  placeholder="Email"
                  value={formData.contactEmail ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactEmail: text })}
                  keyboardType="email-address"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.contactEmail ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone</Text>
              {isEditing ? (
                <ThemedInput
                  placeholder="Phone"
                  value={formData.contactPhone ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactPhone: text })}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.contactPhone ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              {isEditing ? (
                <ThemedInput
                  placeholder="Mobile"
                  value={formData.contactMobile ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactMobile: text })}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.contactMobile ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <FieldPair
          compact={isCompact}
          left={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Fax</Text>
              {isEditing ? (
                <ThemedInput
                  placeholder="Fax"
                  value={formData.contactFax ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, contactFax: text })}
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.contactFax ?? 'N/A'}</Text>
              )}
            </View>
          }
          right={
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Report Email</Text>
              {isEditing ? (
                <ThemedInput
                  placeholder="Report Email"
                  value={formData.reportEmail ?? ''}
                  onChangeText={(text) => onFormChange({ ...formData, reportEmail: text })}
                  keyboardType="email-address"
                  editable={!isSaving}
                />
              ) : (
                <Text style={styles.fieldValue}>{customer.reportEmail ?? 'N/A'}</Text>
              )}
            </View>
          }
        />
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Price Band</Text>
          {isEditing ? (
            <ThemedInput
              placeholder="Price Band (e.g. NHS1)"
              value={formData.band ?? ''}
              onChangeText={(text) => onFormChange({ ...formData, band: text })}
              editable={!isSaving}
            />
          ) : (
            <Text style={styles.fieldValue}>{customer.band ?? 'N/A'}</Text>
          )}
        </View>
      </ThemedCard>

      {/* Admin Actions */}
      {canMutate ? (
        <ThemedCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: customer.isSuspended ? theme.colors.danger : theme.colors.accent,
                  backgroundColor: customer.isSuspended ? theme.colors.dangerSurface : theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: customer.isSuspended ? theme.colors.danger : theme.colors.accent },
                ]}
              >
                {customer.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
              </Text>
            </View>
          </View>
          <View style={styles.actionsStack}>
            {customer.isSuspended ? (
              <ThemedButton
                label="Reinstate Customer"
                onPress={onReinstate}
                style={styles.actionButton}
              />
            ) : (
              <View style={[styles.actionButton, styles.dangerButton]}>
                <ThemedButton
                  label="Suspend Customer"
                  onPress={onSuspend}
                  variant="secondary"
                  textStyle={{ color: theme.colors.danger }}
                />
              </View>
            )}
          </View>
        </ThemedCard>
      ) : null}
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusBadgeText: { fontSize: 12, fontWeight: '600' },
    actionsStack: { gap: 12 },
    actionButton: { alignSelf: 'flex-start', minWidth: 160 },
    dangerButton: {
      borderWidth: 1,
      borderColor: theme.colors.danger,
      borderRadius: 8,
      overflow: 'hidden',
      alignSelf: 'flex-start',
      minWidth: 160,
    },
  });
}
