import { useMemo } from 'react';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';

export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();

  return useMemo(() => factory(theme), [factory, theme]);
}