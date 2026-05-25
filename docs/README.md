# Sonic App v2 Documentation

## Overview

This folder contains the active project docs for `sonic_app`.

## Primary Documents

1. `1) Application_Overview.md`
	1. Current architecture and runtime baseline.
	2. Unified `/(app)` routing model.
	3. Authentication/session flow and role model.
2. `2) SLOMS_API_Surface.md`
	1. Consolidated SLOMS OpenAPI surface used by the frontend.
	2. Auth, users, customers, orders, price-list, settings, and VAT endpoints.

## Frontend Technical Shape (Current)

1. Framework: Expo SDK 54 + Expo Router.
2. Route model: single authenticated route group `app/(app)/`.
3. Auth flow: login, forced password change, session hydration via `/api/auth/me`.
4. API integration: centralized endpoint registry and request utility in `frontend/utils/`.

## Environment Configuration

1. Frontend runtime env file location: `frontend/.env`.
2. Frontend-exposed variables must be prefixed with `EXPO_PUBLIC_`.
3. Current runtime variables:
	1. `EXPO_PUBLIC_API_URL` (required API base URL)
	2. `EXPO_PUBLIC_WEB_AUTH_MODE` (optional web localhost auth override: `cookie` or `token`)
4. A safe template is provided at `frontend/.env.example`.
5. Local env files are gitignored; do not commit real environment values.

Related detail:
1. See `1) Application_Overview.md` for runtime behavior and auth mode resolution rules.

## Directory Context

1. `frontend/app/` contains public routes and the unified authenticated app routes.
2. `frontend/src/context/` contains auth state and providers.
3. `frontend/src/components/` contains navigation and UI building blocks.
4. `frontend/utils/` contains API configuration, HTTP wrapper, and token helpers.

## Notes

1. This docs set reflects the post-migration unified interface structure.
2. Legacy split route groups `(admin)`, `(client)`, and `(shared)` are no longer used in active v2 app routing.
