import React from 'react';
import { useFeatureFlag } from '@hooks/useFeatureFlag';
import type { FeatureName } from '@utils/features';

interface InDevProps {
  /** The feature flag to gate on */
  feature: FeatureName;
  /** Content rendered when the feature is enabled */
  children: React.ReactNode;
  /** Optional content rendered when the feature is disabled (defaults to null) */
  fallback?: React.ReactNode;
}

/**
 * Declarative feature-gating wrapper.
 *
 * Renders `children` when the named feature flag is enabled, otherwise
 * renders `fallback` (or nothing if no fallback is provided).
 *
 * @example
 *   <InDev feature="betaDashboardWidgets" fallback={<OldWidgets />}>
 *     <NewWidgetExperience />
 *   </InDev>
 */
export const InDev: React.FC<InDevProps> = ({ feature, children, fallback = null }) => {
  const enabled = useFeatureFlag(feature);
  return <>{enabled ? children : fallback}</>;
};
