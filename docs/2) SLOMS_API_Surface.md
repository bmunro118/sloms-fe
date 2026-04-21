# SLOMS API Surface

**Base URL:** `https://slomsapi.wonderfulsky-1907992c.uksouth.azurecontainerapps.io`  
**Spec:** OpenAPI 3.0 — interactive docs at `/api/docs`  
**Version:** 1.0

REST API for the SLOMS (Sonic Labs Order Management System) backend.  
Protected endpoints use a hybrid auth model: web clients authenticate with `HttpOnly` cookies, while native mobile clients use a **Bearer JWT** in the `Authorization` header obtained from `POST /api/auth/login`.

---

## Authentication

Security scheme:
1. Web: browser-managed `HttpOnly` session cookie.
2. Mobile: `access-token` (HTTP Bearer, JWT)

```
Authorization: Bearer <accessToken>
```

---

## Roles

| Role        | Description                                                  |
|-------------|--------------------------------------------------------------|
| `Admin`     | Full access to all endpoints                                 |
| `Manager`   | Staff-level access with elevated permissions                 |
| `Operative` | Standard staff user                                          |
| `ReadOnly`  | Staff user with read-only access                             |
| `Customer`  | Portal user — scoped to their own linked customer account    |

Customer-role users must have a `linkedCustomerId` set at creation and automatically see only their own data.

---

## Endpoints

### auth — Authentication

| Method | Path | Summary | Auth Required |
|--------|------|---------|---------------|
| `POST` | `/api/auth/login` | Login with username and password | No |
| `POST` | `/api/auth/change-password` | Complete a forced password change | No (scoped token) |
| `GET`  | `/api/auth/me` | Get current user session info | Yes |

---

#### `POST /api/auth/login`

Authenticates a user and issues a platform-appropriate session credential on success.

**Request body:**
```json
{
  "username": "admin",
  "password": "Admin@1234",
  "clientType": "web"
}
```

`clientType` rules:
1. `web`: returns auth via `Set-Cookie`; token is not included in the JSON body.
2. `mobile`: returns `accessToken` in the JSON body for secure device storage.

**Response 200:** Login successful — returns session metadata, and for mobile also returns `accessToken`, `userId`, `username`, `role`, `fullName`.

> If `mustChangePassword` is `true`, the response returns a short-lived `password_change`-scoped token. Pass it to `POST /api/auth/change-password` before any other request.

---

#### `POST /api/auth/change-password`

Completes a forced password change. Only accepts the short-lived `password_change`-scoped token returned by `/api/auth/login` when `mustChangePassword` is `true`. Returns a full-access token on success.

**Request body:**
```json
{
  "newPassword": "NewPassword1!"
}
```

**Response 200:** Password updated — returns a full-access token.

---

#### `GET /api/auth/me`

Returns the decoded JWT payload for the authenticated user.

**Response 200:** Returns `userId`, `username`, and `role` from the JWT.

---

### users — User Management

| Method   | Path                          | Summary                    | Roles        |
|----------|-------------------------------|----------------------------|--------------|
| `GET`    | `/api/users/me`               | Get own profile            | All          |
| `PATCH`  | `/api/users/me/password`      | Change own password        | All          |
| `GET`    | `/api/users/audit-log`        | Get user audit log         | Admin        |
| `GET`    | `/api/users`                  | List all users             | Admin        |
| `POST`   | `/api/users`                  | Create a new user          | Admin        |
| `GET`    | `/api/users/{id}`             | Get a user by ID           | Admin        |
| `PUT`    | `/api/users/{id}`             | Update a user              | Admin        |
| `DELETE` | `/api/users/{id}`             | Delete a user (permanent)  | Admin        |
| `PATCH`  | `/api/users/{id}/deactivate`  | Deactivate a user          | Admin        |
| `PATCH`  | `/api/users/{id}/reactivate`  | Reactivate a user          | Admin        |
| `PATCH`  | `/api/users/{id}/unlock`      | Unlock a user account      | Admin        |
| `PATCH`  | `/api/users/{id}/reset-password` | Reset a user's password | Admin        |

---

#### `GET /api/users/me`

Returns the currently authenticated user's profile (`passwordHash` excluded). Available to all authenticated users.

---

#### `PATCH /api/users/me/password`

Changes the authenticated user's own password. Requires the current password for verification.

**Request body:**
```json
{
  "currentPassword": "OldPassword1!",
  "newPassword": "NewPassword1!"
}
```

---

#### `GET /api/users/audit-log`

Returns paginated audit trail entries for user authentication events. Admin only.

**Query parameters:**

| Param    | Type    | Description |
|----------|---------|-------------|
| `userId` | number  | Filter by user ID |
| `event`  | string  | Filter by event type: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGIN_LOCKED`, `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED` |
| `page`   | number  | Page number (1-based, default 1) |
| `limit`  | number  | Records per page (default 25, max 100) |

---

#### `GET /api/users`

Returns all user records (`passwordHash` excluded). Admin only.

**Query parameters:**

| Param             | Type    | Description |
|-------------------|---------|-------------|
| `includeInactive` | boolean | Set to `true` to include deactivated accounts |
| `page`            | number  | Page number (1-based, default 1) |
| `limit`           | number  | Records per page (default 25, max 100) |

---

#### `POST /api/users`

Creates a new user account with a hashed password. Admin only.

**Request body examples:**

```json
// Staff — Operative
{
  "username": "jsmith",
  "password": "Password1!",
  "fullName": "John Smith",
  "email": "jsmith@example.com",
  "role": "Operative"
}

// Manager
{
  "username": "sarahm",
  "password": "Password1!",
  "fullName": "Sarah Mills",
  "email": "sarahm@example.com",
  "role": "Manager"
}

// Read-only staff
{
  "username": "viewer01",
  "password": "Password1!",
  "fullName": "View Only",
  "email": "viewer@example.com",
  "role": "ReadOnly"
}

// Customer portal user (requires linkedCustomerId)
{
  "username": "cust_acme",
  "password": "Password1!",
  "fullName": "ACME Contact",
  "email": "contact@acme.com",
  "role": "Customer",
  "linkedCustomerId": 42
}
```

---

#### `PUT /api/users/{id}`

Updates username, role, email, full name, active flag, or password. Admin only.

**Request body examples:**
```json
// Promote to Manager
{ "role": "Manager" }

// Update email
{ "email": "newemail@example.com" }

// Link customer user to a different account
{ "linkedCustomerId": 99 }

// Deactivate inline
{ "isActive": false }
```

---

#### `DELETE /api/users/{id}`

Permanently deletes a user account. Admin only. You cannot delete your own account.

---

#### `PATCH /api/users/{id}/deactivate`

Soft-disables the user account (`isActive = false`). Admin only.

---

#### `PATCH /api/users/{id}/reactivate`

Re-enables a previously deactivated user account (`isActive = true`). Admin only.

---

#### `PATCH /api/users/{id}/unlock`

Clears any active login lockout and resets the failed login counter. Admin only.

---

#### `PATCH /api/users/{id}/reset-password`

Allows an Admin to set a new password for any user without requiring the current password.

**Request body:**
```json
{ "newPassword": "NewPassword1!" }
```

---

### customers — Customer Accounts & Addresses

| Method   | Path                                                              | Summary                               |
|----------|-------------------------------------------------------------------|---------------------------------------|
| `GET`    | `/api/customers`                                                  | List all customers                    |
| `POST`   | `/api/customers`                                                  | Create a new customer                 |
| `GET`    | `/api/customers/{id}`                                             | Get a customer by ID                  |
| `PUT`    | `/api/customers/{id}`                                             | Update a customer                     |
| `PATCH`  | `/api/customers/{id}/suspend`                                     | Suspend a customer                    |
| `PATCH`  | `/api/customers/{id}/reinstate`                                   | Reinstate a suspended customer        |
| `GET`    | `/api/customers/{customerId}/addresses`                           | List all addresses for a customer     |
| `POST`   | `/api/customers/{customerId}/addresses`                           | Add an address to a customer          |
| `GET`    | `/api/customers/{customerId}/addresses/{addressId}`               | Get a specific address                |
| `PUT`    | `/api/customers/{customerId}/addresses/{addressId}`               | Update a customer address             |
| `DELETE` | `/api/customers/{customerId}/addresses/{addressId}`               | Soft-delete a customer address        |
| `PATCH`  | `/api/customers/{customerId}/addresses/{addressId}/set-default`   | Set an address as the default         |

All endpoints require authentication (`access-token`).

---

#### `GET /api/customers`

**Query parameters:**

| Param             | Type    | Description |
|-------------------|---------|-------------|
| `includeSuspended` | boolean | Include suspended customers |
| `page`            | number  | Page number (1-based, default 1) |
| `limit`           | number  | Records per page (default 25, max 100) |

---

#### `POST /api/customers`

**Request body examples:**
```json
// Minimal
{ "companyName": "Acme Hearing Ltd" }

// Full
{
  "accountNumber": "ACC-001",
  "centreNumber": "C001",
  "companyName": "Acme Hearing Ltd",
  "invBuildingName": "Acme House",
  "invAddressLn1": "12 High Street",
  "invAddressLn2": "Deansgate",
  "invTownOrCity": "Manchester",
  "invCounty": "Greater Manchester",
  "invPostCode": "M1 1AA",
  "contactName": "Jane Doe",
  "contactEmail": "jane.doe@acme.com",
  "reportEmail": "reports@acme.com",
  "contactPhone": "0161 000 0000",
  "contactMobile": "07700 900000",
  "contactFax": "0161 000 0001",
  "band": "NHS1"
}
```

---

#### `PUT /api/customers/{id}`

**Request body examples:**
```json
// Update contact details
{ "contactName": "John Smith", "contactEmail": "john.smith@acme.com", "contactPhone": "0161 111 2222" }

// Update invoice address
{ "invAddressLn1": "99 New Street", "invTownOrCity": "Birmingham", "invPostCode": "B1 1BB" }

// Change price band
{ "band": "NHS2" }
```

---

#### `POST /api/customers/{customerId}/addresses`

**Request body examples:**
```json
// Minimal delivery address
{
  "delAddressLn1": "5 Warehouse Road",
  "delTownOrCity": "Leeds",
  "delPostCode": "LS1 1AA",
  "defaultAddress": false
}

// Full site address
{
  "siteCompanyName": "Acme North Site",
  "delBuildingName": "Block B",
  "delAddressLn1": "5 Warehouse Road",
  "delAddressLn2": "Holbeck",
  "delTownOrCity": "Leeds",
  "delCounty": "West Yorkshire",
  "delPostCode": "LS1 1AA",
  "siteContactName": "Bob Jones",
  "siteContactEmail": "bob.jones@acme.com",
  "siteContactPhone": "0113 000 0000",
  "siteContactMobile": "07700 900001",
  "defaultAddress": true
}
```

---

#### `PUT /api/customers/{customerId}/addresses/{addressId}`

**Request body examples:**
```json
// Correct postcode
{ "delPostCode": "LS2 2BB" }

// Update site contact
{ "siteContactName": "Alice Brown", "siteContactEmail": "alice.brown@acme.com", "siteContactPhone": "0113 111 2222" }
```

---

### orders — Orders & Ordered Items

| Method   | Path                                                                         | Summary                               |
|----------|------------------------------------------------------------------------------|---------------------------------------|
| `GET`    | `/api/orders`                                                                | List all orders                       |
| `POST`   | `/api/orders`                                                                | Create a new order                    |
| `GET`    | `/api/orders/{orderNumber}/{orderBatch}`                                     | Get a single order                    |
| `PUT`    | `/api/orders/{orderNumber}/{orderBatch}`                                     | Update an order                       |
| `DELETE` | `/api/orders/{orderNumber}/{orderBatch}`                                     | Void an order (soft-delete)           |
| `GET`    | `/api/orders/{orderNumber}/{orderBatch}/tracking`                            | Get order tracking                    |
| `PATCH`  | `/api/orders/{orderNumber}/{orderBatch}/dispatch`                            | Mark an order as dispatched           |
| `GET`    | `/api/orders/{orderNumber}/{orderBatch}/breakdown`                           | Download PDF order breakdown          |
| `GET`    | `/api/orders/items/{serialNumber}`                                           | Get an ordered item by serial number  |
| `GET`    | `/api/orders/{orderNumber}/{orderBatch}/items`                               | List all items on an order            |
| `POST`   | `/api/orders/{orderNumber}/{orderBatch}/items`                               | Add an item to an order               |
| `GET`    | `/api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`                | Get a specific item on a specific order |
| `PUT`    | `/api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`                | Update an ordered item                |
| `DELETE` | `/api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`                | Void an ordered item (soft-delete)    |
| `PATCH`  | `/api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}/checkout`       | Mark an ordered item as checked out   |
| `PATCH`  | `/api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}/unchecked-out`  | Reverse a checkout on an ordered item |

Customer-role users automatically see only orders belonging to their linked customer account.

---

#### `GET /api/orders`

Staff roles can filter by `customerId`. Customer role users automatically see only their own orders.

**Query parameters:**

| Param           | Type    | Description |
|-----------------|---------|-------------|
| `includeVoided` | boolean | Include voided orders |
| `customerId`    | number  | Filter by customer ID (staff only) |
| `status`        | string  | Filter by status: `Received`, `InProduction`, `Ready`, `Dispatched`, `Voided` |
| `page`          | number  | Page number (1-based, default 1) |
| `limit`         | number  | Records per page (default 25, max 100) |

---

#### `POST /api/orders`

**Request body examples:**
```json
// Minimal
{ "orderNumber": 10001, "customerAccount": 42 }

// Full
{
  "orderNumber": 10001,
  "orderBatch": 1,
  "customerAccount": 42,
  "customerRef": "PO-2024-001",
  "orderContact": "Jane Doe",
  "deliveryAddress": 7,
  "receivedOn": "2024-06-01T09:00:00.000Z",
  "priceBand": "NHS1"
}
```

---

#### `GET /api/orders/{orderNumber}/{orderBatch}/tracking`

Returns the status history and item-level progress for an order. Customer role users can only view their own orders.

---

#### `PUT /api/orders/{orderNumber}/{orderBatch}`

**Request body examples:**
```json
// Update contact and reference
{ "customerRef": "PO-2024-002", "orderContact": "John Smith" }

// Change delivery address
{ "deliveryAddress": 12 }

// Change price band
{ "priceBand": "NHS2" }
```

---

#### `GET /api/orders/{orderNumber}/{orderBatch}/breakdown`

Returns a PDF file download of the order breakdown.

---

#### `GET /api/orders/items/{serialNumber}`

Looks up a single item by its serial number without needing to know the order number. Customer role users can only view items belonging to their linked customer account.

---

#### `GET /api/orders/{orderNumber}/{orderBatch}/items`

**Query parameters:**

| Param   | Type   | Description |
|---------|--------|-------------|
| `page`  | number | Page number (1-based, default 1) |
| `limit` | number | Records per page (default 25, max 100) |

---

#### `POST /api/orders/{orderNumber}/{orderBatch}/items`

The `orderNumber` and `orderBatch` are taken from the URL path. Any `parentOrder` / `parentBatch` values in the body are ignored.

**Request body examples:**
```json
// Minimal
{ "serialNumber": "SN000001" }

// Full hearing aid item
{
  "serialNumber": "SN000001",
  "patientInitial": "J",
  "patientSurname": "Smith",
  "modelCode": "HA-PRO-3",
  "week": 24,
  "customerRef": "PO-2024-001",
  "side": "R",
  "description": "Pro Hearing Aid Right",
  "category": "Hearing Aid",
  "price": 149.99,
  "vent": 1.5,
  "colour": "Beige",
  "tubing": "Standard",
  "options": "Wax guard"
}
```

---

#### `PUT /api/orders/{orderNumber}/{orderBatch}/items/{serialNumber}`

**Request body examples:**
```json
// Update patient details
{ "patientInitial": "A", "patientSurname": "Jones" }

// Change model and price
{ "modelCode": "HA-PRO-5", "description": "Pro Hearing Aid Right v5", "price": 179.99 }

// Correct side
{ "side": "L" }
```

---

### price-list — Product Price List

| Method   | Path                                        | Summary                                                  |
|----------|---------------------------------------------|----------------------------------------------------------|
| `GET`    | `/api/price-list`                           | List all price list items (defaults to active revision)  |
| `GET`    | `/api/price-list/{itemId}`                  | Get a price list item by ID                              |
| `GET`    | `/api/price-list/{itemId}/lists`            | Get all prices for an item across all lists              |
| `GET`    | `/api/price-list/{itemId}/lists/{listName}` | Get the price for an item in a specific list             |
| `DELETE` | `/api/price-list/items/{itemId}`            | Void (soft-delete) a price list item                     |
| `GET`    | `/api/price-list/lists`                     | Get all active price list types                          |
| `DELETE` | `/api/price-list/lists/{id}`                | Void (soft-delete) a price list type                     |
| `GET`    | `/api/price-list/revisions`                 | List all price list revisions                            |
| `GET`    | `/api/price-list/revisions/{id}`            | Get a specific revision                                  |
| `POST`   | `/api/price-list/revisions/{id}/activate`   | Activate a revision (promote draft or rollback archived) |
| `GET`    | `/api/price-list/export`                    | Export price list as CSV                                 |
| `POST`   | `/api/price-list/import`                    | Import price list from CSV (creates a draft revision)    |

---

#### `GET /api/price-list`

**Query parameters:**

| Param        | Type   | Description |
|--------------|--------|-------------|
| `category`   | string | Filter by category |
| `revisionId` | number | Target a specific revision (defaults to active) |

---

#### `GET /api/price-list/{itemId}`

**Query parameters:**

| Param        | Type   | Description |
|--------------|--------|-------------|
| `revisionId` | number | Target a specific revision |

---

#### `GET /api/price-list/export`

Returns a CSV file download.

**Query parameters:**

| Param        | Type   | Description |
|--------------|--------|-------------|
| `revisionId` | number | Target a specific revision (defaults to active) |

---

#### `POST /api/price-list/import`

Creates a draft revision from an uploaded CSV. Uses `multipart/form-data`.

**Query parameters:**

| Param        | Type    | Description |
|--------------|---------|-------------|
| `name`       | string  | Revision name |
| `notes`      | string  | Revision notes |
| `dryRun`     | boolean | Validate and summarise without writing |
| `merge`      | boolean | Merge CSV into the active revision rather than replacing |

**Request body:** `multipart/form-data` with a `file` field (binary CSV).

**Response 200:** Import summary. `revision` is `null` when `dryRun=true`.

---

### settings — Global & User Settings

| Method   | Path                           | Summary                                  |
|----------|--------------------------------|------------------------------------------|
| `GET`    | `/api/settings`                | List all settings                        |
| `GET`    | `/api/settings/{key}`          | Get a setting by key                     |
| `PUT`    | `/api/settings/{key}`          | Update a setting                         |
| `GET`    | `/api/settings/{key}/value`    | Get the raw value of a setting           |
| `PATCH`  | `/api/settings/{key}/value`    | Set the value of a setting               |
| `GET`    | `/api/settings/user`           | Get all settings for the current user    |
| `GET`    | `/api/settings/user/{key}`     | Get a specific setting for the current user |
| `PUT`    | `/api/settings/user/{key}`     | Set a setting for the current user       |
| `DELETE` | `/api/settings/user/{key}`     | Delete a setting for the current user    |

---

#### `GET /api/settings`

**Query parameters:**

| Param           | Type    | Description |
|-----------------|---------|-------------|
| `includeHidden` | boolean | Include hidden settings |
| `page`          | number  | Page number (1-based, default 1) |
| `limit`         | number  | Records per page (default 25, max 100) |

---

#### `PUT /api/settings/{key}`

**Request body examples:**
```json
// Update value only
{ "val": "noreply@sloms.com" }

// Full update
{ "val": "noreply@sloms.com", "description": "Default sender address for outgoing emails", "exposed": true }

// Hide from frontend
{ "exposed": false }
```

---

#### `PATCH /api/settings/{key}/value`

**Request body examples:**
```json
// Email value
{ "val": "noreply@sloms.com" }

// Numeric string
{ "val": "30" }

// Boolean flag
{ "val": "true" }
```

---

### vat-rates — VAT Rate History

| Method  | Path                        | Summary                                     |
|---------|-----------------------------|---------------------------------------------|
| `GET`   | `/api/vat-rates`            | List all VAT rates (most recent first)      |
| `POST`  | `/api/vat-rates`            | Create a new VAT rate                       |
| `GET`   | `/api/vat-rates/current`    | Get the currently active VAT rate           |
| `PATCH` | `/api/vat-rates/{id}/close` | Close a VAT rate by setting its end date    |

---

#### `POST /api/vat-rates`

**Request body example:**
```json
{
  "rate": 20,
  "label": "Standard UK",
  "validFrom": "2011-01-04"
}
```

---

#### `PATCH /api/vat-rates/{id}/close`

**Request body:**
```json
{ "validTo": "2025-12-31" }
```

---

## Error Handling

Standard HTTP status codes apply across all endpoints:

| Status | Meaning |
|--------|---------|
| `200`  | OK — request succeeded |
| `201`  | Created — resource successfully created |
| `204`  | No Content — resource deleted |
| `400`  | Bad Request — validation error |
| `401`  | Unauthorized — missing or invalid token |
| `403`  | Forbidden — insufficient role permissions |
| `404`  | Not Found — resource does not exist |
| `409`  | Conflict — duplicate or constraint violation |
| `500`  | Internal Server Error |

---

## Pagination

Paged endpoints return a consistent envelope:

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 25
}
```

Default `page` = 1, default `limit` = 25, maximum `limit` = 100.
