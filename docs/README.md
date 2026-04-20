# Sonic App v2 Documentation

## Overview

This folder contains the active project docs for `sonic_app_v2`.

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

## Directory Context

1. `frontend/app/` contains public routes and the unified authenticated app routes.
2. `frontend/src/context/` contains auth state and providers.
3. `frontend/src/components/` contains navigation and UI building blocks.
4. `frontend/utils/` contains API configuration, HTTP wrapper, and token helpers.

## Notes

1. This docs set reflects the post-migration unified interface structure.
2. Legacy split route groups `(admin)`, `(client)`, and `(shared)` are no longer used in active v2 app routing.
