import { Redirect, useRouter } from 'expo-router';
import { Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction, goBackWithBrowserFallback } from '@src/features/app-shell';
import {
  CreateCustomerPayload,
  CreateAddressPayload,
  createCustomer,
  createAddress,
} from '@src/features/customers/api';
import { CustomerInfoCard } from '@src/features/customers/components/CustomerInfoCard';
import { CustomerContactCard } from '@src/features/customers/components/CustomerContactCard';
import { CustomerDeliveryAddressesCard } from '@src/features/customers/components/CustomerDeliveryAddressesCard';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const INITIAL_FORM: CreateCustomerPayload = {
  companyName: '',
  accountNumber: '',
  centreNumber: '',
  invBuildingName: '',
  invAddressLn1: '',
  invAddressLn2: '',
  invTownOrCity: '',
  invCounty: '',
  invPostCode: '',
  contactName: '',
  contactEmail: '',
  reportEmail: '',
  contactPhone: '',
  contactMobile: '',
  contactFax: '',
  band: '',
};

export default function CreateCustomerScreen() {
  const { role } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger, showWarning } = useAppModal();

  const [formData, setFormData] = useState<CreateCustomerPayload>(INITIAL_FORM);
  const [pendingAddresses, setPendingAddresses] = useState<CreateAddressPayload[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback((): string | null => {
    if (!formData.companyName.trim()) return 'Company name is required.';
    return null;
  }, [formData]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(formData) !== JSON.stringify(INITIAL_FORM) ||
      pendingAddresses.length > 0,
    [formData, pendingAddresses],
  );

  const { guardAction, skipNextGuard } = useUnsavedChangesGuard({ isDirty });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      showDanger('Required field', error);
      return;
    }

    // Warn if no delivery addresses are added
    if (pendingAddresses.length === 0) {
      const confirmed = await showConfirm({
        title: 'Warning: Customer has no delivery address',
        message: 'Create customer without a delivery address?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      });
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      // Build trimmed payload
      const payload: CreateCustomerPayload = { companyName: formData.companyName.trim() };
      if (formData.accountNumber?.trim()) payload.accountNumber = formData.accountNumber.trim();
      if (formData.centreNumber?.trim()) payload.centreNumber = formData.centreNumber.trim();
      if (formData.invBuildingName?.trim()) payload.invBuildingName = formData.invBuildingName.trim();
      if (formData.invAddressLn1?.trim()) payload.invAddressLn1 = formData.invAddressLn1.trim();
      if (formData.invAddressLn2?.trim()) payload.invAddressLn2 = formData.invAddressLn2.trim();
      if (formData.invTownOrCity?.trim()) payload.invTownOrCity = formData.invTownOrCity.trim();
      if (formData.invCounty?.trim()) payload.invCounty = formData.invCounty.trim();
      if (formData.invPostCode?.trim()) payload.invPostCode = formData.invPostCode.trim();
      if (formData.contactName?.trim()) payload.contactName = formData.contactName.trim();
      if (formData.contactEmail?.trim()) payload.contactEmail = formData.contactEmail.trim();
      if (formData.reportEmail?.trim()) payload.reportEmail = formData.reportEmail.trim();
      if (formData.contactPhone?.trim()) payload.contactPhone = formData.contactPhone.trim();
      if (formData.contactMobile?.trim()) payload.contactMobile = formData.contactMobile.trim();
      if (formData.contactFax?.trim()) payload.contactFax = formData.contactFax.trim();
      if (formData.band?.trim()) payload.band = formData.band.trim();

      const newCustomer = await createCustomer(payload);

      // Save pending delivery addresses
      const addressErrors: string[] = [];
      for (const addr of pendingAddresses) {
        try {
          await createAddress(newCustomer.customerId, addr);
        } catch (err) {
          addressErrors.push(err instanceof Error ? err.message : 'Unknown error saving address');
        }
      }

      if (addressErrors.length > 0) {
        showWarning(
          'Some addresses failed to save',
          addressErrors.join('\n'),
        );
      }

      showSuccess('Customer created', `${formData.companyName.trim()} has been created successfully.`);
      skipNextGuard();
      router.replace('/(app)/customers' as never);
    } catch (err) {
      showDanger('Create failed', err instanceof Error ? err.message : 'Failed to create customer.');
    } finally {
      setIsSaving(false);
    }
  }, [formData, pendingAddresses, validate, showConfirm, showSuccess, showDanger, showWarning, router, skipNextGuard]);

  const topBarActions = useMemo<TopBarAction[]>(() => [
    buildBackTopBarAction({ onPress: () => void guardAction(goBackWithBrowserFallback) }),
    buildIconTopBarAction({
      id: 'save-new-customer',
      label: 'Save customer',
      onPress: handleSave,
      icon: SaveIcon,
      disabled: isSaving,
    }),
  ], [handleSave, isSaving, guardAction]);

  useScreenTopBar({ title: 'Create Customer', actions: topBarActions });

  if (role !== 'Admin' && role !== 'Manager') {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <CustomerInfoCard
          mode="create"
          isSaving={isSaving}
          formData={formData}
          onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data as Partial<CreateCustomerPayload> }))}
        />
        <CustomerContactCard
          mode="create"
          isSaving={isSaving}
          formData={formData}
          onFormChange={(data) => setFormData((prev) => ({ ...prev, ...data as Partial<CreateCustomerPayload> }))}
          canMutate={true}
        />
        <CustomerDeliveryAddressesCard
          mode="create"
          canMutate={true}
          pendingAddresses={pendingAddresses}
          onPendingAddressesChange={setPendingAddresses}
        />
      </ScrollView>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
  });
}
