import { Redirect, useRouter } from 'expo-router';
import { Save as SaveIcon } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { CreateCustomerPayload, createCustomer } from '@src/features/customers/api';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
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
  const styles = useThemedStyles(createStyles);
  const { showConfirm, showSuccess, showDanger } = useAppModal();

  const [form, setForm] = useState<CreateCustomerPayload>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof CreateCustomerPayload>(key: K, value: CreateCustomerPayload[K]) => {
    setValidationError(null);
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const validate = useCallback((): string | null => {
    if (!form.companyName.trim()) return 'Company name is required.';
    return null;
  }, [form]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      showDanger('Required field', error);
      return;
    }

    const confirmed = await showConfirm({
      title: 'Warning: Customer has no delivery address',
      message: 'Create customer without a delivery address?',
      confirmLabel: 'Yes',
      cancelLabel: 'No',
    });
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateCustomerPayload = { companyName: form.companyName.trim() };

      // Include optional fields only when they have content
      if (form.accountNumber?.trim()) payload.accountNumber = form.accountNumber.trim();
      if (form.centreNumber?.trim()) payload.centreNumber = form.centreNumber.trim();
      if (form.invBuildingName?.trim()) payload.invBuildingName = form.invBuildingName.trim();
      if (form.invAddressLn1?.trim()) payload.invAddressLn1 = form.invAddressLn1.trim();
      if (form.invAddressLn2?.trim()) payload.invAddressLn2 = form.invAddressLn2.trim();
      if (form.invTownOrCity?.trim()) payload.invTownOrCity = form.invTownOrCity.trim();
      if (form.invCounty?.trim()) payload.invCounty = form.invCounty.trim();
      if (form.invPostCode?.trim()) payload.invPostCode = form.invPostCode.trim();
      if (form.contactName?.trim()) payload.contactName = form.contactName.trim();
      if (form.contactEmail?.trim()) payload.contactEmail = form.contactEmail.trim();
      if (form.reportEmail?.trim()) payload.reportEmail = form.reportEmail.trim();
      if (form.contactPhone?.trim()) payload.contactPhone = form.contactPhone.trim();
      if (form.contactMobile?.trim()) payload.contactMobile = form.contactMobile.trim();
      if (form.contactFax?.trim()) payload.contactFax = form.contactFax.trim();
      if (form.band?.trim()) payload.band = form.band.trim();

      console.log('[CustomerCreate] Submitting payload:', payload);
      await createCustomer(payload);
      showSuccess('Customer created', `${form.companyName.trim()} has been created successfully.`);
      router.replace('/(app)/customers' as never);
    } catch (err) {
      console.error('[CustomerCreate] API error:', err);
      showDanger('Create failed', err instanceof Error ? err.message : 'Failed to create customer.');
    } finally {
      setIsSaving(false);
    }
  }, [form, validate, showConfirm, showSuccess, showDanger, router]);

  const topBarActions = useMemo<TopBarAction[]>(() => [
    buildBackTopBarAction({ onPress: () => router.back() }),
    buildIconTopBarAction({
      id: 'save-new-customer',
      label: 'Save customer',
      onPress: handleSave,
      icon: SaveIcon,
      disabled: isSaving,
    }),
  ], [handleSave, isSaving, router]);

  useScreenTopBar({ title: 'Create Customer', actions: topBarActions });

  if (role !== 'Admin' && role !== 'Manager') {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Company Information */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          {validationError ? (
            <View style={styles.validationBanner}>
              <Text style={styles.validationText}>{validationError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Company Name *</Text>
            <ThemedInput
              value={form.companyName}
              onChangeText={(text) => setField('companyName', text)}
              placeholder="e.g. Acme Hearing Ltd"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Account Number</Text>
            <ThemedInput
              value={form.accountNumber ?? ''}
              onChangeText={(text) => setField('accountNumber', text)}
              placeholder="e.g. ACC-001"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Centre Number</Text>
            <ThemedInput
              value={form.centreNumber ?? ''}
              onChangeText={(text) => setField('centreNumber', text)}
              placeholder="e.g. C001"
              style={styles.input}
            />
          </View>
        </ThemedCard>

        {/* Invoice Address */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice Address</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Building Name</Text>
            <ThemedInput
              value={form.invBuildingName ?? ''}
              onChangeText={(text) => setField('invBuildingName', text)}
              placeholder="e.g. Acme House"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Address Line 1</Text>
            <ThemedInput
              value={form.invAddressLn1 ?? ''}
              onChangeText={(text) => setField('invAddressLn1', text)}
              placeholder="e.g. 12 High Street"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Address Line 2</Text>
            <ThemedInput
              value={form.invAddressLn2 ?? ''}
              onChangeText={(text) => setField('invAddressLn2', text)}
              placeholder="e.g. Deansgate"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Town / City</Text>
            <ThemedInput
              value={form.invTownOrCity ?? ''}
              onChangeText={(text) => setField('invTownOrCity', text)}
              placeholder="e.g. Manchester"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>County</Text>
            <ThemedInput
              value={form.invCounty ?? ''}
              onChangeText={(text) => setField('invCounty', text)}
              placeholder="e.g. Greater Manchester"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Postcode</Text>
            <ThemedInput
              value={form.invPostCode ?? ''}
              onChangeText={(text) => setField('invPostCode', text)}
              placeholder="e.g. M1 1AA"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>
        </ThemedCard>

        {/* Contact Information */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Contact Name</Text>
            <ThemedInput
              value={form.contactName ?? ''}
              onChangeText={(text) => setField('contactName', text)}
              placeholder="e.g. Jane Doe"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <ThemedInput
              value={form.contactEmail ?? ''}
              onChangeText={(text) => setField('contactEmail', text)}
              placeholder="e.g. jane.doe@acme.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Report Email</Text>
            <ThemedInput
              value={form.reportEmail ?? ''}
              onChangeText={(text) => setField('reportEmail', text)}
              placeholder="e.g. reports@acme.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <ThemedInput
              value={form.contactPhone ?? ''}
              onChangeText={(text) => setField('contactPhone', text)}
              placeholder="e.g. 0161 000 0000"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Mobile</Text>
            <ThemedInput
              value={form.contactMobile ?? ''}
              onChangeText={(text) => setField('contactMobile', text)}
              placeholder="e.g. 07700 900000"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Fax</Text>
            <ThemedInput
              value={form.contactFax ?? ''}
              onChangeText={(text) => setField('contactFax', text)}
              placeholder="e.g. 0161 000 0001"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
        </ThemedCard>

        {/* Pricing */}
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price Band</Text>
            <ThemedInput
              value={form.band ?? ''}
              onChangeText={(text) => setField('band', text)}
              placeholder="e.g. NHS1"
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>
        </ThemedCard>

        {/* Submit actions */}
        <View style={styles.submitRow}>
          <ThemedButton
            label={isSaving ? 'Creating…' : 'Create Customer'}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.submitButton}
          />
          <ThemedButton
            label="Cancel"
            onPress={() => router.back()}
            variant="secondary"
            disabled={isSaving}
            style={styles.submitButton}
          />
        </View>

      </ScrollView>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    card: {
      ...common.card,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    field: {
      marginTop: theme.spacing.md,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    input: {
      marginTop: 2,
    },
    validationBanner: {
      marginTop: theme.spacing.md,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.dangerSurface,
      borderWidth: 1,
      borderColor: theme.colors.danger,
      padding: theme.spacing.md,
    },
    validationText: {
      color: theme.colors.danger,
      fontSize: 14,
      fontWeight: '600',
    },
    submitRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    submitButton: {
      minWidth: 120,
    },
  });
}
