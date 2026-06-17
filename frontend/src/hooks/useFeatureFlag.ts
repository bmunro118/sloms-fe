import { useMemo } from 'react';
import { FeatureFlagKey, isFeatureEnabled } from '@utils/config';

/**
 * React hook for feature flag checks. Memoised per flag.
 * Usage:
 *   const showRevisions = useFeatureFlag('priceListRevisions');
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
}
