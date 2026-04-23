import { useEffect } from 'react';
import { ScreenTopBarConfig, TopBarAction, useScreenTitleContext } from '@context/ScreenTitleContext';

interface UseScreenTopBarOptions {
  title: string;
  actions?: TopBarAction[];
}

export function useScreenTopBar({ title, actions = [] }: UseScreenTopBarOptions): void {
  const { setTopBar, resetTopBar } = useScreenTitleContext();

  useEffect(() => {
    const visibleActions = actions.filter((action) => !action.hidden);
    const config: ScreenTopBarConfig = {
      title,
      actions: visibleActions,
    };

    setTopBar(config);
    return () => {
      resetTopBar();
    };
  }, [actions, resetTopBar, setTopBar, title]);
}