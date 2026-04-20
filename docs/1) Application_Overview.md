# Sonic Labs Client Portal & Mobile Application
## Application Overview

### 1. Executive Summary
The Sonic Labs application is a secure, cross-platform client portal and mobile interface designed to streamline operations, manage customer data, and facilitate order processing (including custom Ear Mould production). It provides a responsive and intuitive user experience for administrators, managers, operatives, and read-only clients.

### 2. Architectural Paradigm
The project utilises a strictly frontend-driven architecture, designed to be lightweight and highly performant. 
* **Frontend Framework:** React Native via Expo, utilising Expo Router for modern, file-based navigation.
* **Language:** TypeScript, ensuring strict type safety and interface alignment across the codebase.
* **Backend Abstraction:** There is no local database, ORM, or backend logic within this repository. All business rules, database management, and data persistence are entirely abstracted to the external **SLOMS (Sonic Labs Order Management System) REST API 1.0**.

### 3. How It Works (Data Flow & Networking)
The application functions as a robust presentation and data-capture layer:
1. **API-Driven Interface:** Whether a user is viewing a price list, checking active VAT rates, or generating a new order, the application interfaces directly with the SLOMS API endpoints (e.g., `/api/orders`, `/api/customers`, `/api/vat-rates`).
2. **Strict DTO Mapping:** Data captured via the application's UI is formatted to strictly match defined Data Transfer Object (DTO) schemas (e.g., `CreateOrderDto`) before any network transmission occurs.
3. **Centralised Networking:** All external network communications are routed through a central utility wrapper (`frontend/utils/api.ts`) pointing to the configured `EXPO_PUBLIC_API_BASE_URL`. This ensures uniform handling of API requests and consistent standardisation of headers.

### 4. Security & Authentication
* **Token-Based Sessions:** Access to the SLOMS API is strictly secured via JSON Web Tokens (JWT). 
* **Authentication Flow:** Upon successful authentication via the `POST /api/auth/login` endpoint, the SLOMS API provisions a Bearer token.
* **Secure Token Management:** This token is securely stored on the user's device and is automatically injected into the `Authorization` header for all subsequent protected API requests. Should a session expire (triggering a 401 Unauthorised response from the API), the application smoothly intercepts the error, clears the secure store, and redirects the user back to the public login route.