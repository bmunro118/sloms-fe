import { Redirect, useRouter } from 'expo-router';
import { CheckCheck as CheckCheckIcon, Save as SaveIcon, Trash2 as Trash2Icon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContent } from '@components/layout/ScreenContent';
import { useAuth } from '@context/AuthContext';
import { TopBarAction } from '@context/ScreenTitleContext';
import { buildBackTopBarAction, buildIconTopBarAction } from '@src/features/app-shell';
import { CreateUserPayload, createUser } from '@src/features/users/api';
import { BatchUserCard } from '@src/features/users/components/BatchUserCard';
import { BatchUserSetupCard } from '@src/features/users/components/BatchUserSetupCard';
import {
  BatchCardState,
  BatchUserDefaults,
  INITIAL_BATCH_DEFAULTS,
  buildEmptyCard,
} from '@src/features/users/types';
import { generatePassword } from '@src/features/users/utils/generatePassword';
import { useAppModal } from '@src/hooks/useAppModal';
import { useScreenTopBar } from '@src/hooks/useScreenTopBar';
import { useUnsavedChangesGuard } from '@src/hooks/useUnsavedChangesGuard';
import { useAppTheme } from '@theme/ThemeProvider';
import { createCommonScreenStyleDefinitions } from '@theme/stylePresets';
import { AppTheme } from '@theme/types';
import { useThemedStyles } from '@theme/useThemedStyles';

function validateCard(form: CreateUserPayload): string | null {
  if (!form.username.trim()) return 'Username is required.';
  if (/\s/.test(form.username)) return 'Username must not contain spaces.';
  if (!/^[a-zA-Z0-9_.\-]+$/.test(form.username.trim()))
    return 'Username may only contain letters, numbers, underscores, hyphens, and dots.';
  if (!form.fullName.trim()) return 'Full name is required.';
  if (!form.email.trim()) return 'Email is required.';
  if (!form.password.trim()) return 'Password is required.';
  if (form.password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(form.password))
    return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(form.password))
    return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(form.password))
    return 'Password must contain at least one number.';
  if (!/[^a-zA-Z0-9]/.test(form.password))
    return 'Password must contain at least one special character (e.g. !@#$).';
  if (!form.role) return 'Role is required.';
  if (form.role === 'Customer' && !form.linkedCustomerId)
    return 'A linked customer account is required for Customer users.';
  return null;
}

export default function CreateUserScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const theme = useAppTheme();
  const { showSuccess, showDanger, showConfirm } = useAppModal();

  const [batchExpanded, setBatchExpanded] = useState(false);
  const [batchDefaults, setBatchDefaults] =
    useState<BatchUserDefaults>(INITIAL_BATCH_DEFAULTS);
  const [batchCount, setBatchCount] = useState(1);
  const [cards, setCards] = useState<BatchCardState[]>(() => [
    buildEmptyCard(0, INITIAL_BATCH_DEFAULTS),
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string | null>(null);

  // ── isDirty ─────────────────────────────────────────────────────────────────
  const isDirty = useMemo(
    () =>
      cards.some((c) =>
        Object.values(c.form).some(
          (v) => v !== '' && v !== null && v !== 'Operative',
        ),
      ),
    [cards],
  );

  const { guardAction, skipNextGuard } = useUnsavedChangesGuard({ isDirty });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      void guardAction(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, isDirty, guardAction]);

  // ── Card helpers ────────────────────────────────────────────────────────────

  const updateCard = useCallback(
    (id: string, updater: (prev: BatchCardState) => BatchCardState) => {
      setCards((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    },
    [],
  );

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(cards.map((c) => c.id)));
  }, [cards]);

  // ── handleGenerate ──────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    const cardLabel = batchCount === 1 ? 'card' : 'cards';
    const confirmed = await showConfirm({
      title: 'Generate Additional Cards',
      message: `Add ${batchCount} new ${cardLabel}?`,
      confirmLabel: 'Generate',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    const newCards: BatchCardState[] = [];
    for (let i = 0; i < batchCount; i++) {
      const card = buildEmptyCard(i, batchDefaults);
      if (batchDefaults.passwordStrategy === 'generate') {
        card.form.password = generatePassword();
        card.passwordRevealed = true;
      }
      if (
        batchDefaults.passwordStrategy === 'shared' &&
        batchDefaults.sharedPassword
      ) {
        card.form.password = batchDefaults.sharedPassword;
        card.passwordRevealed = true;
      }
      newCards.push(card);
    }

    setCards((currentCards) => {
      // Pristine check: if only 1 card exists and it's completely unused, replace it
      const isSinglePristine =
        currentCards.length === 1 &&
        !currentCards[0].form.username.trim() &&
        !currentCards[0].form.fullName.trim() &&
        !currentCards[0].form.email.trim();

      if (isSinglePristine) {
        return newCards;
      }
      return [...currentCards, ...newCards];
    });
    setSelectedIds(new Set());
  }, [batchCount, batchDefaults, showConfirm]);

  // ── handleSetSelected ───────────────────────────────────────────────────────

  const handleSetSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const confirmed = await showConfirm({
      title: 'Set selected cards?',
      message: `Apply defaults to ${selectedIds.size} selected card(s)? Existing field values will be overwritten.`,
      confirmLabel: 'Apply',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setCards((prev) =>
      prev.map((c) => {
        if (!selectedIds.has(c.id)) return c;
        const password =
          batchDefaults.passwordStrategy === 'generate'
            ? generatePassword()
            : batchDefaults.passwordStrategy === 'shared' && batchDefaults.sharedPassword
              ? batchDefaults.sharedPassword
              : c.form.password;
        return {
          ...c,
          form: {
            ...c.form,
            role: batchDefaults.role,
            linkedCustomerId:
              batchDefaults.role === 'Customer' ? batchDefaults.linkedCustomerId : null,
            password,
          },
          passwordRevealed: true,
          validationError: null,
        };
      }),
    );
  }, [selectedIds, batchDefaults, showConfirm]);

  // ── handleSetAll ─────────────────────────────────────────────────────────────

  const handleSetAll = useCallback(async () => {
    const confirmed = await showConfirm({
      title: 'Set all cards?',
      message: `Apply defaults to all ${cards.length} cards? Existing field values will be overwritten.`,
      confirmLabel: 'Apply',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    setCards((prev) =>
      prev.map((c) => {
        const password =
          batchDefaults.passwordStrategy === 'generate'
            ? generatePassword()
            : batchDefaults.passwordStrategy === 'shared' && batchDefaults.sharedPassword
              ? batchDefaults.sharedPassword
              : c.form.password;
        return {
          ...c,
          form: {
            ...c.form,
            role: batchDefaults.role,
            linkedCustomerId:
              batchDefaults.role === 'Customer' ? batchDefaults.linkedCustomerId : null,
            password,
          },
          passwordRevealed: true,
          validationError: null,
        };
      }),
    );
  }, [cards.length, batchDefaults, showConfirm]);

  // ── handleSave ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    // Validate all cards
    let hasErrors = false;
    const validated = cards.map((c) => {
      const err = validateCard(c.form);
      if (err) hasErrors = true;
      return { ...c, validationError: err };
    });
    setCards(validated);

    if (hasErrors) {
      void showDanger(
        'Validation errors',
        'Fix errors on highlighted cards before saving.',
      );
      return;
    }

    setIsSaving(true);
    const results: { index: number; error: string | null }[] = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      setSaveProgress(`Creating user ${i + 1} of ${cards.length}…`);

      try {
        const userPayload = {
          username: card.form.username.trim().toLowerCase(),
          fullName: card.form.fullName.trim(),
          email: card.form.email.trim(),
          role: card.form.role,
          password: card.form.password,
          ...(card.form.role === 'Customer'
            ? { linkedCustomerId: card.form.linkedCustomerId }
            : {}),
        };
        console.log(
          `[UserCreate] Submitting card ${i + 1} — username:`,
          userPayload.username,
          'role:',
          userPayload.role,
        );
        await createUser(userPayload);
        results.push({ index: i, error: null });
      } catch (err) {
        console.error(`[UserCreate] API error for card ${i + 1}:`, err);
        const message =
          err instanceof Error ? err.message : 'Failed to create user.';
        results.push({ index: i, error: message });
      }
    }

    setSaveProgress(null);
    setIsSaving(false);

    const failures = results.filter((r) => r.error !== null);
    const successes = results.length - failures.length;

    if (failures.length === 0) {
      await showSuccess(
        'Users created',
        `${successes} user(s) created successfully.`,
      );
      skipNextGuard();
      router.replace('/(app)/users' as never);
    } else {
      // Mark failed cards with error
      setCards((prev) =>
        prev.map((c, idx) => {
          const failure = results.find((r) => r.index === idx);
          return failure?.error
            ? { ...c, validationError: failure.error }
            : c;
        }),
      );
      void showDanger(
        'Some users could not be created',
        `${successes} of ${cards.length} created. Review the highlighted cards and retry.`,
      );
    }
  }, [cards, showSuccess, showDanger, router, skipNextGuard]);

  // ── handleDeleteSelected ────────────────────────────────────────────────────

  const handleDeleteSelected = useCallback(async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = await showConfirm({
      title: 'Delete selected cards?',
      message: `Remove ${count} selected card(s)?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    setCards((prev) => {
      const remaining = prev.filter((c) => !selectedIds.has(c.id));
      // Keep at least one card
      if (remaining.length === 0) {
        return [buildEmptyCard(0, batchDefaults)];
      }
      return remaining;
    });
    setSelectedIds(new Set());
  }, [selectedIds, showConfirm, batchDefaults]);

  // ── TopBar ──────────────────────────────────────────────────────────────────

  const topBarActions = useMemo<TopBarAction[]>(() => {
    const actions: TopBarAction[] = [
      buildBackTopBarAction({
        onPress: () => void guardAction(() => router.back()),
      }),
    ];

    actions.push(
      buildIconTopBarAction({
        id: 'delete-selected-users',
        label: selectedIds.size > 0 ? `Delete selected (${selectedIds.size})` : 'Delete selected',
        onPress: handleDeleteSelected,
        icon: Trash2Icon,
        disabled: selectedIds.size === 0 || isSaving,
      }),
    );

    actions.push(
      buildIconTopBarAction({
        id: 'select-all-users',
        label: `Select all (${cards.length})`,
        onPress: handleSelectAll,
        icon: CheckCheckIcon,
        disabled: selectedIds.size === cards.length || isSaving,
      }),
    );

    actions.push(
      buildIconTopBarAction({
        id: 'save-new-users',
        label: isSaving
          ? saveProgress ?? 'Saving…'
          : `Save ${cards.length} user${cards.length !== 1 ? 's' : ''}`,
        onPress: handleSave,
        icon: SaveIcon,
        disabled: isSaving,
      }),
    );

    return actions;
  }, [
    guardAction,
    router,
    selectedIds,
    handleDeleteSelected,
    handleSelectAll,
    isSaving,
    saveProgress,
    handleSave,
    cards.length,
  ]);

  useScreenTopBar({ title: 'Create User', actions: topBarActions });

  if (!isAdmin) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <ScreenContent>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <BatchUserSetupCard
          expanded={batchExpanded}
          onToggleExpanded={() => setBatchExpanded((e) => !e)}
          count={batchCount}
          onCountChange={setBatchCount}
          defaults={batchDefaults}
          onDefaultsChange={setBatchDefaults}
          onGenerate={handleGenerate}
          onSetSelected={handleSetSelected}
          onSetAll={handleSetAll}
          selectedCount={selectedIds.size}
          totalCards={cards.length}
        />

        {cards.map((card, idx) => (
          <BatchUserCard
            key={card.id}
            index={idx}
            state={card}
            totalCount={cards.length}
            isSelected={selectedIds.has(card.id)}
            onToggleSelect={() => toggleSelect(card.id)}
            onDelete={() => deleteCard(card.id)}
            onFormChange={(updater) =>
              updateCard(card.id, (prev) => ({
                ...prev,
                form: updater(prev.form),
              }))
            }
            onPasswordRevealChange={(revealed) =>
              updateCard(card.id, (prev) => ({
                ...prev,
                passwordRevealed: revealed,
              }))
            }
            onValidationErrorChange={(err) =>
              updateCard(card.id, (prev) => ({
                ...prev,
                validationError: err,
              }))
            }
          />
        ))}
      </ScrollView>
    </ScreenContent>
  );
}

function createStyles(theme: AppTheme) {
  const common = createCommonScreenStyleDefinitions(theme);

  return StyleSheet.create({
    ...common,
    scrollContent: {
      paddingBottom: theme.spacing.xxl,
    },
    sectionTitle: common.sectionTitle,
    card: common.card,
  });
}
