import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface UserCardData {
  userId: number;
  username?: string;
  role?: string;
  fullName?: string;
  isActive?: boolean;
  isLockedOut?: boolean;
}

interface UserCardProps {
  user: UserCardData;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  const displayName = user.fullName ?? user.username ?? `User #${user.userId}`;

  const handlePress = useCallback(() => {
    router.push(`/(app)/users/${user.userId}` as never);
  }, [user.userId, router]);

  const isInactive = user.isActive === false;
  const isLocked = user.isLockedOut === true;

  return (
    <ThemedCard
      style={[styles.card, isInactive ? styles.cardInactive : null]}
      title={displayName}
      onPress={handlePress}
      tooltip="View user details"
    >
      <View style={styles.metaRow}>
        <Text style={styles.cardMeta}>Role: {user.role ?? 'Unknown'}</Text>
        <View style={styles.badgeRow}>
          {isLocked ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.dangerSurface }]}>
              <Text style={[styles.badgeText, { color: theme.colors.danger }]}>Locked</Text>
            </View>
          ) : null}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isInactive
                  ? theme.colors.dangerSurface
                  : theme.colors.surface,
                borderWidth: 1,
                borderColor: isInactive ? theme.colors.danger : theme.colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isInactive ? theme.colors.danger : theme.colors.accent },
              ]}
            >
              {isInactive ? 'Inactive' : 'Active'}
            </Text>
          </View>
        </View>
      </View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    card: common.card,
    cardInactive: {
      opacity: 0.7,
    },
    cardMeta: common.cardMeta,
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    badge: {
      borderRadius: theme.radii.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.2,
    },
  });
}
