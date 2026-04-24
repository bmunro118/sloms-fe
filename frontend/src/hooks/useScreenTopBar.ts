import { useEffect, useMemo, useRef } from 'react';
import { ScreenTopBarConfig, TopBarAction, useScreenTitleContext } from '@context/ScreenTitleContext';
import { useAppShell } from '@src/features/app-shell';

interface UseScreenTopBarOptions {
  title: string;
  actions?: TopBarAction[];
}

type StableTopBarActionRefs = {
  onPressRef: { current: TopBarAction['onPress'] };
  renderIconRef: { current: TopBarAction['renderIcon'] };
  stableOnPress: TopBarAction['onPress'];
  stableRenderIcon: TopBarAction['renderIcon'];
};

export function useScreenTopBar({ title, actions = [] }: UseScreenTopBarOptions): void {
  const { setTopBar, resetTopBar } = useScreenTitleContext();
  const { platformProfile, shellMode } = useAppShell();
  const stableActionRefs = useRef(new Map<string, StableTopBarActionRefs>());
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

  const stableActions = useMemo(() => {
    const nextKeys = new Set<string>();

    const normalizedActions = visibleActions.map((action, index) => {
      const actionKey = `${action.id}:${index}`;
      nextKeys.add(actionKey);

      let refs = stableActionRefs.current.get(actionKey);

      if (!refs) {
        const onPressRef: StableTopBarActionRefs['onPressRef'] = { current: action.onPress };
        const renderIconRef: StableTopBarActionRefs['renderIconRef'] = { current: action.renderIcon };

        refs = {
          onPressRef,
          renderIconRef,
          stableOnPress: () => onPressRef.current(),
          stableRenderIcon: (args) => renderIconRef.current(args),
        };

        stableActionRefs.current.set(actionKey, refs);
      }

      refs.onPressRef.current = action.onPress;
      refs.renderIconRef.current = action.renderIcon;

      return {
        ...action,
        onPress: refs.stableOnPress,
        renderIcon: refs.stableRenderIcon,
      };
    });

    for (const existingKey of stableActionRefs.current.keys()) {
      if (!nextKeys.has(existingKey)) {
        stableActionRefs.current.delete(existingKey);
      }
    }

    return normalizedActions;
  }, [visibleActions]);

  useEffect(() => {
    const config: ScreenTopBarConfig = {
      title,
      actions: stableActions,
    };

    setTopBar(config);
  }, [setTopBar, stableActions, title]);

  useEffect(() => {
    return () => {
      resetTopBar();
    };
  }, [resetTopBar]);
}