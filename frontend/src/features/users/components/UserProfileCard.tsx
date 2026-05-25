import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';
import { UserRecord, UpdateUserPayload, UserRole } from '@src/features/users/api';
import { LinkedCustomerField } from './LinkedCustomerField';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'];

type Props = {
  user: UserRecord;
  isEditing: boolean;
  isSaving: boolean;
  isAdmin: boolean;
  formData: UpdateUserPayload;
  onFormChange: (updater: (prev: UpdateUserPayload) => UpdateUserPayload) => void;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function UserProfileCard({
  user,
  isEditing,
  isSaving,
  isAdmin,
  formData,
  onFormChange,
  onSave,
  onCancelEdit,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.card}>
      <Text style={styles.sectionTitle}>Profile</Text>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Username</Text>
        <Text style={styles.fieldValue}>{user.username ?? '—'}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        {isEditing ? (
          <ThemedInput
            value={formData.fullName ?? ''}
            onChangeText={(text) => onFormChange((f) => ({ ...f, fullName: text }))}
            placeholder="Full name"
            style={styles.input}
          />
        ) : (
          <Text style={styles.fieldValue}>{user.fullName ?? '—'}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Email</Text>
        {isEditing ? (
          <ThemedInput
            value={formData.email ?? ''}
            onChangeText={(text) => onFormChange((f) => ({ ...f, email: text }))}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        ) : (
          <Text style={styles.fieldValue}>{user.email ?? '—'}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Role</Text>
        {isEditing ? (
          <View style={styles.roleRow}>
            {ASSIGNABLE_ROLES.map((role) => (
              <ThemedButton
                key={role}
                label={role}
                onPress={() =>
                  onFormChange((f) => ({
                    ...f,
                    role,
                    linkedCustomerId: role === 'Customer' ? f.linkedCustomerId : null,
                  }))
                }
                variant={formData.role === role ? 'primary' : 'secondary'}
                style={{ minWidth: 90 }}
                tooltip={`Select role: ${role}`}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.fieldValue}>{user.role ?? '—'}</Text>
        )}
      </View>

      {(isEditing ? formData.role : user.role) === 'Customer' ? (
        <LinkedCustomerField
          isEditing={isEditing}
          linkedCustomerId={isEditing ? formData.linkedCustomerId : user.linkedCustomerId}
          onChange={(id) => onFormChange((f) => ({ ...f, linkedCustomerId: id }))}
        />
      ) : null}

      {isEditing ? (
        <View style={styles.editActionsRow}>
          <ThemedButton
            label={isSaving ? 'Saving…' : 'Save Changes'}
            onPress={onSave}
            disabled={isSaving}
            style={styles.actionButton}
          />
          <ThemedButton
            label="Cancel"
            onPress={onCancelEdit}
            variant="secondary"
            disabled={isSaving}
            style={styles.actionButton}
          />
        </View>
      ) : null}
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);
  return StyleSheet.create({
    ...common,
    card: common.card,
    field: { marginTop: theme.spacing.md },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    fieldValue: { fontSize: 15, color: theme.colors.textPrimary },
    input: { marginTop: 2 },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    editActionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      flexWrap: 'wrap',
    },
    actionButton: { flexShrink: 1 },
  });
}
