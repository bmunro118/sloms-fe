# SLOMS Backend — Additional Requirements

_Last updated: 2026-05-26_

This document captures backend work required to support the full frontend feature set of the Sonic App. Items here represent confirmed gaps between what the frontend expects and what the current SLOMS backend provides.

---

## 1. Documents Module — `GET /api/documents`

### Status
❌ **Not implemented** — no `documents` module exists in `sloms/backend/src/`.

### Problem
The frontend Documents screen (`/(app)/documents/index.tsx`) calls `GET /api/documents` and receives a `404 — The requested resource was not found.` response at runtime. The endpoint is registered in the frontend config (`ENDPOINTS.documents.list`) and is fully wired in `src/features/documents/api.ts`, but the backend has no corresponding controller or service.

### Required Implementation
A new NestJS module: `sloms/backend/src/documents/`

#### Database / Entity
A `Document` entity (or a view derived from existing order data) with at minimum:

| Field            | Type     | Description                                         |
|------------------|----------|-----------------------------------------------------|
| `id`             | number   | Primary key                                         |
| `type`           | string   | Document type, e.g. `"Invoice"`, `"Delivery Note"`  |
| `generatedDate`  | datetime | When the document was generated                     |
| `orderReference` | string   | Human-readable order ref, e.g. `"12345/1"`          |

> If documents are derived from orders (e.g. an invoice is generated when an order is dispatched), this table may be a join/view rather than a standalone store. The relationship to the `Order` entity should be clarified during implementation.

#### Endpoint

```
GET /api/documents
```

**Auth:** Required (all authenticated roles)

**Query parameters:**

| Param    | Type   | Required | Description                                              |
|----------|--------|----------|----------------------------------------------------------|
| `search` | string | No       | Filter by document type, order reference, or document ID |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "Invoice",
      "generatedDate": "2024-06-01T00:00:00Z",
      "orderReference": "12345/1"
    }
  ]
}
```

#### Module files to create
- `documents/entities/document.entity.ts`
- `documents/dto/list-documents-query.dto.ts`
- `documents/documents.service.ts`
- `documents/documents.controller.ts`
- `documents/documents.module.ts`
- Register module in `app.module.ts`

---

## 2. Extended Documents API (Future)

The current API surface doc notes the documents endpoint as "partially documented". Once the list endpoint is live, the following additional endpoints should be scoped and confirmed:

| Method   | Path                          | Summary                              |
|----------|-------------------------------|--------------------------------------|
| `GET`    | `/api/documents/{id}`         | Get single document detail           |
| `GET`    | `/api/documents/{id}/download`| Download document as PDF/file        |
| `POST`   | `/api/documents`              | Manually generate a document (admin) |

These are not currently called by the frontend and are not blocking, but should be agreed before the documents feature is considered complete.

---

## 2. Price List — Revisions, Lists, Export, Import

### Status
❌ **Not implemented** — the backend `price-list` controller only exposes three routes (`GET /`, `GET /:itemId`, `GET /:itemId/bands`). All revision, list-type, export, and import routes are missing.

### Problem
The frontend Price List screen has three tabs — **Items**, **Revisions**, and **List Types**. When the Revisions or List Types tabs are selected, the frontend calls endpoints that don't exist on the backend. The `:itemId` wildcard in `GET /price-list/:itemId` catches requests like `GET /price-list/revisions` and `GET /price-list/lists`, finds no matching item, and returns `404 — The requested resource was not found.`

### Required Endpoints

| Method   | Path                                        | Summary                                                  | Auth         |
|----------|---------------------------------------------|----------------------------------------------------------|--------------|
| `GET`    | `/api/price-list/revisions`                 | List all price list revisions                            | All roles    |
| `GET`    | `/api/price-list/revisions/{id}`            | Get a specific revision with its items                   | All roles    |
| `POST`   | `/api/price-list/revisions/{id}/activate`   | Activate a revision (promote draft / rollback archived)  | Admin only   |
| `GET`    | `/api/price-list/lists`                     | List all active price list types                         | All roles    |
| `DELETE` | `/api/price-list/lists/{id}`                | Void (soft-delete) a price list type                     | Admin only   |
| `GET`    | `/api/price-list/{itemId}/lists`            | Get all prices for an item across all list types         | All roles    |
| `GET`    | `/api/price-list/{itemId}/lists/{listName}` | Get the price for an item in a specific list             | All roles    |
| `DELETE` | `/api/price-list/items/{itemId}`            | Void (soft-delete) a price list item                     | Admin only   |
| `GET`    | `/api/price-list/export`                    | Export price list as CSV download                        | All roles    |
| `POST`   | `/api/price-list/import`                    | Import price list from CSV (creates a draft revision)    | Admin only   |

> ⚠️ **Route ordering** — NestJS resolves routes top-to-bottom. `GET /price-list/revisions`, `GET /price-list/lists`, `GET /price-list/export`, and `DELETE /price-list/items/:itemId` **must be registered before** the `GET /price-list/:itemId` wildcard, otherwise they will be swallowed by it.

### Entity / Schema Notes

A `Revision` entity is implied by the API surface but does not currently exist in the backend. Minimum fields:

| Field         | Type     | Description                                        |
|---------------|----------|----------------------------------------------------|
| `id`          | number   | Primary key                                        |
| `name`        | string   | Revision name                                      |
| `notes`       | string   | Optional notes                                     |
| `status`      | enum     | `draft` \| `active` \| `archived`                 |
| `createdAt`   | datetime | Creation timestamp                                 |
| `activatedAt` | datetime | When the revision was made active (nullable)       |

Price list items should carry a `revisionId` foreign key. The existing `GET /price-list` and `GET /price-list/:itemId` routes need a `revisionId` query param to target a specific revision (default: active).

### Import endpoint detail

`POST /api/price-list/import` — `multipart/form-data`

| Param    | Type    | Description                                              |
|----------|---------|----------------------------------------------------------|
| `file`   | binary  | CSV file                                                 |
| `name`   | string  | Revision name                                            |
| `notes`  | string  | Optional notes                                           |
| `dryRun` | boolean | Validate and summarise without writing to DB             |
| `merge`  | boolean | Merge into active revision rather than creating new one  |

**Response 200:** Import summary. `revision` is `null` when `dryRun=true`.

---

---

## 3. Auto-assign Order Number on Create

### Status
❌ **Not implemented** — `orderNumber` is a required field in `CreateOrderDto` with no auto-generation logic.

### Problem
The frontend Create Order screen requires staff to manually enter an order number. This is error-prone (duplicates, gaps) and shouldn't be a client responsibility. The server is in the best position to assign the next available order number atomically.

**Confirmed by inspecting the backend source:**
- `CreateOrderDto` has `orderNumber` as required (`@IsInt() @Min(0)`, no `@IsOptional()`)
- `orders.service.ts` `create()` uses `dto.orderNumber` directly with no fallback
- No `next-number` or equivalent endpoint exists

### Required Change

#### 1. `create-order.dto.ts` — make `orderNumber` optional

```ts
@IsOptional()
@IsInt()
@Min(0)
orderNumber?: number;
```

#### 2. `orders.service.ts` — auto-assign if omitted

In `create()`, before saving, if `dto.orderNumber` is absent query the max and increment:

```ts
if (dto.orderNumber == null) {
  const result = await this.orderRepo
    .createQueryBuilder('o')
    .select('MAX(o.orderNumber)', 'max')
    .getRawOne<{ max: number | null }>();
  dto.orderNumber = (result?.max ?? 0) + 1;
}
```

This must be done within a transaction (or using a DB sequence) to prevent a race condition if two orders are created simultaneously.

#### 3. API surface doc update
`POST /api/orders` minimal body becomes:
```json
{ "customerAccount": 42 }
```
`orderNumber` remains accepted when supplied (e.g. for imports or externally-issued numbers) — existing callers are unaffected.

### Frontend impact
Once this backend change is deployed, remove the `orderNumber` text input from the Create Order screen (`frontend/app/(app)/orders/create.tsx`) entirely — the server will assign it and return it in the `201` response.

---

## 4. Notes on Scope

The following modules **are** confirmed to exist in the current backend and are not blocking:

| Module      | Backend path                        |
|-------------|-------------------------------------|
| Auth        | `src/auth/`                         |
| Orders      | `src/orders/`                       |
| Customers   | `src/customers/`                    |
| Users       | `src/users/`                        |
| Price List  | `src/price-list/`                   |
| Settings    | `src/settings/` (via `src/options/`)|
| Terms       | `src/terms/`                        |

VAT Rates is consumed by the frontend — confirm it exists in the backend if not already verified.
