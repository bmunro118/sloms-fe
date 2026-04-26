# Sonic Labs Client Portal & Mobile Application
## Application Overview

### 1. Executive Summary
Sonic App v2 is a cross-platform Expo application that provides a role-aware portal for SLOMS users. It is intentionally frontend-only and consumes the external SLOMS REST API as the system of record.

Primary user outcomes:
1. Authenticate against SLOMS and establish a secure session.
2. Access one unified app shell with role-based navigation and permissions.
3. Work with core operational modules such as orders, customers, users, price list, settings, documents, and account management.

### 2. Current Architecture
The implementation uses a single, unified application route group and central auth state.

Core stack:
1. Expo SDK 54 + Expo Router (file-based routing).
2. React Native + TypeScript.
3. No local backend, no ORM, no local persistence beyond auth token/session metadata.

Repository scope:
1. UI and client-side orchestration only.
2. Domain data, validation rules, and persistence are handled by SLOMS API.

### 3. Routing Model (Unified Interface)
Routing has been consolidated into one authenticated route tree:
1. Public routes include `app/index.tsx` (login) and `app/change-password.tsx` (forced password-change flow).
2. Authenticated routes are hosted under `app/(app)/`.
3. Core authenticated screens include dashboard, orders, customers, users, price-list, settings, documents, and account.

Role controls display and actions, not route tree duplication.

### 4. Authentication & Session Flow
Authentication is JWT-based and integrated with SLOMS auth endpoints.

Flow summary:
1. Login via `POST /api/auth/login` with `clientType` derived from active auth transport.
	- Production web always sends `clientType=web` and uses cookie auth.
	- Native mobile sends `clientType=mobile` and uses bearer token auth.
	- Localhost web development may temporarily send `clientType=mobile` only when strict local fallback conditions are met.
2. If `mustChangePassword=true` (or JWT `scope=password_change`), user is routed to forced password-change screen.
3. Password update via `POST /api/auth/change-password` returns full-access token.
4. Normal session hydration validates token via `GET /api/auth/me`.
5. Sign-out clears local token/session state.

Role mapping currently supported in app state:
1. Admin
2. Manager
3. Operative
4. ReadOnly
5. Customer

Derived permission helpers:
1. `isStaff`
2. `isAdmin`
3. `canMutate`

### 5. Token Storage & Security Posture
Token handling is platform-specific:
1. Web: authenticated sessions use `HttpOnly` secure cookies set by SLOMS. The frontend does not persist access tokens in browser storage.
2. Mobile: `expo-secure-store` persists the access token returned in the login JSON body.
3. Local web fallback (development-only): when running on localhost in `__DEV__` and the API origin differs from the app origin, web can fall back to token auth and `sessionStorage` to avoid credentialed CORS failures during local testing.

Web fallback guardrails:
1. Disabled in production builds.
2. Disabled for non-localhost browser hosts.
3. Cookie auth remains the default and required mode for production web deployments.

Security notes:
1. JWT payload is decoded client-side for identity/role bootstrap.
2. Backend remains source of truth; `/api/auth/me` is used to validate active session identity.
3. Web requests rely on browser-managed cookies; mobile protected requests use Authorization header Bearer tokens via the shared API utility.
4. API base URL validation blocks insecure HTTP origins in production builds; dev-only HTTP is limited to localhost.

### 6. Runtime Environment Configuration
The Expo frontend reads environment-specific runtime values from `frontend/.env`.

Rules:
1. Frontend-exposed variables must use the `EXPO_PUBLIC_` prefix so Expo can statically replace them in the bundle.
2. Access environment variables directly as `process.env.EXPO_PUBLIC_...`; do not destructure `process.env`.
3. `.env`, `.env.local`, and `.env.*` are gitignored and must not be committed with secrets or environment-specific overrides.
4. Expo config must define a stable deep-link scheme (`expo.scheme`) so Expo Router and Linking can resolve production URLs correctly.

Current variables:
1. `EXPO_PUBLIC_API_URL`
	- Primary SLOMS API base URL used by `frontend/utils/config.ts`.
	- Must be a full URL including protocol.
	- Production requires HTTPS; dev-only HTTP is allowed only for localhost origins.
2. `EXPO_PUBLIC_WEB_AUTH_MODE`
	- Optional local web development override for auth transport resolution.
	- Accepted values are `cookie` and `token`.
	- Only applies on web in `__DEV__` when the app is running on localhost.
	- When empty, the app auto-detects the mode by comparing the app origin with the configured API origin.

Workflow-level debug flags:
1. Use `EXPO_PUBLIC_DEBUG_<WORKFLOW>` variables to gate targeted console logging in development.
2. Keep values string-based (`true` / `false`) because Expo replaces env values at build time as strings.
3. Recommended naming examples:
	- `EXPO_PUBLIC_DEBUG_CUSTOMERS`
	- `EXPO_PUBLIC_DEBUG_ORDERS`
	- `EXPO_PUBLIC_DEBUG_AUTH`

Implementation pattern for screen/workflow logging:
1. Read flags directly from `process.env.EXPO_PUBLIC_...` at the logging call site (or via a small helper), never by destructuring `process.env`.
2. Always pair flag checks with `__DEV__` so logs are development-only and removed from production bundles by dead-code elimination.
3. Keep logs scoped and structured (prefix log messages with workflow tags like `[customers]`).

Example `.env` entries:
```dotenv
EXPO_PUBLIC_DEBUG_CUSTOMERS=false
EXPO_PUBLIC_DEBUG_ORDERS=false
EXPO_PUBLIC_DEBUG_AUTH=false
```

Example usage in code:
```ts
const shouldDebugCustomers =
  __DEV__ && process.env.EXPO_PUBLIC_DEBUG_CUSTOMERS === 'true';

if (shouldDebugCustomers) {
  console.log('[customers] route params', params);
  console.log('[customers] validation state', validationState);
}
```

Debug logging guardrails:
1. Never log secrets, tokens, passwords, cookie contents, or full PII payloads.
2. Prefer logging derived diagnostics (IDs, counts, status, branch decisions) over raw API responses.
3. Remove temporary one-off logs after a bugfix; keep only reusable workflow-flagged diagnostics.

### 7. API Integration Pattern
All network operations route through centralized utilities:
1. `frontend/utils/config.ts` defines API base URL and endpoint registry.
2. `frontend/utils/api.ts` handles request construction, auth header injection, and JSON handling.
3. Feature screens consume endpoint constants/builders rather than hardcoding URL composition.

Configured SLOMS endpoint domains in v2 include:
1. auth
2. users
3. customers
4. orders
5. price-list
6. settings
7. vat-rates

### 8. UI Shell & Navigation
The authenticated shell is role-driven:
1. Single navigation component renders different item sets based on role.
2. Staff and customer experiences share one structural shell.
3. Route transitions are handled with explicit router navigation handlers.

Layout profile and shell mode resolution:
1. Platform class is derived from runtime OS (`web`, `ios`, `android`) and a device-type signal (`phone` vs `tablet`), not from viewport width alone.
2. Device-type signal must use device-specific detection (`Platform.isPad` on iOS and equivalent Android/native tablet detection) so large phones in landscape are not misclassified as tablets.
3. Viewport dimensions (width/height) are used for platform profile classification; web and tablet profiles default to `sidebar-collapsed`, while native phone uses `drawer`.
4. Web continues to use desktop/compact profile breakpoints, while native layout decisions require both device type and viewport state.
5. Native phone drawer layouts use a `TopBar` (title + optional screen-defined actions) at the top and a bottom navigation bar with `Back` and menu icon actions; the menu icon opens the navigation drawer and sign-out remains inside the drawer panel.
6. Web and tablet sidebar layouts render a `TopBar` (title + optional screen-defined actions) above the scrollable content column, to the right of the sidebar.
7. In web/tablet sidebar layouts, the menu toggle button is rendered on the sidebar rail; pressing it expands or collapses the sidebar in place.
8. The sidebar menu toggle uses the same size and rounded-rectangle shape as collapsed sidebar nav item buttons in both collapsed and expanded sidebar states.
9. The sidebar menu toggle remains horizontally anchored to the collapsed-rail position when the sidebar expands, so it does not jump to a new x-position.
10. Sidebar expand/collapse transitions are animated so rail width changes smoothly instead of snapping between states.
11. Sidebar label text (navigation item labels and sign-out text) fades/slides in and out during expand/collapse with an animated label-width clip, while icons render in fixed geometry slots so they do not flicker or jump.
12. In native phone drawer panels, the sign-out action appears at the top, a flexible spacer separates it from navigation, and the `Account` nav item stays aligned at the bottom of the drawer list.
13. Interactive buttons in auth screens, app-shell navigation, and page-level actions use a shared tooltip-capable pressable wrapper so intent labels appear on hover/focus (and long-press where supported), improving discoverability for icon-only and compact controls.

Navigation shell components:
1. `NavLayout` (`src/components/navigation/NavLayout.tsx`) — root orchestrator; reads `platformProfile` and `shellMode`, delegates to the appropriate layout variant.
2. `MobileNavLayout` (`src/components/navigation/MobileNavLayout.tsx`) — drawer variant for `native-phone`; top bar + scrollable content + bottom bar.
3. `TopBar` (`src/components/navigation/TopBar.tsx`) — shared top bar used by sidebar and native-phone variants; reads the current title and action buttons from `ScreenTitleContext`.
4. `TopBar` action rendering is width-aware on web/tablet: it measures available header space at runtime, keeps a minimum title area, renders as many icon actions as fit, and moves remaining actions into a `More` overflow menu; on native phone, screen actions default to `More` overflow, with any `Edit` action pinned as the direct button immediately left of `More`.

Screen top bar propagation:
1. `ScreenTitleContext` (`src/context/ScreenTitleContext.tsx`) holds the active page title and optional per-screen action button definitions; `ScreenTitleProvider` wraps `NavLayout` in `app/(app)/_layout.tsx`.
2. Screens can call `useScreenTopBar({ title, actions })` (`src/hooks/useScreenTopBar.ts`) to register both title and multiple action buttons (icon + handler) for `TopBar`.
3. `useScreenTitle(title)` (`src/hooks/useScreenTitle.ts`) remains supported for title-only screens.
4. Screen content does not contain a title `Text` element; the title and actions are rendered by `TopBar`.
5. Shared action construction helpers `buildIconTopBarAction(...)`, `buildBackTopBarAction(...)`, and `buildCloseTopBarAction(...)` (`src/features/app-shell/top-bar-actions.ts`) standardize icon-action wiring for normal, back, and close/dismiss actions.
6. Secondary screens opened from a `TopBar Action` must expose a back or close/dismiss `TopBar Action` on the destination screen so users can explicitly return to the owning primary screen.
7. `useScreenTopBar(...)` applies title/actions updates reactively but only clears top-bar state on screen unmount, preventing transient title/action resets during routine rerenders.
8. In `native-phone` drawer mode, `useScreenTopBar(...)` suppresses `Back` `TopBar Action` entries because the bottom bar already exposes the canonical `Back Button` for that shell profile.

UI terminology dictionary (canonical naming):

| Term | Canonical meaning in v2 | Where it appears |
|---|---|---|
| `App Shell` | The authenticated chrome that wraps all `app/(app)` screens and provides navigation + title area. | `NavLayout` and delegated variants |
| `Platform Profile` | Runtime profile classification: `web-desktop`, `web-compact`, `native-tablet`, `native-phone`. | App-shell mode resolution |
| `Shell Mode` | Presentation mode inside a profile: `sidebar-collapsed` (web/tablet) or `drawer` (native phone). | `useAppShell()` output |
| `TopBar` | Shared top title region at the top of content; renders page title and optional screen-defined action buttons. | All shell variants |
| `Page Title` | Current screen title text shown in `TopBar`; sourced from `useScreenTopBar(...)` or `useScreenTitle(...)`. | All authenticated screens |
| `TopBar Action` | A screen-defined action with icon, handler, and optional label; it may render directly in `TopBar` or inside overflow. | Screens using `useScreenTopBar(...)` |
| `Overflow Menu` | The `More` menu opened from `TopBar` when not all actions fit in the available width. | `TopBar` on narrower layouts or long-title screens |
| `Sidebar` | Persistent left navigation rail used in desktop/tablet sidebar modes. | `NavLayout` |
| `Collapsed Sidebar` | Narrow sidebar variant using short nav labels in compact sidebar mode. | `NavLayout` when `shellMode=sidebar-collapsed` |
| `Drawer` | Overlay navigation pattern used for compact web and native phone flows. | `CompactWebNavLayout`, `MobileNavLayout` |
| `Drawer Panel` | The visible navigation panel containing nav items and sign-out control. | Inside drawer overlay |
| `Drawer Backdrop` | The translucent overlay area outside the panel that closes the drawer on press. | Drawer variants |
| `Bottom Bar` | Fixed bottom action bar on native phone with navigation controls. | `MobileNavLayout` |
| `Menu Button` | Icon-only control used for navigation chrome actions: expands/collapses the web/tablet sidebar rail and opens the native-phone drawer. | Sidebar rail on web/tablet, bottom bar on native phone |
| `Back Button` | Native-phone bottom bar action that triggers router back navigation. | `MobileNavLayout` |
| `Nav Item` | Role-filtered route entry in sidebar/drawer navigation list. | All nav variants |
| `Sign out Button` | Session termination action placed at the end of sidebar/drawer navigation. | All nav variants |
| `Content Column` | Main right-side area in sidebar layouts that contains `TopBar` + scrollable content. | `NavLayout` sidebar modes |
| `Screen Content` | Scrollable module body rendered below `TopBar` (screen-specific forms/cards/lists). | Feature screens |

Terminology guidance:
1. Use `TopBar` instead of generic alternatives like "header" when referencing this component in code tasks and tickets.
2. Use `Drawer` for native-phone overlay navigation; reserve `Sidebar` for persistent web/tablet nav rails.
3. Use `Page Title` for module titles and avoid rendering title text inside screen content containers.

### 9. Theme & Styling System
Styling in v2 is centralized around semantic theme tokens and reusable UI primitives.

Theme architecture:
1. `frontend/src/theme/themes.ts` defines light and dark semantic color sets.
2. `frontend/src/theme/tokens.ts` defines shared spacing, radii, and layout values.
3. `frontend/src/theme/ThemeProvider.tsx` resolves active mode from system color scheme and exposes typed theme context.
4. `frontend/src/theme/types.ts` defines shared app theme contracts.
5. Root wiring mounts `AppThemeProvider` in `frontend/app/_layout.tsx`, so all routes use one theme source.

Screen styling conventions:
1. Shared screen-level definitions live in `frontend/src/theme/stylePresets.ts` for repeated title/meta/card/form/button patterns.
2. `frontend/src/theme/useThemedStyles.ts` generates memoized style objects from the current theme.
3. App screens should use semantic style values (for example textPrimary, border, accent) instead of raw color literals.
4. Main-content action buttons can use the shared `contentAction*` preset keys in `stylePresets.ts` (layout row, base, hover/pressed, disabled, text, disabled text) to match `TopBar` action visual language in content areas.

Reusable UI primitives:
1. `frontend/src/components/ui/ThemedButton.tsx`
2. `frontend/src/components/ui/ThemedInput.tsx`
3. `frontend/src/components/ui/ThemedCard.tsx`
4. `frontend/src/components/ui/AppModal.tsx` rendered globally via `frontend/src/context/AppModalContext.tsx` and exposed through `frontend/src/hooks/useAppModal.ts` plus an imperative controller for non-component callers.

Theme behavior:
1. App config uses `userInterfaceStyle: automatic` so the app follows OS light/dark preference.
2. Android dev-build support for appearance switching is enabled with `expo-system-ui`.

Modal system:
1. Global modals are mounted at root level via `AppModalProvider` in `frontend/app/_layout.tsx`.
2. Screens access modals via `useAppModal()` hook from `frontend/src/hooks/useAppModal.ts`.
3. The hook exposes typed modal functions for consistent UX across the app.

`useAppModal()` hook API:
1. `showInfo(title, message?)` — Informational modal with OK button.
2. `showSuccess(title, message?)` — Success modal with OK button.
3. `showWarning(title, message?)` — Warning modal with OK button.
4. `showDanger(title, message?)` — Danger/error modal with OK button.
5. `showConfirm(options)` — Confirmation modal returning `Promise<boolean>`.

`showConfirm(options)` parameters:
1. `title` (required) — Modal title text.
2. `message?` — Optional message body.
3. `confirmLabel?` — Text for confirm button (default: 'Confirm').
4. `cancelLabel?` — Text for cancel button (default: 'Cancel').
5. `confirmVariant?` — Button variant: 'primary' | 'secondary' | 'danger' (default: 'primary').
6. `dismissible?` — Allow closing by backdrop click (default: true).
7. `onConfirm?` — Callback executed before resolve(true).
8. `onCancel?` — Callback executed before resolve(false).
9. `onDismiss?` — Callback if modal dismissed via backdrop.

Implementation pattern for confirmations:
1. Import the hook: `import { useAppModal } from '@src/hooks/useAppModal';`
2. Destructure the function: `const { showConfirm } = useAppModal();`
3. Call asynchronously to wait for user decision:
```ts
const confirmed = await showConfirm({
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel: 'Proceed',
  cancelLabel: 'Cancel',
  confirmVariant: 'danger', // Use 'danger' for destructive actions
});

if (!confirmed) {
  return; // User cancelled
}

// Proceed with action
```

Modal guidelines:
1. Use `showConfirm()` for high-impact or destructive actions (delete, dispatch, save with unsaved changes, password changes).
2. Use `confirmVariant: 'danger'` for destructive confirmations (reset form, delete record).
3. Use `confirmVariant: 'primary'` for reversible confirmations (save, dispatch, proceed).
4. Always provide custom `confirmLabel` and `cancelLabel` to clarify intent (e.g., "Dispatch" instead of "Confirm").
5. Keep messages brief and action-focused; include context like record ID or scope if needed.
6. Pair confirmations with `useCallback` memoization on handler functions to prevent modal state loops.

### 10. Icon Packages
Two icon libraries are installed and available across the app:

1. **`@expo/vector-icons`** — wraps popular icon sets (Ionicons, MaterialIcons, FontAwesome, etc.) and is included in the Expo SDK. Best for navigational chrome, tab bars, and UI controls where a broad named-icon vocabulary is needed.
2. **`lucide-react-native`** — a consistent, stroke-based icon set rendered via `react-native-svg`. Best for content-area icons, feature icons, and anywhere visual consistency across icon instances matters.

> **Note:** The preferred primary package for each specific use context (navigation, actions, status indicators, etc.) will be defined as those screens are built out.

### 11. Operational Status (Current)
Current baseline after latest migration and fixes:
1. Unified `/(app)` structure implemented.
2. Legacy split route groups removed in active v2 app.
3. Login redirect mismatch fixed to concrete route targets.
4. Web runtime issue related to route-link style forwarding mitigated by explicit navigation handlers.
5. Expo dependency health validated with full pass in expo-doctor.
6. Centralized theming and reusable UI primitives are wired across auth and app module screens.
7. API base URL and local web auth override are now environment-driven via `frontend/.env`.
8. Navigation shell split into `MobileNavLayout` and `CompactWebNavLayout` with shared `TopBar` component.
9. Screen title system implemented via `ScreenTitleContext` and `useScreenTitle` hook; all 11 authenticated screens use it.
10. Top bar action system introduced via `useScreenTopBar`, enabling per-screen multi-action icon buttons in `TopBar`.
11. Orders list now uses two `TopBar` actions (`refresh-orders`, `create-order`) to demonstrate multi-button registration and handlers.
12. Hidden `TopBar` actions are no longer dropped on narrow layouts; they move into a `More` overflow menu.
13. Customer detail uses `TopBar` editing actions (`edit-customer`, `save-customer`, `reset-customer-form`, `cancel-customer-edit`), making it the primary reference for state-dependent screen actions and overflow behavior.
14. Account now keeps only `reset-password-form` in `TopBar`; password submission uses a right-aligned in-content `Save` button directly below the `New password` input, wired to shared `contentAction*` style presets so the same button pattern can be reused across main content screens.
15. Create Order uses `TopBar` actions (`submit-create-order`, `reset-create-order-form`) so order creation follows the same page-level action pattern as the other form screens.
16. TopBar action reference screens now use the shared `buildIconTopBarAction(...)` helper for consistent icon renderer generation and label/accessibility handling.
17. Customers, Users, and Documents list screens now use `TopBar` refresh actions (`refresh-customers`, `refresh-users`, `refresh-documents`) to support explicit data reload without in-content control duplication.
18. TopBar `More` overflow interaction is stabilized so the menu remains open for item selection instead of dismissing immediately on transient action-state updates.
19. TopBar action handlers on form-heavy screens are memoized to keep action references stable and prevent React maximum update-depth loops in `useScreenTopBar(...)` flows.
20. On web, `TopBar` action buttons now use the same hover background treatment as sidebar/drawer nav menu items for interaction consistency.
21. Order Detail now renders `Mark as dispatched` with the shared `contentAction*` main-content button preset, matching the reusable action-button styling contract used by Account.
22. A shared `TooltipPressable` primitive now wraps all button interactions (including `TopBar`, navigation rails/drawers, auth actions, and screen-level action buttons) so every button exposes a tooltip label without duplicating per-screen tooltip logic.
23. Native-phone drawer interaction is hardened so a closing/invisible drawer overlay cannot continue intercepting touch input; this prevents intermittent "app unresponsive" states after rapid open/close interactions.
24. Additional native-phone interaction hardening now closes `TopBar` overflow state on route changes, raises bottom-bar hit-testing order explicitly, and uses measured bottom-bar height for content padding to avoid clipped or unclickable lower-screen content.
25. Native-phone drawer `Sign out` now uses the same icon-led row pattern as sidebar navigation items (matching web parity) so icon and label alignment stay consistent across navigation actions.
26. A global cross-platform modal subsystem is now mounted at root level (`AppModalProvider`) so screens and shared modules can open typed modals (`info`, `success`, `warning`, `danger`, `confirm`) from anywhere using either `useAppModal()` or the shared modal controller.
27. Customer Detail, Account, and Create Order screens now use confirm modals for destructive and high-impact actions: save/reset on Customer Detail, password change on Account, and order creation on Create Order; these modals provide consistent confirmation UX with customizable messages and danger-variant styling for reset/destructive flows.
28. `TopBar` back actions are now automatically hidden in native-phone drawer layouts so only the bottom-bar `Back Button` is shown, avoiding duplicate back controls on mobile.
29. `ThemedCard` now supports a dedicated in-card header row contract (`title` / `titleNode` + optional `TopBar Action` arrays) so card titles render left and card actions render on the same row at the top-right, while still reusing the shared action contract and `More` overflow behavior used by `TopBar`.
30. `TopBar` now right-pins `Back` actions within visible header actions so they render at the far right edge; non-back actions (for example refresh/create) render to the left and extra actions continue to use overflow when space is constrained.
31. Order Detail now includes a full `TopBar` edit workflow (`edit-order`, `save-order`, `reset-order-form`, `cancel-order-edit`) that mirrors Customer Detail editing patterns and persists updates through `PUT /api/orders/{orderNumber}/{orderBatch}`.
32. Order Detail now shows a success modal after save completes, providing immediate optimistic feedback once `PUT /api/orders/{orderNumber}/{orderBatch}` resolves successfully.
33. Field-level validation on Order Detail edit remains schema-aligned with the published OpenAPI contract: `deliveryAddress` is validated as numeric while `priceBand` remains free-text because the current `UpdateOrderDto` schema does not declare enum/pattern constraints.
34. Collapsed-sidebar choreography now drives icon slot translation from the same animated sidebar-width value, with an early settle window so nav-item and sign-out icons are already in final collapsed alignment before the rail width reaches its terminal compact size.
35. Sidebar menu-toggle icon choreography now uses the same settle breakpoint profile as sidebar item icon motion, crossfading between expand/collapse glyphs so toggle state perception remains uniform with rail-collapse timing.
36. Orders, Customers, and Users list screens now render typed domain cards (`OrderCard`, `CustomerCard`, `UserCard`) that own their card-level action definitions, replacing inline generic card action wiring in list screens.
37. Card-level action icon sets are now domain-specific: Orders use edit/dispatch variants (`Pencil`, `Send`/`SquareCheck`), Customers use an edit action (`Pencil`), and Users intentionally render without card action buttons.
38. Order and Customer card edit actions now deep-link into their detail screens with `mode=edit` so destination screens open directly in edit mode; Order card dispatch actions are rendered only for mutating roles and run in-place on the Orders list screen, opening the same `Mark as dispatched` confirmation modal copy and executing the same dispatch endpoint flow without routing away first.
39. Primary list screen text search and filter interactions are now applied client-side after data fetch (Orders, Customers, Users, Price List, Documents), while API requests are limited to baseline list endpoints to avoid backend 400 responses from unsupported query keys in stricter deployments.
40. Orders now have a centralized feature API client (`frontend/src/features/orders/api.ts`) that wires the full documented Orders endpoint surface (order CRUD, tracking, dispatch, breakdown PDF, item CRUD, serial lookup, checkout/unchecked-out), and shared request handling now supports binary (`blob`) responses required for breakdown downloads.
41. Order Detail now exposes additional `TopBar` actions for tracking lookup, order-breakdown download, and order voiding, all aligned to modal confirmation/feedback patterns and wired to the documented Orders endpoints.
42. Order Detail now includes a full Ordered Items workflow using the centralized Orders API client: list items, add by serial, edit key fields, void item, and toggle checkout/unchecked-out state with confirmation modals.
43. A reusable `OrderItemCard` component now renders item-level metadata and action buttons in card-header action slots, keeping Orders item interaction patterns consistent with shared card/action architecture.
44. Orders list filtering now sends server-side query parameters (`includeVoided`, `status`, `customerId`, `page`, `limit`) through the centralized Orders API client, with a guarded fallback to baseline list requests when deployments reject filter query keys.
45. Order tracking now has a dedicated detail route (`/(app)/orders/[orderNumber]/[orderBatch]/tracking`) with a themed summary/history view, refresh action, and raw payload diagnostics, replacing modal-only tracking output.
46. Order breakdown downloads now support native save/share flows using Expo file and sharing modules: web continues direct browser download, while iOS/Android download to cache and open the platform share sheet.
47. Ordered Items now support server-backed pagination controls in Order Detail (`page`/`limit`), and the tracking history view now includes client-side pagination controls for long status timelines.
48. Ordered Item editing now occurs inline within the same item card: entering edit mode transforms the card body to editable fields and replaces the card's edit action with Save + Cancel action icons, removing the detached form block below the list.
49. Order-level editing controls are now card-scoped for consistency with item cards: the Order card exposes edit/save/reset/cancel actions in its header, and the TopBar no longer contains order edit/save/reset actions.
50. `ThemedCard` action-only headers now render as floating top-right overlays (no reserved header height), preventing icon action rows from pushing card body content downward when cards have actions but no title.
51. Floating action-only card controls now use the same top/right inset as regular card content padding so button spacing from card borders remains consistent across titled and non-titled cards.
52. Entering Order card edit mode now transitions in-place without triggering a transient order reload/loading state, so the card morphs into editable fields consistently with item-card inline edit behavior.
53. The Order Tracking screen now renders an `Updates` timeline experience (replacing `Status History`) with Lucide status icons, status badges, expandable update rows, status-filter dropdown controls, a step-journey rail, consistency/problem checks, and item-status snapshots while still retaining raw payload diagnostics for API troubleshooting.

### 12. Runtime & Dependency Baseline
The v2 frontend currently runs with:
1. expo `~54.0.33`
2. expo-router `~6.0.23`
3. expo-secure-store `~15.0.8`
4. expo-constants `~18.0.13`
5. expo-linking `~8.0.11`
6. expo-system-ui `~6.0.9`
7. react-native-safe-area-context `~5.6.0`
8. react-native-screens `~4.16.0`
9. @types/react `~19.1.10`

### 13. Scope Boundaries
Out of scope for this repository layer:
1. Backend data persistence and transactional rules.
2. Server-side authorization policy definitions.
3. API contract ownership.

This frontend is a role-aware client and orchestration surface over SLOMS API contracts.