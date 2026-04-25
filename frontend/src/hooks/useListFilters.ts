import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages draft/applied filter state and debounced search for list screens.
 *
 * Pattern:
 *  - `searchQuery` updates immediately but is debounced before being exposed to callers via `debouncedSearch`.
 *  - Filter options inside the modal update `draftFilters` only.
 *  - Pressing "Apply" commits draft → applied.
 *  - Pressing "Clear" resets both draft and applied to the initial values.
 */
export function useListFilters<F extends Record<string, unknown>>(
  initialFilters: F,
  searchDebounceMs = 400,
) {
  const [appliedFilters, setAppliedFilters] = useState<F>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<F>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search query
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, searchDebounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchDebounceMs]);

  const openModal = useCallback(() => {
    // Seed draft from the current applied state when the modal opens.
    setDraftFilters(appliedFilters);
    setIsModalOpen(true);
  }, [appliedFilters]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const setDraftFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setIsModalOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setAppliedFilters(initialFilters);
    setDraftFilters(initialFilters);
    setSearchQuery('');
    setDebouncedSearch('');
    setIsModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    (Object.keys(initialFilters) as Array<keyof F>).some(
      (key) => appliedFilters[key] !== initialFilters[key],
    );

  return {
    /** Filters that are currently driving the data fetch. */
    appliedFilters,
    /** Filters being edited inside the modal (not yet committed). */
    draftFilters,
    /** Raw search input value (for controlled input). */
    searchQuery,
    /** Debounced search value — use this to trigger fetches. */
    debouncedSearch,
    isModalOpen,
    hasActiveFilters,
    setSearchQuery,
    setDraftFilter,
    openModal,
    closeModal,
    applyFilters,
    clearFilters,
  };
}
