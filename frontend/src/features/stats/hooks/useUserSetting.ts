import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserSetting, upsertUserSetting } from '@src/features/settings';

const SAVE_DEBOUNCE_MS = 600;

/**
 * A piece of state backed by the per-user settings API (`/settings/user/:key`).
 *
 * On mount it loads and validates the stored JSON value (falling back to
 * `fallback` if absent or malformed), and `save` writes the new value back,
 * debounced so rapid edits don't spam the API.
 *
 * `parse` MUST be a stable reference (define it at module scope) — it is part of
 * the load effect's dependencies.
 */
export function useUserSetting<T>(
  key: string,
  fallback: T,
  parse: (raw: unknown) => T | null,
) {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUserSetting(key)
      .then((rec) => {
        if (cancelled || !rec?.val) return;
        try {
          const parsed = parse(JSON.parse(rec.val));
          if (parsed !== null) setValue(parsed);
        } catch {
          /* malformed stored value — keep fallback */
        }
      })
      .catch(() => {
        /* 404 (no setting yet) or transient error — keep fallback */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key, parse]);

  const save = useCallback(
    (next: T) => {
      setValue(next);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void upsertUserSetting(key, JSON.stringify(next)).catch(() => {
          /* best-effort persistence */
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [key],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { value, save, loaded };
}
