import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { ThemedInput } from '@components/ui/ThemedInput';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { CustomerRecord } from '../api';
import type { OnboardCustomerPayload } from '../api';

type Props = {
  visible: boolean;
  customer: CustomerRecord;
  onConfirm: (payload: OnboardCustomerPayload) => Promise<void>;
  onClose: () => void;
};

export function OnboardCustomerModal({ visible, customer, onConfirm, onClose }: Props) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail(customer.contactEmail ?? '');
      setFullName(customer.contactName ?? '');
      setIsSubmitting(false);
    }
  }, [visible, customer.contactEmail, customer.contactName]);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        email: email.trim() || undefined,
        fullName: fullName.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropPress = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleBackdropPress}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
        <View style={styles.panel}>
          <View style={styles.headerTop}>
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>Portal Access</Text>
            </View>
            <View style={styles.iconWrap}>
              <UserPlus size={20} color={theme.colors.accent} />
            </View>
          </View>

          <Text style={styles.title}>Onboard to Portal</Text>
          <Text style={styles.message}>
            A portal login will be created for{' '}
            <Text style={styles.messageBold}>{customer.companyName}</Text> and a welcome email
            sent with first-login credentials.
          </Text>
          <Text style={styles.message}>
            Override the email or display name below, or leave as-is to use the customer's
            contact details.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Login email</Text>
            <ThemedInput
              placeholder="contact@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <ThemedInput
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionSecondary,
                isSubmitting && styles.actionDisabled,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionText, styles.actionTextSecondary]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => { void handleConfirm(); }}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionPrimary,
                isSubmitting && styles.actionDisabled,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionText, styles.actionTextPrimary]}>
                {isSubmitting ? 'Sending…' : 'Send Welcome Email'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  const accentAlpha = theme.isDark ? '3d' : '24';
  const chipBg = `${theme.colors.accent}${accentAlpha}`;

  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    panel: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 480,
      borderRadius: theme.radii.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    iconWrap: { flexShrink: 0 },
    typeChip: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.sm,
      backgroundColor: chipBg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
    },
    typeChipText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    message: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    messageBold: {
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    fieldGroup: { gap: 6 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      minWidth: 104,
      minHeight: 38,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    actionSecondary: {
      backgroundColor: theme.colors.buttonSecondaryBackground,
      borderColor: theme.colors.buttonSecondaryBorder,
    },
    actionPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.97 }],
    },
    actionDisabled: { opacity: 0.65 },
    actionText: { fontSize: 14, fontWeight: '700' },
    actionTextPrimary: { color: theme.colors.accentText },
    actionTextSecondary: { color: theme.colors.buttonSecondaryText },
    ...(Platform.OS === 'web' ? {} : {}),
  });
}
