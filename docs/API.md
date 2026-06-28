# API Reference — Inventory Manager

> 22 endpoints across 8 modules. All protected endpoints require `Authorization: Bearer <token>`. The API is documented interactively via Swagger at `/api/docs`.

**Base URL:** `http://localhost:3000/api`

---

## Authentication

### POST `/api/auth/register`

Register a new organization and admin user. Creates both the `Organization` record and the `User` record in a single request.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass123",
  "organizationName": "Jane's Corp"
}
```

**Response `201 Created`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `409 Conflict` — Email already registered

**Notes:**
- Password is bcrypt-hashed with 10 salt rounds
- Organization name defaults to `email` prefix if not provided (in frontend)
- The JWT contains `sub` (userId), `email`, and `organizationId`

---

### POST `/api/auth/login`

Authenticate with email and password. Returns a JWT access token.

**Request Body:**

```json
{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

**Response `200 OK`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:**
- `401 Unauthorized` — Invalid credentials (wrong email or password)

---

### GET `/api/auth/me`

Get the current user's profile. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**

```json
{
  "id": 1,
  "email": "admin@demo.com",
  "name": "Admin User",
  "organizationId": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

## Products

All product endpoints require `Authorization: Bearer <token>`. All queries are scoped to the authenticated user's organization.

### POST `/api/products`

Create a new product.

**Request Body:**

```json
{
  "sku": "WDG-003",
  "name": "Widget Gamma",
  "description": "A premium gamma widget",
  "category": "Electronics",
  "unitPrice": 39.99,
  "reorderLevel": 15,
  "isActive": true
}
```

**Response `201 Created`:**

```json
{
  "id": 11,
  "organizationId": 1,
  "sku": "WDG-003",
  "name": "Widget Gamma",
  "description": "A premium gamma widget",
  "category": "Electronics",
  "unitPrice": 39.99,
  "reorderLevel": 15,
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Errors:**
- `409 Conflict` — Duplicate SKU within the same organization

---

### GET `/api/products`

List products with optional search, category filter, and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Search by name (`LIKE %term%`) |
| `category` | `string` | — | Exact category match |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `10` | Items per page |

**Response `200 OK`:**

```json
{
  "items": [
    {
      "id": 1,
      "organizationId": 1,
      "sku": "WDG-001",
      "name": "Widget Alpha",
      "description": "Description for Widget Alpha",
      "category": "Electronics",
      "unitPrice": 29.99,
      "reorderLevel": 20,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

---

### GET `/api/products/:id`

Get a single product by ID. Returns `404` if not found or belongs to another organization.

**Response `200 OK`:**

```json
{
  "id": 1,
  "organizationId": 1,
  "sku": "WDG-001",
  "name": "Widget Alpha",
  "description": "Description for Widget Alpha",
  "category": "Electronics",
  "unitPrice": 29.99,
  "reorderLevel": 20,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Errors:**
- `404 Not Found` — Product not found

---

### PATCH `/api/products/:id`

Update selected fields of a product. All fields are optional.

**Request Body:**

```json
{
  "unitPrice": 34.99,
  "reorderLevel": 25
}
```

**Response `200 OK`:** Returns the updated product object.

---

### DELETE `/api/products/:id`

Soft-delete not implemented — hard deletes the product. Will fail if products have associated stock items (FK constraint in production).

**Response `200 OK`:**

```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `404 Not Found` — Product not found
- `500` — Foreign key violation (has stock/order references)

---

## Warehouses

### POST `/api/warehouses`

Create a warehouse.

**Request Body:**

```json
{
  "name": "North Distribution",
  "location": "100 Industrial Pkwy",
  "capacity": 8000,
  "isActive": true
}
```

**Response `201 Created`:** Returns the created warehouse object.

---

### GET `/api/warehouses`

List all warehouses for the organization with capacity utilization.

**Response `200 OK`:**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Main Warehouse",
      "location": "123 Industrial Blvd, City",
      "capacity": 10000,
      "isActive": true,
      "utilizationPercent": 42.5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 3
}
```

---

### GET `/api/warehouses/:id`

Get a single warehouse with details.

**Errors:**
- `404 Not Found` — Warehouse not found

---

### PATCH `/api/warehouses/:id`

Update warehouse fields.

---

### DELETE `/api/warehouses/:id`

Hard delete warehouse.

---

## Stock

### GET `/api/stock`

Get stock levels, optionally filtered by product.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `productId` | `int` | Filter by product (optional) |

**Response `200 OK`:**

```json
[
  {
    "id": 1,
    "organizationId": 1,
    "productId": 1,
    "warehouseId": 1,
    "quantity": 100,
    "minStock": 20,
    "maxStock": 300,
    "product": { "id": 1, "name": "Widget Alpha", "sku": "WDG-001" },
    "warehouse": { "id": 1, "name": "Main Warehouse" }
  }
]
```

---

### POST `/api/stock/adjust`

Adjust stock level. Creates an `InventoryTransaction` audit record automatically.

**Request Body:**

```json
{
  "productId": 1,
  "warehouseId": 1,
  "type": "in",
  "quantity": 25,
  "reference": "Manual restock",
  "notes": "Restocked after weekly count"
}
```

**Transaction Types:**

| Type | Behavior |
|---|---|
| `in` | Adds quantity to existing stock |
| `out` | Subtracts quantity (fails if insufficient) |
| `adjust` | Sets exact quantity (overwrites) |

**Response `200 OK`:** Returns the updated `StockItem`.

**Errors:**
- `404 Not Found` — Product or warehouse not found in org
- `400 Bad Request` — Insufficient stock (for `out` type) or invalid type

---

### GET `/api/stock/alerts`

Returns all stock items where `quantity < minStock`, ordered by severity (largest deficit first).

**Response `200 OK`:**

```json
[
  {
    "id": 5,
    "productId": 5,
    "product": { "id": 5, "name": "Lubricant Oil 5L", "sku": "LUB-001" },
    "warehouse": { "id": 2, "name": "East Distribution" },
    "quantity": 3,
    "minStock": 10,
    "deficit": -7
  }
]
```

---

### GET `/api/stock/dashboard`

Aggregated KPIs for the dashboard view.

**Response `200 OK`:**

```json
{
  "totalProducts": 10,
  "totalStockItems": 450,
  "totalValue": 12500.50,
  "lowStockCount": 2,
  "totalWarehouses": 3
}
```

---

## Suppliers

### POST `/api/suppliers`

Create a supplier.

**Request Body:**

```json
{
  "name": "New Supplier Inc",
  "contactName": "Sam Wilson",
  "email": "sam@newsupplier.com",
  "phone": "+1-555-0199",
  "address": "456 Market St",
  "notes": "Preferred electronics vendor",
  "isActive": true
}
```

**Response `201 Created`:** Returns created supplier.

---

### GET `/api/suppliers`

List all suppliers for the organization.

---

### GET `/api/suppliers/:id`

Get supplier by ID.

**Errors:**
- `404 Not Found`

---

### PATCH `/api/suppliers/:id`

Update supplier fields.

---

### PATCH `/api/suppliers/:id/toggle-active`

Toggle supplier's active status without knowing current state.

**Response `200 OK`:**

```json
{
  "id": 1,
  "name": "Acme Supplies",
  "isActive": false,
  ...
}
```

---

### DELETE `/api/suppliers/:id`

Hard delete supplier.

---

## Orders

### POST `/api/orders`

Create a purchase order with multiple items. Auto-generates `orderNumber` in format `PO-00001` and calculates `totalAmount`.

**Request Body:**

```json
{
  "supplierId": 1,
  "expectedDate": "2025-02-15",
  "notes": "Monthly restock",
  "items": [
    { "productId": 1, "quantityOrdered": 50, "unitPrice": 29.99 },
    { "productId": 2, "quantityOrdered": 30, "unitPrice": 49.99 }
  ]
}
```

**Response `201 Created`:**

```json
{
  "id": 4,
  "organizationId": 1,
  "orderNumber": "PO-00004",
  "supplierId": 1,
  "status": "pending",
  "totalAmount": 2999.20,
  "expectedDate": "2025-02-15",
  "notes": "Monthly restock",
  "orderedAt": "2025-01-15T10:00:00.000Z",
  "receivedAt": null,
  "items": [
    {
      "id": 7,
      "productId": 1,
      "product": { "id": 1, "name": "Widget Alpha", "sku": "WDG-001" },
      "quantityOrdered": 50,
      "unitPrice": 29.99,
      "lineTotal": 1499.50
    },
    {
      "id": 8,
      "productId": 2,
      "product": { "id": 2, "name": "Widget Beta", "sku": "WDG-002" },
      "quantityOrdered": 30,
      "unitPrice": 49.99,
      "lineTotal": 1499.70
    }
  ],
  "supplier": { "id": 1, "name": "Acme Supplies" },
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-01-15T10:00:00.000Z"
}
```

**Errors:**
- `404 Not Found` — Supplier or product not found

---

### GET `/api/orders`

List orders with optional status filter and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter by status (`pending`, `sent`, `received`, `cancelled`) |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `10` | Items per page |

**Response `200 OK`:**

```json
{
  "items": [
    {
      "id": 1,
      "orderNumber": "PO-00001",
      "status": "received",
      "totalAmount": 2649.50,
      "supplier": { "id": 1, "name": "Acme Supplies" },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10
}
```

---

### GET `/api/orders/:id`

Get full order detail including all items with product info and supplier details.

**Errors:**
- `404 Not Found`

---

### PATCH `/api/orders/:id/status`

Transition order to the next status. Valid transitions:

| From | To |
|---|---|
| `pending` | `sent`, `cancelled` |
| `sent` | `received`, `cancelled` |
| `received` | *(terminal)* |
| `cancelled` | *(terminal)* |

**Request Body:**

```json
{
  "status": "sent"
}
```

**Side Effects:**
- Status `sent` → Sets `orderedAt` timestamp
- Status `received` → Sets `receivedAt` timestamp, **auto-increments stock** for all items (creates StockItem records and InventoryTransaction audit trail)

**Errors:**
- `400 Bad Request` — Invalid status transition

---

### PATCH `/api/orders/:id/cancel`

Shortcut to cancel an order (sets status to `cancelled`). Equivalent to `PATCH /api/orders/:id/status` with `{ "status": "cancelled" }`.

**Response `200 OK`:** Returns updated order.

---

## Transactions

### GET `/api/transactions`

List inventory transactions with filters. Immutable audit log.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `productId` | `int` | — | Filter by product |
| `type` | `string` | — | Filter by type (`in`, `out`, `adjust`) |
| `startDate` | `string` (ISO) | — | Start of date range |
| `endDate` | `string` (ISO) | — | End of date range |
| `page` | `int` | `1` | Page number |
| `limit` | `int` | `10` | Items per page |

**Response `200 OK`:**

```json
{
  "items": [
    {
      "id": 1,
      "organizationId": 1,
      "productId": 1,
      "warehouseId": 1,
      "type": "in",
      "quantity": 100,
      "balance": 100,
      "reference": "Initial stock",
      "notes": "Initial setup",
      "product": { "id": 1, "name": "Widget Alpha", "sku": "WDG-001" },
      "warehouse": { "id": 1, "name": "Main Warehouse" },
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 10
}
```

---

## Search

### GET `/api/search`

Global search across products (by name, SKU, category), suppliers (by name, contactName, email), and purchase orders (by orderNumber).

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | `string` | Yes | Search term |

**Response `200 OK`:**

```json
{
  "products": [
    { "id": 1, "name": "Widget Alpha", "sku": "WDG-001", "category": "Electronics" }
  ],
  "suppliers": [
    { "id": 1, "name": "Acme Supplies", "contactName": "John Smith", "email": "john@acme.com" }
  ],
  "orders": [
    { "id": 1, "orderNumber": "PO-00001", "status": "received", "supplier": { "id": 1, "name": "Acme Supplies" } }
  ]
}
```

Each result set is limited to 10 items. The empty string returns empty arrays.

---

## Error Format

All errors follow a consistent format:

```json
{
  "message": "Product not found",
  "error": "Not Found",
  "statusCode": 404
}
```

Validation errors (class-validator) return:

```json
{
  "message": [
    "sku must be a string",
    "unitPrice must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## Module Summary

| Module | Base Path | Endpoints | Auth |
|---|---|---|---|
| Auth | `/api/auth` | `POST register`, `POST login`, `GET me` | Public (register/login), JWT (me) |
| Products | `/api/products` | `POST`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | JWT |
| Warehouses | `/api/warehouses` | `POST`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | JWT |
| Stock | `/api/stock` | `GET /`, `POST /adjust`, `GET /alerts`, `GET /dashboard` | JWT |
| Suppliers | `/api/suppliers` | `POST`, `GET /`, `GET /:id`, `PATCH /:id`, `PATCH /:id/toggle-active`, `DELETE /:id` | JWT |
| Orders | `/api/orders` | `POST`, `GET /`, `GET /:id`, `PATCH /:id/status`, `PATCH /:id/cancel` | JWT |
| Transactions | `/api/transactions` | `GET /` | JWT |
| Search | `/api/search` | `GET /` | JWT |

**Total: 22 endpoints (26 including optional parameter variants)**
