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
import { CreateUserPayload, UserRole, createUser } from '@src/features/users/api';
import { LinkedCustomerField } from '@src/features/users/components/LinkedCustomerField';
import { generatePassword } from '@src/features/users/utils/generatePassword';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'];

const INITIAL_FORM: CreateUserPayload = {
  username: '',
  fullName: '',
  email: '',
  role: 'Operative',
  password: '',
  linkedCustomerId: null,
};

export default function CreateUserScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const { showSuccess, showDanger } = useAppModal();

  const [form, setForm] = useState<CreateUserPayload>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordRevealed, setPasswordRevealed] = useState(false);

  const setField = useCallback(<K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]) => {
    setValidationError(null);
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handleGeneratePassword = useCallback(() => {
    setValidationError(null);
    setForm((f) => ({ ...f, password: generatePassword() }));
    setPasswordRevealed(true);
  }, []);

  const validate = useCallback((): string | null => {
    if (!form.username.trim()) return 'Username is required.';
    if (/\s/.test(form.username)) return 'Username must not contain spaces.';
    if (!/^[a-zA-Z0-9_.\-]+$/.test(form.username.trim())) return 'Username may only contain letters, numbers, underscores, hyphens, and dots.';
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.password.trim()) return 'Password is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(form.password)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number.';
    if (!/[^a-zA-Z0-9]/.test(form.password)) return 'Password must contain at least one special character (e.g. !@#$).';
    if (!form.role) return 'Role is required.';
    if (form.role === 'Customer' && !form.linkedCustomerId) return 'A linked customer account is required for Customer users.';
    return null;
  }, [form]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setIsSaving(true);
    try {
      await createUser({
        username: form.username.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
        ...(form.role === 'Customer' ? { linkedCustomerId: form.linkedCustomerId } : {}),
      });
      showSuccess('User created', `${form.fullName.trim()} has been created successfully.`);
      router.replace('/(app)/users' as never);
    } catch (err) {
      showDanger('Create failed', err instanceof Error ? err.message : 'Failed to create user.');
    } finally {
      setIsSaving(false);
    }
  }, [form, validate, showSuccess, showDanger, router]);

  const topBarActions = useMemo<TopBarAction[]>(() => [
    buildBackTopBarAction({ onPress: () => router.back() }),
    buildIconTopBarAction({
      id: 'save-new-user',
      label: 'Save user',
      onPress: handleSave,
      icon: SaveIcon,
      disabled: isSaving,
    }),
  ], [handleSave, isSaving, router]);

  useScreenTopBar({ title: 'Create User', actions: topBarActions });

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemedCard style={styles.card}>
          <Text style={styles.sectionTitle}>New User Details</Text>

          {validationError ? (
            <View style={styles.validationBanner}>
              <Text style={styles.validationText}>{validationError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username *</Text>
            <ThemedInput
              value={form.username}
              onChangeText={(text) => setField('username', text)}
              placeholder="e.g. jsmith"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            <ThemedInput
              value={form.fullName}
              onChangeText={(text) => setField('fullName', text)}
              placeholder="e.g. John Smith"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email *</Text>
            <ThemedInput
              value={form.email}
              onChangeText={(text) => setField('email', text)}
              placeholder="e.g. jsmith@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password *</Text>
            <ThemedInput
              value={form.password}
              onChangeText={(text) => {
                setPasswordRevealed(false);
                setField('password', text);
              }}
              placeholder="Temporary password"
              secureTextEntry={!passwordRevealed}
              style={styles.input}
            />
            <Text style={styles.fieldHint}>
              Min. 8 characters — must include uppercase, lowercase, number, and special character (e.g. Password1!)
            </Text>
            <ThemedButton
              label="Generate Temporary Password"
              onPress={handleGeneratePassword}
              variant="secondary"
              style={styles.generateButton}
              tooltip="Generate a random password that meets complexity requirements"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Role *</Text>
            <View style={styles.roleRow}>
              {ASSIGNABLE_ROLES.map((role) => (
                <ThemedButton
                  key={role}
                  label={role}
                  onPress={() => {
                    setValidationError(null);
                    setForm((f) => ({
                      ...f,
                      role,
                      linkedCustomerId: role === 'Customer' ? f.linkedCustomerId : null,
                    }));
                  }}
                  variant={form.role === role ? 'primary' : 'secondary'}
                  style={{ minWidth: 90 }}
                  tooltip={`Select role: ${role}`}
                />
              ))}
            </View>
          </View>

          {form.role === 'Customer' ? (
            <LinkedCustomerField
              isEditing
              linkedCustomerId={form.linkedCustomerId}
              onChange={(id) => setForm((f) => ({ ...f, linkedCustomerId: id }))}
            />
          ) : null}
        </ThemedCard>
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
    card: common.card,
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
    fieldHint: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
      lineHeight: 16,
    },
    generateButton: {
      marginTop: theme.spacing.sm,
      alignSelf: 'flex-start',
    },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
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

  });
}
