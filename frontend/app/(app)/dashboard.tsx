import { Text } from 'react-native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { useScreenTitle } from '@src/hooks/useScreenTitle';
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { OrderSummaryCards } from '@src/features/dashboard/components/OrderSummaryCards';

export default function DashboardScreen() {
  const { user } = useAuth();
  useScreenTitle('Dashboard');

  const styles = useThemedStyles((theme) => ({
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
  }));

  return (
    <ScreenContent gap={12}>
      <Text style={styles.subtitle}>Welcome {user?.fullName ?? user?.username ?? 'User'}</Text>
      <OrderSummaryCards />
    </ScreenContent>
  );
}
