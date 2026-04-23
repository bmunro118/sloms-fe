import { useEffect, useMemo } from 'react';
import { ScreenTopBarConfig, TopBarAction, useScreenTitleContext } from '@context/ScreenTitleContext';

interface UseScreenTopBarOptions {
  title: string;
  actions?: TopBarAction[];
}

export function useScreenTopBar({ title, actions = [] }: UseScreenTopBarOptions): void {
  const { setTopBar, resetTopBar } = useScreenTitleContext();
  const visibleActions = useMemo(() => {
    const filtered = actions.filter((action) => !action.hidden);
    const normal = filtered.filter((action) => !action.isClose);
    const close = filtered.filter((action) => action.isClose);
    return [...normal, ...close];
  }, [actions]);

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