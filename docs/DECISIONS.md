# Architecture Decision Records (ADRs)

> Documented decisions made during the design and development of Inventory Manager. Each ADR follows the standard format: Context, Decision, Consequences, and Alternatives Considered.

---

## ADR-001: Multi-Tenant via organizationId Column on Every Entity

**Status:** Accepted
**Date:** 2025-01-01

### Context

The system must support multiple organizations (tenants) with complete data isolation. Each organization's data must be invisible to other organizations. We needed a tenant isolation strategy that is simple, testable, and works with both SQLite (dev) and PostgreSQL (prod).

Options considered: shared database with row-level filtering, shared database with schema-per-tenant, and database-per-tenant.

### Decision

Use a **shared database, shared schema** approach where every data entity (User, Product, Warehouse, StockItem, Supplier, PurchaseOrder, PurchaseOrderItem, InventoryTransaction) has an `organizationId` column. All queries are scoped by this column using a `where: { organizationId }` clause in every repository method.

The JWT token embeds `organizationId`, extracted from the token by `JwtStrategy.validate()` and available on `req.user.organizationId` in every guarded controller.

### Consequences

**Positive:**
- Simple to implement and reason about — no dynamic schema switching
- SQLite-compatible (schemas-per-tenant would not work with SQLite)
- Easy to test — just create a second organization in tests
- Single connection pool for all tenants (resource efficient)
- Works with TypeORM's built-in query mechanisms

**Negative:**
- Every query must explicitly filter by `organizationId` — developer discipline required
- Risk of data leak if a query forgets the filter (mitigated by service-layer patterns and code review)
- Indexes on `organizationId` are needed on every table (slightly increased write overhead)

### Alternatives Considered

- **Database-per-tenant:** Strongest isolation but impossible with SQLite (single file). Adds operational complexity for connection management.
- **Schema-per-tenant:** Creates separate PostgreSQL schemas. Not compatible with SQLite. Adds complexity to migrations and connection setup.
- **Row-Level Security (PostgreSQL):** Elegant but PostgreSQL-only. Would not work in dev with SQLite.

---

## ADR-002: StockItem as Separate Entity (Not Quantity on Product)

**Status:** Accepted
**Date:** 2025-01-01

### Context

The UX design specs call for multi-warehouse inventory management. A single product can be stored in multiple warehouses with different quantities per location. The simplest approach — storing `quantity` on the `Product` entity — fails to model this requirement.

### Decision

Create a dedicated **StockItem** entity with `productId`, `warehouseId`, and `quantity`. This forms a many-to-many relationship between Product and Warehouse through StockItem, with the composite unique constraint `(organizationId, productId, warehouseId)` ensuring one stock record per product per warehouse.

StockItem also carries `minStock` and `maxStock` fields, enabling per-warehouse stock thresholds (a product might need different thresholds in different locations).

### Consequences

**Positive:**
- True multi-warehouse support from day one
- Per-warehouse reorder levels and max stock limits
- Clean separation: product catalog data vs. inventory state
- Enables the InventoryTransaction audit trail to reference exact product/warehouse combinations

**Negative:**
- More complex queries for "total stock across all warehouses" (requires aggregation)
- Additional join when displaying product list with stock info
- More entities to manage

### Alternatives Considered

- **Quantity on Product with warehouse breakdown in JSON column:** Not relational, no FK integrity, hard to query.
- **Stock as separate table without composite unique:** Would allow duplicate records for same product/warehouse, leading to data inconsistency.
- **Computed/aggregated stock:** Would require expensive queries for simple stock lookups.

---

## ADR-003: Purchase Order Auto-Increments Stock on "received" Status

**Status:** Accepted
**Date:** 2025-01-01

### Context

When a purchase order is marked as "received", the stock of each ordered product must increase accordingly. We needed a reliable, auditable mechanism that updates StockItem records and logs the change.

### Decision

When `PATCH /api/orders/:id/status` is called with `{ "status": "received" }`, the `OrdersService.updateStatus()` method intercepts the transition and calls `processReceivedOrder()`. This method:

1. Loads all `PurchaseOrderItem` records for the order
2. For each item, finds (or creates) the corresponding `StockItem`
3. Increments `StockItem.quantity` by the ordered quantity
4. Creates an `InventoryTransaction` record with `type: 'in'`, `reference: "Order #PO-XXXXX"`

The status transition is **atomic** within the service method. If stock update fails, the status is not changed.

### Consequences

**Positive:**
- Automatic, consistent stock updates on receiving orders
- Complete audit trail in InventoryTransactions
- No manual stock adjustment needed after receiving

**Negative:**
- The current implementation defaults to `warehouseId = 1` for auto-stocking (simplification). A full implementation should let the user select the target warehouse during order receiving.
- A large order with many items means multiple DB writes in a single request

### Alternatives Considered

- **Manual two-step process:** Receive order first, then manually adjust stock. More flexible but error-prone and inconsistent.
- **Trigger-based approach:** Database-level triggers could auto-update stock — but TypeORM/sql.js does not support triggers well.
- **Queue-based processing:** Over-engineered for the current scale. Could be revisited if order volume grows.

---

## ADR-004: SQLite for Dev, PostgreSQL-Ready Schema

**Status:** Accepted
**Date:** 2025-01-01

### Context

The project needs a development environment that is zero-configuration and immediately runnable after `git clone`. At the same time, production should use PostgreSQL for reliability, concurrency, and performance. The data model must be compatible with both.

### Decision

Use **sql.js** (SQLite compiled to WebAssembly) for the TypeORM database driver in development mode. The schema uses only data types that map cleanly between SQLite and PostgreSQL: `int`, `varchar`, `text`, `real`, `boolean`, `datetime`.

TypeORM's `synchronize: true` is used in dev to auto-create tables. For production PostgreSQL, `synchronize` is set to `false` and migrations are used.

The default `DATABASE_URL` in `.env.example` points to `data/inventory.db`, which is gitignored.

### Consequences

**Positive:**
- Zero-config setup for developers — no PostgreSQL installation needed
- SQLite database file is portable and easy to reset (delete and restart)
- Schema is identical between SQLite and PostgreSQL
- Easy CI/CD — no database service needed in test pipelines

**Negative:**
- SQLite has no concurrency (single-writer) — not suitable for production multi-user scenarios
- Some PostgreSQL features can't be used in dev (partial indexes, array columns, etc.)
- Must test on PostgreSQL before production deployment
- `synchronize: true` can accidentally drop data during rapid iteration (mitigated by seed on startup)

### Alternatives Considered

- **PostgreSQL in Docker:** Adds Docker as a prerequisite. Slower first-time setup.
- **In-memory SQLite:** Would lose data on restart. Not workable for development.
- **MySQL:** Another good option, but PostgreSQL is preferred for the target production environment.

---

## ADR-005: JWT Auth with Passport.js

**Status:** Accepted
**Date:** 2025-01-01

### Context

The system requires stateless authentication that can carry tenant context (organizationId) and user identity. It must work with Angular and be standard across NestJS applications.

### Decision

Use **Passport.js with JWT strategy** (`@nestjs/passport` + `passport-jwt`). The JWT payload includes:

```typescript
{
  sub: user.id,
  email: user.email,
  organizationId: user.organizationId
}
```

The `JwtStrategy` validates the token and returns a user object with `userId`, `email`, and `organizationId`. The `JwtAuthGuard` extends `AuthGuard('jwt')` to protect all non-public endpoints.

On the frontend, the token is stored in `localStorage`, attached to every request via the `ApiService` header builder, and managed by `AuthService` using Angular signals.

### Consequences

**Positive:**
- Stateless — no server-side session storage needed
- Token carries organization context — no extra DB lookup on every request
- Standard approach with excellent NestJS/Passport integration
- Easy to test with pre-generated tokens

**Negative:**
- Token revocation is not possible without a blocklist (not implemented — tokens expire in 7 days)
- Token size increases with payload (currently very small — just 3 fields)
- If JWT_SECRET leaks, all tokens can be forged (mitigated by using strong secrets and env vars)

### Alternatives Considered

- **Session-based auth (express-session):** Stateful, not ideal for API. Requires session store.
- **OAuth2 / OpenID Connect:** Overkill for an internal tool. Could be added later as an option.
- **API keys:** Simpler but no user context. Every request would need to look up the user.

---

## ADR-006: Wizard Pattern for Purchase Order Creation

**Status:** Accepted
**Date:** 2025-01-01

### Context

Creating a purchase order involves multiple steps: selecting a supplier, choosing products/quantities, and confirming details. The UX design specs call for a wizard/stepper pattern rather than a single long form.

### Decision

Implement a **3-step wizard** in the `OrderCreatePage` Angular component:

1. **Step 1 — Select Supplier:** Radio-button list of suppliers
2. **Step 2 — Add Items:** Product selector with quantity input; multi-item support
3. **Step 3 — Order Details:** Expected date, notes, summary

Each step validates before proceeding. The final step calls `POST /api/orders`. The UI uses Angular signals (`currentStep`, `selectedSupplierId`, `orderItems`, etc.) for state management.

The stepper visually shows step progress with numbered circles, completed checkmarks, and connecting lines. The backend receives all data in a single `POST /api/orders` request — the wizard is purely a frontend UX pattern.

### Consequences

**Positive:**
- Clean, focused UX — user isn't overwhelmed by one massive form
- Validation at each step prevents incomplete submissions
- Reusable pattern for other multi-step flows (could be extracted to a shared StepperComponent)

**Negative:**
- More complex frontend code (3 views in one component)
- No back/forward persistence if browser is refreshed (state is in-memory signals)
- The stepper cannot accommodate an arbitrary number of steps without refactoring

### Alternatives Considered

- **Single long form:** Simple but poor UX for complex data entry.
- **Multi-page (separate routes):** More complex, harder to manage shared state. Would require route guards or a store.
- **Dialog/Modal per step:** Less screen real estate; harder to show progress.

---

## ADR-007: InventoryTransaction for Audit Trail

**Status:** Accepted
**Date:** 2025-01-01

### Context

All stock movements must be logged for audit purposes. We need to know who changed what, when, and what the resulting balance was. This is a must-have for inventory management systems.

### Decision

Create an **InventoryTransaction** entity that records every stock mutation. A transaction is created every time:

- `POST /api/stock/adjust` is called (all types: `in`, `out`, `adjust`)
- `PATCH /api/orders/:id/status` transitions to `received` (one transaction per order item)

Each transaction stores: `productId`, `warehouseId`, `type`, `quantity` (delta), `balance` (resulting), `reference` (source identifier), and `notes` (human-readable context).

Transactions are **immutable** — there is no update or delete endpoint. They serve as a permanent audit log.

### Consequences

**Positive:**
- Complete, immutable history of every stock change
- Supports compliance and audit requirements
- Enables "transaction history" feature on the frontend with date-range filtering
- Balance field enables point-in-time stock reconstruction (last transaction before date X shows balance at that time)

**Negative:**
- Duplicates data already present in StockItem (balance is redundant with current StockItem.quantity; mitigated by its audit value)
- Storage grows over time (acceptable — text data is cheap; can be archived for old records)
- No cascading delete (historical transactions remain even if product/warehouse is deleted — intentional, for audit purposes)

### Alternatives Considered

- **No transaction log:** Lose all audit capability. Not acceptable.
- **Database triggers with audit tables:** More automatic but less control. Not well supported by TypeORM/sql.js.
- **Event sourcing:** Full event store would allow complete state reconstruction. Over-engineered for current needs; could be investigated for v2.

---

## ADR-008: TypeORM Synchronize for Dev Migrations

**Status:** Accepted
**Date:** 2025-01-01

### Context

Development velocity is critical in the early stages. Every schema change needs to be reflected in the database immediately without manual migration scripts. At the same time, production needs controlled, versioned migrations.

### Decision

Use `synchronize: true` in the TypeORM configuration for the development environment (SQLite). This tells TypeORM to automatically create tables, add columns, and create indexes based on the entity decorators at application startup.

For production (PostgreSQL), `synchronize: false` is used, and migrations are generated and run via the TypeORM CLI.

The seed service (`SeedService.onModuleInit()`) checks if data already exists before seeding, making it safe to restart the development server repeatedly.

### Consequences

**Positive:**
- Zero-config schema management — entities are the single source of truth
- No migration files to manage during rapid prototyping
- Schema always matches the code — no drift
- Fast iteration cycle: change entity → restart → ready

**Negative:**
- Can drop data if a column is renamed (TypeORM may drop and recreate it)
- No version history of schema changes
- Cannot roll back to a previous schema version without reverting code
- Not safe for production — any restart could potentially alter the schema

### Alternatives Considered

- **Migrations from day one:** More disciplined but slower iteration. Good practice but impedes rapid prototyping.
- **Manual DDL scripts:** Error-prone and out of sync with entities.
- **Schema comparison tools (e.g., `typeorm schema:sync` on demand):** Better control but still not safe for production with data.

---

## Decision Log Summary

| ADR | Title | Status |
|---|---|---|
| 001 | Multi-tenant via organizationId column on every entity | ✅ Accepted |
| 002 | StockItem as separate entity for multi-warehouse support | ✅ Accepted |
| 003 | Purchase order auto-increments stock on "received" status | ✅ Accepted |
| 004 | SQLite for dev, PostgreSQL-ready schema | ✅ Accepted |
| 005 | JWT auth with Passport.js | ✅ Accepted |
| 006 | Wizard pattern for purchase order creation | ✅ Accepted |
| 007 | InventoryTransaction for audit trail | ✅ Accepted |
| 008 | TypeORM synchronize for dev migrations | ✅ Accepted |
