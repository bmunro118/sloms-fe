import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil as EditIcon, PencilOff as CancelEditIcon, RotateCcw as ResetIcon, Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import {
  suspendCustomer,
  reinstateCustomer,
} from '@src/features/customers/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

type CustomerDetails = {
  customerId: number;
  accountNumber?: string;
  centreNumber?: string;
  companyName: string;
  invBuildingName?: string;
  invAddressLn1?: string;
  invAddressLn2?: string;
  invTownOrCity?: string;
  invCounty?: string;
  invPostCode?: string;
  contactName?: string;
  contactEmail?: string;
  reportEmail?: string;
  contactPhone?: string;
  contactMobile?: string;
  contactFax?: string;
  band?: string;
  isSuspended?: boolean;
};

type Address = {
  id: number;
  siteCompanyName?: string;
  delBuildingName?: string;
  delAddressLn1?: string;
  delAddressLn2?: string;
  delTownOrCity?: string;
  delCounty?: string;
  delPostCode?: string;
  siteContactName?: string;
  siteContactEmail?: string;
  siteContactPhone?: string;
  siteContactMobile?: string;
  defaultAddress?: boolean;
};

type AddressesResponse = {
  data?: Address[];
};

export default function CustomerDetailScreen() {
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showSuccess, showDanger } = useAppModal();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const customerId = Number(params.id);
  const routeWantsEdit = params.mode === 'edit';

  // Debug: Enhanced logging to diagnose customer detail screen issues
  console.log('[CustomerDetailScreen] Component rendered', {
    __DEV__,
    debugFlagValue: process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS,
  });

  if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true') {
    console.log('[CustomerDetailScreen] Route params:', {
      rawParams: params,
      idParam: params.id,
      idType: typeof params.id,
      customerId,
      isFinite: Number.isFinite(customerId),
    });
  }

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerDetails>>({});
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);

  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit) {
      return;
    }

    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, routeWantsEdit]);

  // Fetch customer details
  useEffect(() => {
    if (!isStaff) {
      return;
    }

    if (!Number.isFinite(customerId)) {
      if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true') {
        console.log('[CustomerDetailScreen] Invalid customerId, setting error:', {
          customerId,
          isFinite: Number.isFinite(customerId),
        });
      }
      setError('Invalid customer ID.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<CustomerDetails>(
          ENDPOINTS.customers.byId(customerId),
          {
            method: 'GET',
            requireAuth: true,
            signal: controller.signal,
          }
        );
        if (!controller.signal.aborted) {
          if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true') {
            console.log('[CustomerDetailScreen] Customer loaded successfully:', {
              customerId,
              companyName: response.companyName,
              apiCustomerId: response.customerId,
            });
          }
          setCustomer(response);
          setFormData(response);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const errorMsg =
            err instanceof Error ? err.message : 'Failed to load customer.';
          if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true') {
            console.error('[CustomerDetailScreen] API error:', {
              customerId,
              error: errorMsg,
              errorInstance: err,
            });
          }
          setError(errorMsg);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [customerId, isStaff]);

  // Fetch addresses
  useEffect(() => {
    if (!isStaff || !Number.isFinite(customerId) || !customer) {
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await apiRequest<AddressesResponse>(
          ENDPOINTS.customers.addresses(customerId),
          {
            method: 'GET',
            requireAuth: true,
            signal: controller.signal,
          }
        );
        if (!controller.signal.aborted) {
          setAddresses(Array.isArray(response?.data) ? response.data : []);
        }
      } catch (err) {
        console.warn('Failed to load addresses:', err);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [customerId, isStaff, customer]);

  const performSave = useCallback(async () => {
    if (!Number.isFinite(customerId) || !customer) return;

    setIsSaving(true);
    try {
      const updatePayload: Partial<CustomerDetails> = {
        companyName: formData.companyName,
        accountNumber: formData.accountNumber,
        centreNumber: formData.centreNumber,
        invBuildingName: formData.invBuildingName,
        invAddressLn1: formData.invAddressLn1,
        invAddressLn2: formData.invAddressLn2,
        invTownOrCity: formData.invTownOrCity,
        invCounty: formData.invCounty,
        invPostCode: formData.invPostCode,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        reportEmail: formData.reportEmail,
        contactPhone: formData.contactPhone,
        contactMobile: formData.contactMobile,
        contactFax: formData.contactFax,
        band: formData.band,
      };

      const response = await apiRequest<CustomerDetails>(
        ENDPOINTS.customers.byId(customerId),
        {
          method: 'PUT',
          requireAuth: true,
          body: updatePayload,
        }
      );

      setCustomer(response);
      setFormData(response);
      setIsEditing(false);
      showSuccess('Customer updated', 'Changes saved successfully.');
    } catch (err) {
      showDanger('Save failed', err instanceof Error ? err.message : 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  }, [customer, customerId, formData, showSuccess, showDanger]);

  const handleConfirmSave = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Save customer changes?',
      message: 'This will update the customer profile with your current edits.',
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });

    if (!confirmed) {
      return;
    }

    await performSave();
  }, [isSaving, performSave, showConfirm]);

  const handleConfirmReset = useCallback(async () => {
    if (isSaving || !customer) {
      return;
    }

    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values will be restored from the last saved customer record.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    setFormData(customer);
  }, [customer, isSaving, showConfirm]);

  const handleSuspend = useCallback(async () => {
    if (!customer || !Number.isFinite(customerId)) return;
    const confirmed = await showConfirm({
      title: 'Suspend customer?',
      message: `${customer.companyName} will be suspended and unable to place new orders.`,
      confirmLabel: 'Suspend',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
    try {
      const updated = await suspendCustomer(customerId);
      setCustomer(updated);
      showSuccess('Customer suspended');
    } catch (err) {
      showDanger('Suspend failed', err instanceof Error ? err.message : 'Could not suspend customer.');
    }
  }, [customer, customerId, showConfirm, showSuccess, showDanger]);

  const handleReinstate = useCallback(async () => {
    if (!customer || !Number.isFinite(customerId)) return;
    const confirmed = await showConfirm({
      title: 'Reinstate customer?',
      message: `${customer.companyName} will be reinstated and able to place orders again.`,
      confirmLabel: 'Reinstate',
    });
    if (!confirmed) return;
    try {
      const updated = await reinstateCustomer(customerId);
      setCustomer(updated);
      showSuccess('Customer reinstated');
    } catch (err) {
      showDanger('Reinstate failed', err instanceof Error ? err.message : 'Could not reinstate customer.');
    }
  }, [customer, customerId, showConfirm, showSuccess, showDanger]);

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const backAction = buildBackTopBarAction({
      onPress: () => router.back(),
      label: 'Back to customers',
    });

    if (isEditing) {
      return [
        buildIconTopBarAction({
          id: 'save-customer',
          label: isSaving ? 'Saving...' : 'Save changes',
          accessibilityLabel: isSaving ? 'Saving changes' : undefined,
          onPress: handleConfirmSave,
          icon: SaveIcon,
          disabled: isSaving,
        }),
        buildIconTopBarAction({
          id: 'reset-customer-form',
          label: 'Reset changes',
          onPress: handleConfirmReset,
          icon: ResetIcon,
          disabled: isSaving || !customer,
        }),
        buildIconTopBarAction({
          id: 'cancel-customer-edit',
          label: 'Cancel edit',
          onPress: () => {
            setIsEditing(false);
            if (customer) {
              setFormData(customer);
            }
          },
          icon: CancelEditIcon,
          disabled: isSaving,
        }),
        backAction,
      ];
    }

    return [
      buildIconTopBarAction({
        id: 'edit-customer',
        label: 'Edit customer',
        onPress: () => setIsEditing(true),
        icon: EditIcon,
        disabled: isLoading || !customer,
      }),
      backAction,
    ];
  }, [customer, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, router]);

  useScreenTopBar({ title: 'Customer Detail', actions: topBarActions });

  if (!isStaff) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      {isLoading ? <Text style={styles.muted}>Loading customer...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isLoading && customer ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Customer Info Card */}
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>Company Information</Text>

            {isEditing ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <ThemedInput
                  placeholder="Company Name"
                  value={formData.companyName ?? ''}
                  onChangeText={(text) =>
                    setFormData({ ...formData, companyName: text })
                  }
                  editable={!isSaving}
                />
              </View>
            ) : (
              <Text style={styles.item}>
                Company: {customer.companyName ?? 'N/A'}
              </Text>
            )}

            {isEditing ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <ThemedInput
                    placeholder="Account Number"
                    value={formData.accountNumber ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, accountNumber: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Centre Number</Text>
                  <ThemedInput
                    placeholder="Centre Number"
                    value={formData.centreNumber ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, centreNumber: text })
                    }
                    editable={!isSaving}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.item}>
                  Account: {customer.accountNumber ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Centre: {customer.centreNumber ?? 'N/A'}
                </Text>
              </>
            )}
          </ThemedCard>

          {/* Invoice Address Card */}
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>Invoice Address</Text>

            {isEditing ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Building Name</Text>
                  <ThemedInput
                    placeholder="Building Name"
                    value={formData.invBuildingName ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invBuildingName: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Address Line 1</Text>
                  <ThemedInput
                    placeholder="Address Line 1"
                    value={formData.invAddressLn1 ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invAddressLn1: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Address Line 2</Text>
                  <ThemedInput
                    placeholder="Address Line 2"
                    value={formData.invAddressLn2 ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invAddressLn2: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Town/City</Text>
                  <ThemedInput
                    placeholder="Town or City"
                    value={formData.invTownOrCity ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invTownOrCity: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>County</Text>
                  <ThemedInput
                    placeholder="County"
                    value={formData.invCounty ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invCounty: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Postcode</Text>
                  <ThemedInput
                    placeholder="Postcode"
                    value={formData.invPostCode ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, invPostCode: text })
                    }
                    editable={!isSaving}
                  />
                </View>
              </>
            ) : (
              <>
                {customer.invBuildingName && (
                  <Text style={styles.item}>{customer.invBuildingName}</Text>
                )}
                {customer.invAddressLn1 && (
                  <Text style={styles.item}>{customer.invAddressLn1}</Text>
                )}
                {customer.invAddressLn2 && (
                  <Text style={styles.item}>{customer.invAddressLn2}</Text>
                )}
                {customer.invTownOrCity && (
                  <Text style={styles.item}>{customer.invTownOrCity}</Text>
                )}
                {customer.invCounty && (
                  <Text style={styles.item}>{customer.invCounty}</Text>
                )}
                {customer.invPostCode && (
                  <Text style={styles.item}>{customer.invPostCode}</Text>
                )}
              </>
            )}
          </ThemedCard>

          {/* Contact Information Card */}
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            {isEditing ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contact Name</Text>
                  <ThemedInput
                    placeholder="Contact Name"
                    value={formData.contactName ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactName: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <ThemedInput
                    placeholder="Email"
                    value={formData.contactEmail ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactEmail: text })
                    }
                    keyboardType="email-address"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <ThemedInput
                    placeholder="Phone"
                    value={formData.contactPhone ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactPhone: text })
                    }
                    keyboardType="phone-pad"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mobile</Text>
                  <ThemedInput
                    placeholder="Mobile"
                    value={formData.contactMobile ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactMobile: text })
                    }
                    keyboardType="phone-pad"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Fax</Text>
                  <ThemedInput
                    placeholder="Fax"
                    value={formData.contactFax ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, contactFax: text })
                    }
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Report Email</Text>
                  <ThemedInput
                    placeholder="Report Email"
                    value={formData.reportEmail ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, reportEmail: text })
                    }
                    keyboardType="email-address"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Price Band</Text>
                  <ThemedInput
                    placeholder="Price Band (e.g. NHS1)"
                    value={formData.band ?? ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, band: text })
                    }
                    editable={!isSaving}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.item}>
                  Contact: {customer.contactName ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Email: {customer.contactEmail ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Phone: {customer.contactPhone ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Mobile: {customer.contactMobile ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Fax: {customer.contactFax ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Report Email: {customer.reportEmail ?? 'N/A'}
                </Text>
                <Text style={styles.item}>
                  Price Band: {customer.band ?? 'N/A'}
                </Text>
              </>
            )}
          </ThemedCard>

          {/* Delivery Addresses Card */}
          {addresses.length > 0 && (
            <ThemedCard style={styles.card}>
              <Text style={styles.sectionTitle}>Delivery Addresses</Text>
              {addresses.map((address, idx) => {
                const isLastAddress = idx === addresses.length - 1;
                const addressKey = `${address.id ?? 'address'}-${idx}`;

                return (
                <View
                  key={addressKey}
                  style={[
                    styles.addressBlock,
                    isLastAddress && styles.addressBlockLast,
                  ]}
                >
                  <Text style={styles.addressTitle}>
                    Address {idx + 1}
                    {address.defaultAddress && (
                      <Text style={styles.defaultBadge}> (Default)</Text>
                    )}
                  </Text>
                  {address.siteCompanyName && (
                    <Text style={styles.item}>{address.siteCompanyName}</Text>
                  )}
                  {address.delBuildingName && (
                    <Text style={styles.item}>{address.delBuildingName}</Text>
                  )}
                  {address.delAddressLn1 && (
                    <Text style={styles.item}>{address.delAddressLn1}</Text>
                  )}
                  {address.delAddressLn2 && (
                    <Text style={styles.item}>{address.delAddressLn2}</Text>
                  )}
                  {address.delTownOrCity && (
                    <Text style={styles.item}>{address.delTownOrCity}</Text>
                  )}
                  {address.delCounty && (
                    <Text style={styles.item}>{address.delCounty}</Text>
                  )}
                  {address.delPostCode && (
                    <Text style={styles.item}>{address.delPostCode}</Text>
                  )}
                  {address.siteContactName && (
                    <Text style={styles.item}>
                      Contact: {address.siteContactName}
                    </Text>
                  )}
                  {address.siteContactEmail && (
                    <Text style={styles.item}>
                      Email: {address.siteContactEmail}
                    </Text>
                  )}
                </View>
                );
              })}
            </ThemedCard>
          )}

          {/* Status Card */}
          <ThemedCard style={styles.card}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusBadgeRow}>
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
          </ThemedCard>

          {/* Admin Actions */}
          {canMutate ? (
            <ThemedCard style={styles.card}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionsStack}>
                {customer.isSuspended ? (
                  <ThemedButton
                    label="Reinstate Customer"
                    onPress={handleReinstate}
                    style={styles.actionButton}
                  />
                ) : (
                  <View style={[styles.actionButton, styles.dangerButton]}>
                    <ThemedButton
                      label="Suspend Customer"
                      onPress={handleSuspend}
                      variant="secondary"
                      style={{ width: '100%' }}
                      textStyle={{ color: theme.colors.danger }}
                    />
                  </View>
                )}
              </View>
            </ThemedCard>
          ) : null}

        </ScrollView>
      ) : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    card: {
      ...common.card,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    item: common.cardItem,
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    formGroup: {
      marginBottom: 12,
    },
    addressBlock: {
      paddingBottom: 12,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    addressBlockLast: {
      paddingBottom: 0,
      marginBottom: 0,
      borderBottomWidth: 0,
    },
    addressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    defaultBadge: {
      fontSize: 12,
      fontWeight: '400',
      color: theme.colors.accent,
    },
    statusBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    statusBadge: {
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    actionsStack: {
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      alignSelf: 'flex-start',
    },
    dangerButton: {
      borderColor: theme.colors.danger,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
    },
  });
}
