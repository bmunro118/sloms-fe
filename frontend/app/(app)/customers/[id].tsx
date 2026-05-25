import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil as EditIcon, PencilOff as CancelEditIcon, RotateCcw as ResetIcon, Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { getCustomer, updateCustomer, suspendCustomer, reinstateCustomer, CustomerRecord, UpdateCustomerPayload } from '@src/features/customers/api';
import { CustomerInfoCard } from '@src/features/customers/components/CustomerInfoCard';
import { CustomerContactCard } from '@src/features/customers/components/CustomerContactCard';
import { CustomerDeliveryAddressesCard } from '@src/features/customers/components/CustomerDeliveryAddressesCard';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export default function CustomerDetailScreen() {
  const { isStaff, canMutate } = useAuth();
  const { showConfirm, showSuccess, showDanger } = useAppModal();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const customerId = Number(params.id);
  const routeWantsEdit = params.mode === 'edit';

  if (__DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true') {
    console.log('[CustomerDetailScreen] Route params:', {
      rawParams: params,
      customerId,
      isFinite: Number.isFinite(customerId),
    });
  }

  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerRecord>>({});
  const [hasAppliedRouteEdit, setHasAppliedRouteEdit] = useState(false);

  useEffect(() => {
    if (!routeWantsEdit || hasAppliedRouteEdit) return;
    setIsEditing(true);
    setHasAppliedRouteEdit(true);
  }, [hasAppliedRouteEdit, routeWantsEdit]);

  useEffect(() => {
    if (!isStaff) return;
    if (!Number.isFinite(customerId)) {
      setError('Invalid customer ID.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await getCustomer(customerId, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setCustomer(response);
          setFormData(response);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load customer.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [customerId, isStaff]);

  const performSave = useCallback(async () => {
    if (!Number.isFinite(customerId) || !customer) return;
    setIsSaving(true);
    try {
      const updatePayload: UpdateCustomerPayload = {
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
      const response = await updateCustomer(customerId, updatePayload);
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
    if (isSaving) return;
    const confirmed = await showConfirm({
      title: 'Save customer changes?',
      message: 'This will update the customer profile with your current edits.',
      confirmLabel: 'Save',
      cancelLabel: 'Keep editing',
    });
    if (confirmed) await performSave();
  }, [isSaving, performSave, showConfirm]);

  const handleConfirmReset = useCallback(async () => {
    if (isSaving || !customer) return;
    const confirmed = await showConfirm({
      title: 'Reset unsaved changes?',
      message: 'Your current edits will be discarded and values will be restored from the last saved customer record.',
      confirmLabel: 'Reset',
      cancelLabel: 'Continue editing',
      confirmVariant: 'danger',
    });
    if (confirmed) setFormData(customer);
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
            if (customer) setFormData(customer);
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
        hidden: !canMutate,
      }),
      backAction,
    ];
  }, [canMutate, customer, handleConfirmReset, handleConfirmSave, isEditing, isLoading, isSaving, router]);

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
          <CustomerInfoCard
            customer={customer}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            onFormChange={setFormData}
          />
          <CustomerContactCard
            customer={customer}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            onFormChange={setFormData}
            canMutate={canMutate}
            onSuspend={handleSuspend}
            onReinstate={handleReinstate}
          />
          <CustomerDeliveryAddressesCard customerId={customerId} canMutate={canMutate} />
        </ScrollView>
      ) : null}
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
  });
}

