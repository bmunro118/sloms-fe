import { ChevronDown } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemedButton } from '@components/ui/ThemedButton';
import { ThemedCard } from '@components/ui/ThemedCard';
import { ThemedInput } from '@components/ui/ThemedInput';
import { LinkedCustomerField } from '@src/features/users/components/LinkedCustomerField';
import { BatchUserDefaults, UserRole } from '@src/features/users/types';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

const ASSIGNABLE_ROLES: UserRole[] = ['Admin', 'Manager', 'Operative', 'ReadOnly', 'Customer'];

type Props = {
  expanded: boolean;
  onToggleExpanded: () => void;
  count: number;
  onCountChange: (n: number) => void;
  defaults: BatchUserDefaults;
  onDefaultsChange: (updater: (prev: BatchUserDefaults) => BatchUserDefaults) => void;
  onGenerate: () => void;
  onSetSelected: () => void;
  onSetAll: () => void;
  selectedCount: number;
  totalCards: number;
};

export function BatchUserSetupCard({
  expanded,
  onToggleExpanded,
  count,
  onCountChange,
  defaults,
  onDefaultsChange,
  onGenerate,
  onSetSelected,
  onSetAll,
  selectedCount,
  totalCards: _totalCards,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();

  // Animated values for smooth expand/collapse transitions
  const animatedHeight = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const animatedOpacity = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const chevronRotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  // Interpolated chevron rotation (0deg collapsed → 180deg expanded)
  const chevronRotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Animate card expand/collapse (mirrors NavLayout sidebar animation pattern)
  const animateCardExpansion = useCallback(
    (isExpanded: boolean) => {
      animatedHeight.stopAnimation();
      animatedOpacity.stopAnimation();
      chevronRotation.stopAnimation();

      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: isExpanded ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: isExpanded ? 1 : 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotation, {
          toValue: isExpanded ? 1 : 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [animatedHeight, animatedOpacity, chevronRotation]
  );

  useEffect(() => {
    animateCardExpansion(expanded);
  }, [animateCardExpansion, expanded]);

  const countString = count.toString();
  const countError = count < 1 || count > 20 || !Number.isInteger(count)
    ? 'Enter a number between 1 and 20.'
    : null;

  const handleCountChange = useCallback((text: string) => {
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      onCountChange(parsed);
    } else if (text === '') {
      onCountChange(0);
    }
  }, [onCountChange]);

  return (
    <ThemedCard style={styles.card}>
      {/* Header: title + expand/collapse button on the same row */}
      <View style={[styles.cardHeader, !expanded && styles.cardHeaderCollapsed]}>
        <Text style={styles.cardTitle}>Batch User Setup</Text>
        <ThemedButton
          variant="icon"
          icon={
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <ChevronDown size={16} color={theme.colors.navTextStrong} />
            </Animated.View>
          }
          onPress={onToggleExpanded}
          tooltip={expanded ? 'Collapse batch setup' : 'Expand batch setup'}
          style={styles.toggleButton}
        />
      </View>
      <Animated.View
        style={[
          styles.contentContainer,
          {
            height: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, contentHeight],
              extrapolate: 'clamp',
            }),
            opacity: animatedOpacity,
          },
        ]}
      >
        <View
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            setContentHeight(height);
          }}
          style={styles.contentInner}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.contentScrollView}>
          {/* 1. Default Role */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Default Role</Text>
            <View style={styles.roleRow}>
              {ASSIGNABLE_ROLES.map((role) => (
                <ThemedButton
                  key={role}
                  label={role}
                  onPress={() =>
                    onDefaultsChange((prev) => ({
                      ...prev,
                      role,
                      linkedCustomerId: role === 'Customer' ? prev.linkedCustomerId : null,
                    }))
                  }
                  variant={defaults.role === role ? 'primary' : 'secondary'}
                  style={styles.roleButton}
                  tooltip={`Select role: ${role}`}
                />
              ))}
            </View>
          </View>

          {/* 2. Linked Customer Account (Customer role only) */}
          {defaults.role === 'Customer' ? (
            <LinkedCustomerField
              isEditing
              linkedCustomerId={defaults.linkedCustomerId}
              onChange={(id) =>
                onDefaultsChange((prev) => ({ ...prev, linkedCustomerId: id }))
              }
            />
          ) : null}

          {/* 3. Password Strategy */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password Strategy</Text>
            <View style={styles.strategyRow}>
              <ThemedButton
                label="Generate individually"
                onPress={() =>
                  onDefaultsChange((prev) => ({
                    ...prev,
                    passwordStrategy: 'generate',
                    sharedPassword: '',
                  }))
                }
                variant={defaults.passwordStrategy === 'generate' ? 'primary' : 'secondary'}
                style={styles.strategyButton}
              />
              <ThemedButton
                label="Set shared password"
                onPress={() =>
                  onDefaultsChange((prev) => ({
                    ...prev,
                    passwordStrategy: 'shared',
                  }))
                }
                variant={defaults.passwordStrategy === 'shared' ? 'primary' : 'secondary'}
                style={styles.strategyButton}
              />
            </View>
          </View>

          {/* 4. Shared password input */}
          {defaults.passwordStrategy === 'shared' ? (
            <View style={styles.field}>
              <ThemedInput
                value={defaults.sharedPassword}
                onChangeText={(text) =>
                  onDefaultsChange((prev) => ({ ...prev, sharedPassword: text }))
                }
                placeholder="Enter shared password"
                secureTextEntry
              />
              <Text style={styles.fieldHint}>
                All generated cards will use this password.
              </Text>
            </View>
          ) : null}

          {/* 5. Informational note */}
          <Text style={styles.infoNote}>
            All created users will be required to set a new password on first login.
          </Text>

          {/* 6. Amount + action buttons */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <ThemedInput
              value={countString}
              onChangeText={handleCountChange}
              placeholder="1–20"
              keyboardType="numeric"
            />
            {countError ? <Text style={styles.errorText}>{countError}</Text> : null}
          </View>

          <View style={styles.actionRow}>
            <ThemedButton
              label="Generate New"
              onPress={onGenerate}
              variant="solid"
              style={styles.actionButton}
              disabled={countError !== null}
            />
            <ThemedButton
              label="Set Selected"
              onPress={onSetSelected}
              variant="secondary"
              style={styles.actionButton}
              disabled={selectedCount === 0}
              tooltip={selectedCount === 0 ? 'Select cards first' : `Apply defaults to ${selectedCount} selected card(s)`}
            />
            <ThemedButton
              label="Set All"
              onPress={onSetAll}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
          </ScrollView>
        </View>
      </Animated.View>
    </ThemedCard>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
    },
    contentContainer: {
      overflow: 'hidden',
    },
    contentInner: {
      paddingBottom: theme.spacing.xs,
    },
    contentScrollView: {
      flex: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    cardHeaderCollapsed: {
      marginBottom: 0,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    toggleButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      borderWidth: 1,
      borderColor: theme.colors.navBorder,
    },
    field: {
      marginTop: theme.spacing.md,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: theme.spacing.xs,
    },
    fieldHint: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
      lineHeight: 16,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.danger,
      marginTop: theme.spacing.xs,
    },
    roleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    roleButton: {
      minWidth: 90,
    },
    strategyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    strategyButton: {
      flex: 1,
      minWidth: 140,
    },
    infoNote: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
      fontStyle: 'italic',
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    actionButton: {
      flex: 1,
      minWidth: 110,
    },
  });
}
