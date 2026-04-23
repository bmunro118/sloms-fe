import { useEffect, useMemo } from 'react';
import { ScreenTopBarConfig, TopBarAction, useScreenTitleContext } from '@context/ScreenTitleContext';

interface UseScreenTopBarOptions {
  title: string;
  actions?: TopBarAction[];
}

export function useScreenTopBar({ title, actions = [] }: UseScreenTopBarOptions): void {
  const { setTopBar, resetTopBar } = useScreenTitleContext();
  const visibleActions = useMemo(() => actions.filter((action) => !action.hidden), [actions]);

  useEffect(() => {
    const config: ScreenTopBarConfig = {
      title,
      actions: visibleActions,
    };

    setTopBar(config);
  }, [setTopBar, title, visibleActions]);

  useEffect(() => {
    return () => {
      resetTopBar();
    };
  }, [resetTopBar]);
}