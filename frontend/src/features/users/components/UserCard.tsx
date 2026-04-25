import { Text } from 'react-native';
import { ThemedCard } from '@components/ui/ThemedCard';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

export interface UserCardData {
  id: number;
  username?: string;
  role?: string;
  fullName?: string;
}

interface UserCardProps {
  user: UserCardData;
}

export function UserCard({ user }: UserCardProps) {
  const styles = useThemedStyles(createStyles);

  const displayName = user.fullName ?? user.username ?? `User #${user.id}`;

  return (
    <ThemedCard
      style={styles.card}
      title={displayName}
    >
      <Text style={styles.cardMeta}>Role: {user.role ?? 'Unknown'}</Text>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return {
    card: common.card,
    cardMeta: common.cardMeta,
  };
}
