import { StyleSheet, Text, View } from 'react-native';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

interface Props {
  codes: string[];
}

/**
 * Renders the one-time recovery codes shown once after TOTP enrollment. The
 * caller is responsible for the "I've saved these" acknowledgement.
 */
export function RecoveryCodesPanel({ codes }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container} testID="twofa-recovery-codes">
      <Text style={styles.heading}>Save your recovery codes</Text>
      <Text style={styles.body}>
        Each code can be used once to sign in if you lose access to your authenticator.
        Store them somewhere safe — they will not be shown again.
      </Text>
      <View style={styles.grid}>
        {codes.map((code) => (
          <Text key={code} style={styles.code} selectable>
            {code}
          </Text>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      gap: 10,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    heading: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    body: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 15,
      letterSpacing: 1,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      minWidth: '46%',
      textAlign: 'center',
    },
  });
}
