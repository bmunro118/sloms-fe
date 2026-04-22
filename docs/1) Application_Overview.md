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
3. Viewport dimensions (width/height) are then used to choose shell presentation mode (`sidebar`, `sidebar-collapsed`, `drawer`) within the resolved platform/device profile.
4. Web continues to use desktop/compact profile breakpoints, while native layout decisions require both device type and viewport state.
5. Native phone drawer layouts use a `TopBar` (title only) at the top and a bottom navigation bar with `Back` and `Menu` actions; `Menu` opens the navigation drawer and sign-out remains inside the drawer panel.
6. Compact web layouts render a `TopBar` that contains a left-aligned `Menu` button and the current page title; pressing `Menu` opens the compact navigation drawer.
7. Desktop and tablet sidebar layouts render a `TopBar` (title only) above the scrollable content column, to the right of the sidebar.

Navigation shell components:
1. `NavLayout` (`src/components/navigation/NavLayout.tsx`) — root orchestrator; reads `platformProfile` and `shellMode`, delegates to the appropriate layout variant.
2. `MobileNavLayout` (`src/components/navigation/MobileNavLayout.tsx`) — drawer variant for `native-phone`; top bar + scrollable content + bottom bar.
3. `CompactWebNavLayout` (`src/components/navigation/CompactWebNavLayout.tsx`) — drawer variant for `web-compact`; top bar with inline menu button + left-side drawer panel.
4. `TopBar` (`src/components/navigation/TopBar.tsx`) — shared top bar used by all three variants; reads the current title from `ScreenTitleContext`; renders an optional left-side menu button when `onMenuPress` is provided.

Screen title propagation:
1. `ScreenTitleContext` (`src/context/ScreenTitleContext.tsx`) holds the active page title string and `setTitle` setter; `ScreenTitleProvider` wraps `NavLayout` in `app/(app)/_layout.tsx`.
2. Each screen calls `useScreenTitle(title)` (`src/hooks/useScreenTitle.ts`) to register its title; the hook sets the context value on mount and clears it on unmount.
3. Screen content does not contain a title `Text` element; the title is rendered exclusively by `TopBar`.

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

Reusable UI primitives:
1. `frontend/src/components/ui/ThemedButton.tsx`
2. `frontend/src/components/ui/ThemedInput.tsx`
3. `frontend/src/components/ui/ThemedCard.tsx`

Theme behavior:
1. App config uses `userInterfaceStyle: automatic` so the app follows OS light/dark preference.
2. Android dev-build support for appearance switching is enabled with `expo-system-ui`.

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