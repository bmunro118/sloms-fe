import { useMemo } from 'react';
import { FeatureName, isFeatureEnabled } from '@utils/features';

/**
 * React hook for feature flag checks. Memoised per flag.
 * Usage:
 *   const showRevisions = useFeatureFlag('priceListRevisions');
 */
export function useFeatureFlag(flag: FeatureName): boolean {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
}
