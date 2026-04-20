import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function GuardedRoot() {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loaderText}>Loading session...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated && <Stack.Screen name="index" />}
      {isAuthenticated && role === 'admin' && <Stack.Screen name="(admin)" />}
      {isAuthenticated && role === 'client' && <Stack.Screen name="(client)" />}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GuardedRoot />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loaderText: {
    fontSize: 16,
    color: '#334155',
  },
});
