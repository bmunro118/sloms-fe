# Sonic App v2 Build Guide

## 1. Project Purpose

Sonic App v2 is a frontend-only Expo application that acts as a role-aware client portal for SLOMS (Sonic Labs Order Management System).

The app:
1. Authenticates users against SLOMS.
2. Renders one unified authenticated interface.
3. Calls SLOMS REST API endpoints for all business data and operations.

The app does not:
1. Own backend persistence.
2. Implement server-side authorization rules.
3. Define API contracts independently from SLOMS.

## 2. Core Stack

1. Expo SDK 54
2. Expo Router 6
3. React Native + TypeScript
4. Web + mobile targets

Key dependencies in current baseline:
1. `expo ~54.0.33`
2. `expo-router ~6.0.23`
3. `expo-secure-store ~15.0.8`
4. `expo-constants ~18.0.13`
5. `expo-linking ~8.0.11`
6. `react-native-safe-area-context ~5.6.0`
7. `react-native-screens ~4.16.0`
8. `@types/react ~19.1.10`

## 3. Routing Model (Unified Interface)

Use one authenticated route group: `app/(app)/`.

Public routes:
1. `app/index.tsx` (login)
2. `app/change-password.tsx` (forced password change)

Authenticated routes live under `app/(app)/`, including:
1. `dashboard`
2. `orders` (list/create/detail)
3. `customers` (list/detail)
4. `users`
5. `price-list`
6. `settings`
7. `documents`
8. `account`

Guidance:
1. Do not reintroduce split route groups like `(admin)`, `(client)`, `(shared)`.
2. Handle role differences via permissions/UI behavior, not duplicated route trees.

## 4. Authentication and Session Flow

Authentication is JWT-based.

Expected flow:
1. Login: `POST /api/auth/login`
2. If `mustChangePassword=true` or JWT scope is `password_change`, redirect to `app/change-password.tsx`
3. Forced change: `POST /api/auth/change-password`
4. Hydrate session identity: `GET /api/auth/me`
5. Sign out: clear local auth state/token

Role model in app state:
1. `Admin`
2. `Manager`
3. `Operative`
4. `ReadOnly`
5. `Customer`

Derived helper semantics:
1. `isStaff` => non-customer roles
2. `isAdmin` => admin role
3. `canMutate` => roles that can perform mutating actions

## 5. Token Storage Rules

1. Web: localStorage-based token persistence in current v2 implementation.
2. Mobile: secure storage via `expo-secure-store`.

Security behavior:
1. Decode JWT payload client-side for bootstrap only.
2. Treat backend responses as source of truth.
3. Send Bearer token on protected requests.

## 6. API Integration Rules

All API usage must go through centralized utilities:
1. `frontend/utils/config.ts` for base URL and endpoints.
2. `frontend/utils/api.ts` for request execution and auth handling.

Do not scatter hardcoded API URLs across screens.

Base URL:
1. `https://slomsapi.wonderfulsky-1907992c.uksouth.azurecontainerapps.io`

## 7. SLOMS API Surface (Current)

### 7.1 Auth
1. `POST /api/auth/login`
2. `POST /api/auth/change-password`
3. `GET /api/auth/me`

### 7.2 Users
1. `GET /api/users/me`
2. `PATCH /api/users/me/password`
3. `GET /api/users/audit-log`
4. `GET /api/users`
5. `POST /api/users`
6. `GET /api/users/{id}`
7. `PUT /api/users/{id}`
8. `DELETE /api/users/{id}`
9. `PATCH /api/users/{id}/deactivate`
10. `PATCH /api/users/{id}/reactivate`
11. `PATCH /api/users/{id}/unlock`
12. `PATCH /api/users/{id}/reset-password`

### 7.3 Customers
1. `GET /api/customers`
2. `POST /api/customers`
3. `GET /api/customers/{id}`
4. `PUT /api/customers/{id}`
5. `PATCH /api/customers/{id}/suspend`
6. `PATCH /api/customers/{id}/reinstate`
7. `GET /api/customers/{customerId}/addresses`
8. `POST /api/customers/{customerId}/addresses`
9. `GET /api/customers/{customerId}/addresses/{addressId}`
10. `PUT /api/customers/{customerId}/addresses/{addressId}`
11. `DELETE /api/customers/{customerId}/addresses/{addressId}`
12. `PATCH /api/customers/{customerId}/addresses/{addressId}/set-default`

### 7.4 Orders
1. `GET /api/orders`
2. `POST /api/orders`
3. `GET /api/orders/{orderNumber}/{orderBatch}`
4. `PUT /api/orders/{orderNumber}/{orderBatch}`
5. `DELETE /api/orders/{orderNumber}/{orderBatch}`
6. `GET /api/orders/{orderNumber}/{orderBatch}/tracking`
7. `PATCH /api/orders/{orderNumber}/{orderBatch}/dispatch`
8. `GET /api/orders/{orderNumber}/{orderBatch}/breakdown`
9. `GET /api/orders/items/{serialNumber}`
10. `GET /api/orders/{orderNumber}/{orderBatch}/items`
11. `POST /api/orders/{orderNumber}/{orderBatch}/items`
12. `GET /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`
13. `PUT /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`
14. `DELETE /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`
15. `PATCH /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}/checkout`
16. `PATCH /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}/unchecked-out`

### 7.5 Price List
1. `GET /api/price-list`
2. `GET /api/price-list/{itemId}`
3. `GET /api/price-list/{itemId}/lists`
4. `GET /api/price-list/{itemId}/lists/{listName}`
5. `DELETE /api/price-list/items/{itemId}`
6. `GET /api/price-list/lists`
7. `DELETE /api/price-list/lists/{id}`
8. `GET /api/price-list/revisions`
9. `GET /api/price-list/revisions/{id}`
10. `POST /api/price-list/revisions/{id}/activate`
11. `GET /api/price-list/export`
12. `POST /api/price-list/import`

### 7.6 Settings
1. `GET /api/settings`
2. `GET /api/settings/{key}`
3. `PUT /api/settings/{key}`
4. `GET /api/settings/{key}/value`
5. `PATCH /api/settings/{key}/value`
6. `GET /api/settings/user`
7. `GET /api/settings/user/{key}`
8. `PUT /api/settings/user/{key}`
9. `DELETE /api/settings/user/{key}`

### 7.7 VAT Rates
1. `GET /api/vat-rates`
2. `POST /api/vat-rates`
3. `GET /api/vat-rates/current`
4. `PATCH /api/vat-rates/{id}/close`

## 8. Role and Access Expectations

1. `Customer` users see only their own scoped data from backend policies.
2. Staff roles can access broader operations depending on role and UI policy.
3. UI must hide or disable actions for non-mutating roles (`ReadOnly`, `Customer`).
4. Backend authorization remains final arbiter; frontend should handle 401/403 cleanly.

## 9. Implementation Guardrails for Gemini Gem

1. Always check this guide before proposing code changes.
2. Keep architecture aligned with unified routing.
3. Reuse existing endpoint constants and request utilities.
4. Avoid creating duplicate screens by role when behavior can be controlled by permissions.
5. Validate outputs against both frontend constraints and API contracts.

## 10. Documentation Source of Truth

This guide is derived from and must stay consistent with:
1. `sonic_app_v2/sonic_app/docs/1) Application_Overview.md`
2. `sonic_app_v2/sonic_app/docs/2) SLOMS_API_Surface.md`
