# app-shell

Platform detection, shell mode selection, and navigation policy for the Sonic App.

---

## Module structure

```
src/features/app-shell/
├── index.ts                    ← PUBLIC BARREL (only allowed import point)
├── context/
│   └── AppShellContext.tsx     ← React context + provider + useAppShell hook
├── layout-mode/
│   └── index.ts                ← Pure platform/viewport → shell-mode logic (no React Native)
│   └── index.test.ts
└── navigation-policy/
    └── index.ts                ← Single-source role-based nav catalog
    └── index.test.ts
```

---

## Import rule

**All consumers must import from the barrel only:**

```ts
// ✅ Correct
import { useAppShell, resolveNavItemsForRole, canRoleAccessPath } from 'src/features/app-shell';

// ❌ Wrong — direct sub-module import, blocked by ESLint no-restricted-imports
import { useAppShell } from 'src/features/app-shell/context/AppShellContext';
```

The `eslint.config.js` at the repo root enforces this automatically. The barrel internals (`context/`, `layout-mode/`, `navigation-policy/`) are exempt from the rule so they can import each other freely.

---

## Concepts

### PlatformProfile

Derived from `(platformOS, viewport)` before first render.

| Value | Condition |
|---|---|
| `web-desktop` | web, width ≥ 1024 px |
| `web-compact` | web, width < 1024 px |
| `native-tablet` | iOS/Android, width ≥ 768 px OR landscape width ≥ 600 px |
| `native-phone` | iOS/Android, everything else |

### AppShellMode

Derived from `PlatformProfile` and viewport width.

| Value | Condition |
|---|---|
| `sidebar` | web-desktop, width ≥ 1024 px |
| `sidebar-collapsed` | web-desktop, width < 1024 px OR web-compact |
| `drawer` | native-phone, native-tablet |

`NavLayout` reads `shellMode` from `useAppShell()` and renders the appropriate variant.

### Shell breakpoints

Defined in `SHELL_BREAKPOINTS` (`layout-mode/index.ts`):

```ts
{ tablet: 768, desktop: 1024, wideDesktop: 1280 }
```

To add a new breakpoint, update `SHELL_BREAKPOINTS` and add a matching branch in `resolveShellMode`.

---

## How to add a new nav module

1. Add one entry to `NAV_POLICY` in `navigation-policy/index.ts`:
   ```ts
   {
     id: 'reports',
     label: 'Reports',
     href: '/(app)/reports',
     visibleTo: ['Admin', 'Manager'],
   }
   ```
2. Add `'/(app)/reports'` to the `AppRoutePath` union type in the same file.
3. Create the route file at `app/(app)/reports/index.tsx`.

No other changes are needed — `resolveNavItemsForRole` and `canRoleAccessPath` pick up the new entry automatically.

---

## How to add a new role

1. Add the role string to the `UserRole` union in `src/context/AuthContext.tsx`.
2. For each `NAV_POLICY` item where the new role should have access, add it to `visibleTo`.

---

## Startup sequence (no flicker guarantee)

```
AppShellProvider mounts
  └─ Dimensions.get('window') called synchronously            → initialViewport
  └─ resolvePlatformProfile(initialViewport, Platform.OS)     → platformProfile
  └─ resolveShellMode(initialViewport, platformProfile)       → shellMode
  └─ isReady = true (never false, no useEffect gate)

AuthProvider mounts
  └─ getInitialAuthSnapshot() reads localStorage (web, sync)  → isLoading = false
  └─ hydrateSession() called in background (validates token)
  └─ Native: isLoading = true until SecureStore async read completes

GuardedRoot
  └─ waits for: isReady (always true) + !isLoading
  └─ first paint uses the correct shellMode from day one
```

---

## Testing

Pure modules (`layout-mode`, `navigation-policy`) are tested with Vitest in Node environment — no React Native import allowed in those files.

```bash
npm run test        # run all tests once
npm run test:watch  # watch mode
```

To add a test for a new pure function, add it to the `.test.ts` file in the same sub-module directory.
