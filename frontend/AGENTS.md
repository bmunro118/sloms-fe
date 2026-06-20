# Sonic App — Frontend UI Patterns

TopBar actions, AppModal, ThemedCard, styling conventions, API client patterns, and auth guards for the Expo/React Native app.

## TopBar Actions

Screens register title + actions via `useScreenTopBar({ title, actions })` from `@src/hooks/useScreenTopBar`. Use shared helpers from `@src/features/app-shell/top-bar-actions`:

```ts
useScreenTopBar({
  title: 'My Screen',
  actions: [
    buildIconTopBarAction({ id: 'refresh', label: 'Refresh', onPress: handleRefresh, icon: RefreshCw }),
    buildBackTopBarAction({ onPress: () => router.back() }),
  ],
});
```

- Back actions auto-hide on native-phone (bottom bar handles navigation).
- Memoize handlers with `useCallback` to prevent update-depth loops.
- Mark primary action with `primary: true` (renders in rightmost slot on web/tablet, replacing Save placeholder).
- Mark secondary action with `secondary: true` (renders in Edit slot on web/tablet, replacing Pencil placeholder).
- Layout modes: `TopBarWideLayout` (web/tablet) has stacked two-row layout with always-visible Back/Edit/Save/overflow slots. Native-phone uses single-row width-based slotting.

## AppModal

Global modal via `useAppModal()` from `@src/hooks/useAppModal`:

```ts
const { showConfirm, showSuccess, showDanger } = useAppModal();
const confirmed = await showConfirm({ title: 'Delete?', message: 'This cannot be undone.', confirmLabel: 'Delete', confirmVariant: 'danger' });
if (!confirmed) return;
```

Use `showConfirm` for all destructive/high-impact actions. Use `confirmVariant: 'danger'` for destructive flows.

## ThemedCard

```tsx
<ThemedCard title="Card Title" actions={[buildIconTopBarAction('edit', PencilIcon, handleEdit, 'Edit')]}>
  {/* content */}
</ThemedCard>
```

Action-only headers (no title) render as floating top-right overlays; no reserved header height.

## Styling

```ts
import { useThemedStyles } from '@src/theme/useThemedStyles';
import { tokens } from '@src/theme/tokens';
const styles = useThemedStyles((theme) => ({
  container: { backgroundColor: theme.background, padding: tokens.spacing.md },
  title: { color: theme.textPrimary, fontSize: 18 },
}));
```

- Use `stylePresets.ts` for repeated `contentAction*` button patterns matching TopBar visual language.
- Use semantic field labels: `fieldLabel` (CAPS 12px, `textMuted`) + `fieldValue` (15px, `textPrimary`) from `stylePresets.ts`.
- No raw color literals — use `theme.colors.textPrimary`, `theme.colors.border`, `theme.colors.accent`, etc.

## ThemedButton Variants

| Variant | Usage | Theme Tokens |
|---------|-------|-------------|
| `solid` | Primary actions, modal confirmations | `buttonPrimary*` |
| `outline` | Form actions, secondary buttons | `buttonSecondary*` |
| `icon` | Row-level actions, input accessories (44x44 target) | `buttonIcon*` |

Special props: `hideBorder` (removes border for input accessories), `fillMode` (strips circular styling, fills container — use with `hideBorder` for search icons in `ThemedInput` `rightAccessory`).

## ThemedInput

```tsx
<ThemedInput
  placeholder="Enter value..."
  value={value}
  onChangeText={setValue}
  rightAccessory={<ThemedButton variant="icon" icon={<SearchIcon />} onPress={handleSearch} hideBorder fillMode />}
/>
```

Tracks focus/blur internally — border color changes from `colors.border` to `colors.textPrimary` on focus.

## Feature API Clients

Each domain has a typed client in `src/features/<domain>/api.ts`:

```ts
import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export async function getCustomers() {
  return apiRequest<CustomerListResponse>(ENDPOINTS.customers.list);
}
```

## Auth & Role Guards

```ts
const { user, isStaff, isAdmin, canMutate } = useAuth();
```

Gate admin-only UI with `isAdmin`, mutation actions with `canMutate`. Do not duplicate routes for different roles.

## LoadingSpinner

```tsx
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

// Full-screen initial load:
{isLoading ? <LoadingSpinner message="Loading..." fullScreen /> : null}

// Inline inside a card:
{isLoading ? <LoadingSpinner size="small" message="Loading customers..." /> : null}
```

Props: `message?`, `size?` (`small`/`medium`/`large`), `fullScreen?`, `style?`.

## Unsaved Changes Guard

```ts
const { guardAction } = useUnsavedChangesGuard({ isDirty });
await guardAction(() => { /* cancel/reset logic */ });
```

Use on all edit forms (detail screens, create screens, inline card edits). The `normaliseForDirtyCheck` utility maps `undefined → null` and trims strings.

## Pull-to-Refresh

Data-driven screens use native pull-to-refresh via `RefreshControl`, platform-gated with `Platform.OS !== 'web'`:

```tsx
<ScrollView refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} /> : undefined}>
```

Edit/detail screens wrap handler with `guardAction` from `useUnsavedChangesGuard`. Create screens and Account do NOT get pull-to-refresh.

## Feature Flags

Defined in `utils/features.ts` with `FeatureName` union type. Flags resolve via: env var → `__DEV__` default → hardcoded fallback.

```ts
import { featureFlags } from '@utils/features';
import { useFeatureFlag } from '@hooks/useFeatureFlag';
const showRevisions = useFeatureFlag('priceListRevisions');
```

Page-level access gates (`documentsPage`, `priceListPage`, `vatRatesPage`) default to `false` even in dev — set `EXPO_PUBLIC_FEATURE_<NAME>=true` to enable.

## TooltipPressable

Use `TooltipPressable` from `@components/ui/TooltipPressable` as wrapper for any button needing a tooltip. Renders in root-level Modal (native) or `position: fixed` portal via `createPortal` (web).

Any custom modal opened from a `TooltipPressable` must register with `TooltipDismissalContext`:

```ts
const { registerModal } = useTooltipDismissal();
useEffect(() => { if (modalOpen) return registerModal(); }, [modalOpen]);
```

## Import Path Conventions

| Path alias | Resolves to |
|------------|-------------|
| `@utils/...` | `frontend/utils/...` |
| `@components/...` | `frontend/src/components/...` |
| `@src/...` | `frontend/src/...` |
| `@features/...` | `frontend/src/features/...` |
| `@hooks/...` | `frontend/src/hooks/...` |
| `@context/...` | `frontend/src/context/...` |
| `@theme/...` | `frontend/src/theme/...` |
