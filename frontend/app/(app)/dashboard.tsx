import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useScreenTitle } from '@src/hooks/useScreenTitle';

export default function DashboardScreen() {
  const { user, role } = useAuth();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  useScreenTitle('Dashboard');

  return (
    <ScreenContent gap={8}>
      <Text style={styles.subtitle}>Welcome {user?.fullName ?? user?.username ?? 'User'}</Text>
      <Text style={styles.body}>Current role: {role}</Text>
      <Text style={styles.body}>Use the left navigation to access your allowed modules.</Text>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    body: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
  });
}
