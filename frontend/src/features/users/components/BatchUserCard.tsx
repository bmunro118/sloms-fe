import { CheckSquare2, Eye, EyeOff, Square, Trash2 } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { buildIconTopBarAction } from '@src/features/app-shell';
import { CreateUserPayload, UserRole } from '@src/features/users/api';
import { BatchCardState } from '@src/features/users/types';
import { LinkedCustomerField } from '@src/features/users/components/LinkedCustomerField';
import { generatePassword } from '@src/features/users/utils/generatePassword';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'];

type Props = {
  index: number;
  state: BatchCardState;
  totalCount: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onFormChange: (updater: (prev: CreateUserPayload) => CreateUserPayload) => void;
  onPasswordRevealChange: (revealed: boolean) => void;
  onValidationErrorChange: (err: string | null) => void;
};

export function BatchUserCard({
  index,
  state,
  totalCount,
  isSelected,
  onToggleSelect,
  onDelete,
  onFormChange,
  onPasswordRevealChange,
  onValidationErrorChange,
}: Props) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const isCustomer = state.form.role === 'Customer';

  const handleUsernameChange = useCallback(
    (text: string) => {
      onValidationErrorChange(null);
      onFormChange((prev) => ({ ...prev, username: text }));
    },
    [onFormChange, onValidationErrorChange],
  );

  const handleFieldChange = useCallback(
    <K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]) => {
      onValidationErrorChange(null);
      onFormChange((prev) => ({ ...prev, [key]: value }));
    },
    [onFormChange, onValidationErrorChange],
  );

  const handleGeneratePassword = useCallback(() => {
    onValidationErrorChange(null);
    onFormChange((prev) => ({ ...prev, password: generatePassword() }));
    onPasswordRevealChange(true);
  }, [onFormChange, onValidationErrorChange, onPasswordRevealChange]);

  const handleRoleChange = useCallback(
    (role: UserRole) => {
      onValidationErrorChange(null);
      onFormChange((prev) => ({
        ...prev,
        role,
        linkedCustomerId: role === 'Customer' ? prev.linkedCustomerId : null,
      }));
    },
    [onFormChange, onValidationErrorChange],
  );

  const actions = useMemo(
    () => [
      buildIconTopBarAction({
        id: `select-user-card-${state.id}`,
        label: isSelected ? 'Deselect card' : 'Select card',
        onPress: onToggleSelect,
        icon: isSelected ? CheckSquare2 : Square,
      }),
      buildIconTopBarAction({
        id: `delete-user-card-${state.id}`,
        label: 'Delete card',
        onPress: onDelete,
        icon: Trash2,
        disabled: totalCount <= 1,
      }),
    ],
    [isSelected, onToggleSelect, onDelete, state.id, totalCount],
  );

  return (
    <ThemedCard
      title={`User ${index + 1}`}
      actions={actions}
      style={styles.card}
    >
      {/* Validation error banner */}
      {state.validationError ? (
        <View style={styles.validationBanner}>
          <Text style={styles.validationText}>{state.validationError}</Text>
        </View>
      ) : null}

      {/* 1. Username */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Username *</Text>
        <ThemedInput
          value={state.form.username}
          onChangeText={handleUsernameChange}
          placeholder={isCustomer ? 'e.g. jsmith@example.com' : 'e.g. jsmith'}
          keyboardType={isCustomer ? 'email-address' : 'default'}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isCustomer ? (
          <Text style={styles.fieldHint}>
            Customers sign in with their email address — enter a valid email as the
            username.
          </Text>
        ) : null}
      </View>

      {/* 2. Full Name */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Full Name *</Text>
        <ThemedInput
          value={state.form.fullName}
          onChangeText={(text) => handleFieldChange('fullName', text)}
          placeholder="e.g. John Smith"
        />
      </View>

      {/* 3. Password */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Password *</Text>
        <ThemedInput
          value={state.form.password}
          onChangeText={(text) => {
            onPasswordRevealChange(false);
            handleFieldChange('password', text);
          }}
          placeholder="Temporary password"
          secureTextEntry={!state.passwordRevealed}
          rightAccessory={
            <ThemedButton
              variant="icon"
              icon={
                state.passwordRevealed
                  ? <EyeOff size={18} color={theme.colors.navTextStrong} />
                  : <Eye size={18} color={theme.colors.navTextStrong} />
              }
              onPress={() => onPasswordRevealChange(!state.passwordRevealed)}
              hideBorder
              fillMode
              tooltip={state.passwordRevealed ? 'Hide password' : 'Show password'}
            />
          }
        />
        <Text style={styles.fieldHint}>
          Min. 8 characters — must include uppercase, lowercase, number, and special
          character (e.g. Password1!)
        </Text>
        <ThemedButton
          label="Generate Temporary Password"
          onPress={handleGeneratePassword}
          variant="secondary"
          style={styles.generateButton}
          tooltip="Generate a random password that meets complexity requirements"
        />
      </View>

      {/* 4. Role */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Role *</Text>
        <View style={styles.roleRow}>
          {ASSIGNABLE_ROLES.map((role) => (
            <ThemedButton
              key={role}
              label={role}
              onPress={() => handleRoleChange(role)}
              variant={state.form.role === role ? 'primary' : 'secondary'}
              style={styles.roleButton}
              tooltip={`Select role: ${role}`}
            />
          ))}
        </View>
      </View>

      {/* 5. Linked Customer Account (Customer role only) */}
      {state.form.role === 'Customer' ? (
        <LinkedCustomerField
          isEditing
          linkedCustomerId={state.form.linkedCustomerId}
          onChange={(id) => handleFieldChange('linkedCustomerId', id)}
        />
      ) : null}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
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
    roleButton: {
      minWidth: 90,
    },
    validationBanner: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
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
