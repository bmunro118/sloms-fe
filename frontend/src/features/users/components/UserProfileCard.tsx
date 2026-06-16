import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedInput } from '@components/ui/ThemedInput';
import { FieldPair } from '@components/ui/FieldPair';
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
  isAdmin: boolean;
  formData: UpdateUserPayload;
  onFormChange: (updater: (prev: UpdateUserPayload) => UpdateUserPayload) => void;
};

export function UserProfileCard({
  user,
  isEditing,
  isAdmin,
  formData,
  onFormChange,
}: Props) {
  const { width } = useWindowDimensions();
  const isCompact = width < 768 || isEditing;
  const styles = useThemedStyles(createStyles);

  return (
    <ThemedCard style={styles.card}>
      <Text style={styles.sectionTitle}>Profile</Text>

      <FieldPair
        compact={isCompact}
        left={
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <Text style={styles.fieldValue}>{user.username ?? '—'}</Text>
          </View>
        }
        right={
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
        }
      />

      <FieldPair
        compact={isCompact}
        left={
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
        }
        right={
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
        }
      />

      {(isEditing ? formData.role : user.role) === 'Customer' ? (
        <LinkedCustomerField
          isEditing={isEditing}
          linkedCustomerId={isEditing ? formData.linkedCustomerId : user.linkedCustomerId}
          onChange={(id) => onFormChange((f) => ({ ...f, linkedCustomerId: id }))}
        />
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
    fieldLabel: common.fieldLabel,
    fieldValue: common.fieldValue,
    input: { marginTop: 2 },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
  });
}
