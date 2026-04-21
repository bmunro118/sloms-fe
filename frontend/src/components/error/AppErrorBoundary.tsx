import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const styles = useThemedStyles(createStyles);

  return <AppErrorBoundaryInner styles={styles}>{children}</AppErrorBoundaryInner>;
}

interface AppErrorBoundaryInnerProps extends AppErrorBoundaryProps {
  styles: ReturnType<typeof createStyles>;
}

class AppErrorBoundaryInner extends React.Component<AppErrorBoundaryInnerProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryInnerProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // Keep verbose stack/details out of production logs.
    if (__DEV__) {
      console.error('Unhandled render error', error);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const { styles } = this.props;

      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>Please try again.</Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: theme.colors.background,
      gap: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    button: {
      marginTop: 8,
      borderRadius: theme.radii.md,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.accent,
    },
    buttonText: {
      color: theme.colors.accentText,
      fontWeight: '700',
    },
  });
}
