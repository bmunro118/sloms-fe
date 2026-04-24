import { useEffect, useMemo } from 'react';
import { ScreenTopBarConfig, TopBarAction, useScreenTitleContext } from '@context/ScreenTitleContext';
import { useAppShell } from '@src/features/app-shell';

interface UseScreenTopBarOptions {
  title: string;
  actions?: TopBarAction[];
}

export function useScreenTopBar({ title, actions = [] }: UseScreenTopBarOptions): void {
  const { setTopBar, resetTopBar } = useScreenTitleContext();
  const { platformProfile, shellMode } = useAppShell();
  const shouldHideTopBarBackAction = platformProfile === 'native-phone' && shellMode === 'drawer';
  const visibleActions = useMemo(() => {
    const filtered = actions.filter((action) => {
      if (action.hidden) {
        return false;
      }

      if (shouldHideTopBarBackAction && action.isBack) {
        return false;
      }

      return true;
    });
    const normal = filtered.filter((action) => !action.isClose);
    const close = filtered.filter((action) => action.isClose);
    return [...normal, ...close];
  }, [actions, shouldHideTopBarBackAction]);

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