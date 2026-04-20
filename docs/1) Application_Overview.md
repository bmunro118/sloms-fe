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
1. Login via `POST /api/auth/login`.
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
1. Web: localStorage-based token persistence for the current v2 implementation.
2. Mobile: `expo-secure-store` for device-secure storage.

Security notes:
1. JWT payload is decoded client-side for identity/role bootstrap.
2. Backend remains source of truth; `/api/auth/me` is used to validate active session identity.
3. All protected requests are made with Authorization header Bearer token via shared API utility.

### 6. API Integration Pattern
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

### 7. UI Shell & Navigation
The authenticated shell is role-driven:
1. Single navigation component renders different item sets based on role.
2. Staff and customer experiences share one structural shell.
3. Route transitions are handled with explicit router navigation handlers.

### 8. Operational Status (Current)
Current baseline after latest migration and fixes:
1. Unified `/(app)` structure implemented.
2. Legacy split route groups removed in active v2 app.
3. Login redirect mismatch fixed to concrete route targets.
4. Web runtime issue related to route-link style forwarding mitigated by explicit navigation handlers.
5. Expo dependency health validated with full pass in expo-doctor.

### 9. Runtime & Dependency Baseline
The v2 frontend currently runs with:
1. expo `~54.0.33`
2. expo-router `~6.0.23`
3. expo-secure-store `~15.0.8`
4. expo-constants `~18.0.13`
5. expo-linking `~8.0.11`
6. react-native-safe-area-context `~5.6.0`
7. react-native-screens `~4.16.0`
8. @types/react `~19.1.10`

### 10. Scope Boundaries
Out of scope for this repository layer:
1. Backend data persistence and transactional rules.
2. Server-side authorization policy definitions.
3. API contract ownership.

This frontend is a role-aware client and orchestration surface over SLOMS API contracts.