import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu as MenuIcon, X as CloseIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScreenTitleContext } from '@context/ScreenTitleContext';
import { useAppTheme } from '@theme/ThemeProvider';
import { AppTheme } from '@theme/types';

interface TopBarProps {
  onMenuPress?: () => void;
  sidebarOpen?: boolean;
}

export function TopBar({ onMenuPress, sidebarOpen }: TopBarProps) {
  const { title } = useScreenTitleContext();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      {onMenuPress ? (
        <Pressable style={styles.menuButton} onPress={onMenuPress}>
          {sidebarOpen
            ? <CloseIcon size={18} color={theme.colors.navTextStrong} />
            : <MenuIcon size={18} color={theme.colors.navTextStrong} />}
        </Pressable>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    menuButton: {
      borderRadius: 10,
      backgroundColor: theme.colors.navBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });
}
