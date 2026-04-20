import { Link, usePathname } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export interface NavItem {
  label: string;
  href: string;
}

interface NavLayoutProps extends PropsWithChildren {
  title?: string;
  items: NavItem[];
  onSignOut: () => Promise<void> | void;
}

export function NavLayout({ title = 'SLOMS', items, onSignOut, children }: NavLayoutProps) {
  const pathname = usePathname();

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>{title}</Text>
        <View style={styles.navList}>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href as never} asChild>
                <Pressable style={[styles.navItem, active ? styles.navItemActive : null]}>
                  <Text style={[styles.navItemText, active ? styles.navItemTextActive : null]}>{item.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  brand: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 16,
  },
  navList: {
    gap: 8,
  },
  navItem: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
  },
  navItemActive: {
    backgroundColor: '#0f766e',
  },
  navItemText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  navItemTextActive: {
    color: '#ffffff',
  },
  signOutButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1f2937',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
});
