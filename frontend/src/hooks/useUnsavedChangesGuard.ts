import { useCallback } from 'react';
import { useAppModal } from '@src/hooks/useAppModal';

interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
}

interface UseUnsavedChangesGuardResult {
  guardAction: (action: () => void | Promise<void>) => Promise<boolean>;
}

export function useUnsavedChangesGuard({
  isDirty,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardResult {
  const { showConfirm } = useAppModal();

  const guardAction = useCallback(
    async (action: () => void | Promise<void>): Promise<boolean> => {
      if (!isDirty) {
        await action();
        return true;
      }

      const confirmed = await showConfirm({
        title: 'Discard changes?',
        message: 'You have unsaved changes. Discard them and leave?',
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
        confirmVariant: 'danger',
      });

      if (!confirmed) return false;

      await action();
      return true;
    },
    [isDirty, showConfirm],
  );

  return { guardAction };
}

/**
 * Normalise a form data object for dirty comparison.
 * Maps undefined → null and trims string whitespace so minor
 * format differences don't trigger false positives.
 */
export function normaliseForDirtyCheck<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v === undefined ? null : typeof v === 'string' ? v.trim() : v,
    ]),
  );
}
