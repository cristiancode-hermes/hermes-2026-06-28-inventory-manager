# Architecture Document

> System architecture overview of Inventory Manager — a multi-tenant SaaS inventory management system.

---

## 1. High-Level Architecture

Inventory Manager follows a **three-tier architecture** with a clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Angular 22 Application                      │ │
│  │                                                               │ │
│  │  ┌───────────┐  ┌────────────────┐  ┌──────────────────┐    │ │
│  │  │ Auth      │  │ Lazy Pages     │  │ Shared Components │    │ │
│  │  │ Service   │  │ (12 modules)   │  │ (6 components)    │    │ │
│  │  └─────┬─────┘  └───────┬────────┘  └────────┬─────────┘    │ │
│  │        │                │                     │              │ │
│  │  ┌─────▼────────────────▼─────────────────────▼──────────┐  │ │
│  │  │                HTTP Client Layer                       │  │ │
│  │  │  ApiService + Auth Interceptor (JWT Bearer Token)     │  │ │
│  │  └───────────────────────┬───────────────────────────────┘  │ │
│  └──────────────────────────┼──────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP/1.1 JSON
                              │ Authorization: Bearer <jwt>
┌─────────────────────────────┼────────────────────────────────────┐
│                     API TIER│                                    │
│                              │                                    │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                    NestJS Backend                             │ │
│  │                    localhost:3000/api                         │ │
│  │                                                               │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │ │
│  │  │ Auth    │ │ Products │ │ Warehouses│ │ Stock         │   │ │
│  │  │ Module  │ │ Module   │ │ Module   │ │ Module        │   │ │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘   │ │
│  │       │           │            │              │             │ │
│  │  ┌────▼───────────▼────────────▼──────────────▼──────────┐ │ │
│  │  │              JwtAuthGuard (global)                     │ │ │
│  │  │         organizationId scoping on all queries          │ │ │
│  │  └───────────┬──────────────────────────────────────────────┘ │ │
│  │              │                                                │ │
│  │  ┌───────────▼────────────────────────────────────────────┐ │ │
│  │  │              TypeORM Data Layer                         │ │ │
│  │  └───────────┬────────────────────────────────────────────┘ │ │
│  └──────────────┼────────────────────────────────────────────────┘ │
└─────────────────┼──────────────────────────────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────────────┐
│                    DATA TIER                                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SQLite (sql.js)                             │  │
│  │                File: data/inventory.db                         │  │
│  │                                                               │  │
│  │  9 tables: organizations, users, products, warehouses,        │  │
│  │  stock_items, suppliers, purchase_orders, purchase_order_     │  │
│  │  items, inventory_transactions                                 │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  PostgreSQL-ready schema — change TypeORM config to     │  │  │
│  │  │  type: 'postgres' for production deployment.            │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### Request Lifecycle

```
Browser                  Angular                  NestJS                   SQLite
  │                        │                        │                       │
  │  User action           │                        │                       │
  │───────────────────────►│                        │                       │
  │                        │  Signal state update   │                       │
  │                        │  ─────► (optimistic)   │                       │
  │                        │                        │                       │
  │                        │  HTTP GET/POST/PATCH   │                       │
  │                        │───────────────────────►│                       │
  │                        │   Authorization: Bearer│                       │
  │                        │                        │                       │
  │                        │                        │  JwtAuthGuard         │
  │                        │                        │  ─────► Validate      │
  │                        │                        │         token         │
  │                        │                        │                       │
  │                        │                        │  Extract user claims  │
  │                        │                        │  (sub, email,         │
  │                        │                        │   organizationId)     │
  │                        │                        │                       │
  │                        │                        │  Query scoped by      │
  │                        │                        │  organizationId       │
  │                        │                        │──────────────────────►│
  │                        │                        │                       │
  │                        │                        │◄──────────────────────│
  │                        │                        │     Result set        │
  │                        │                        │                       │
  │                        │◄───────────────────────│                       │
  │                        │     JSON Response      │                       │
  │                        │                        │                       │
  │                        │  Signal update with    │                       │
  │                        │  response data         │                       │
  │                        │  ─────► DOM update     │                       │
  │◄───────────────────────│                        │                       │
  │  UI updated            │                        │                       │
```

### Key Data Flow Patterns

1. **Authentication Flow**: User submits credentials → NestJS validates, generates JWT with `{ sub, email, organizationId }` → Frontend stores token in localStorage → All subsequent requests include `Authorization: Bearer <token>`.

2. **Multi-tenant Data Isolation**: Every API endpoint extracts `organizationId` from the JWT payload (`req.user.organizationId`) and passes it to every service method. Every TypeORM query includes `where: { organizationId }`.

3. **Stock Adjustment with Audit**: Request to `POST /api/stock/adjust` → validates product/warehouse belong to org → updates `StockItem.quantity` → creates `InventoryTransaction` record → returns updated stock.

4. **Order Received → Auto-Increment Stock**: `PATCH /api/orders/:id/status` with `{ status: 'received' }` → validates state transition → iterates order items → finds/creates `StockItem` → increments quantity → creates `InventoryTransaction` for each item.

---

## 3. Multi-Tenant Isolation Strategy

Inventory Manager uses **discriminated shared-database multi-tenancy** (also called "row-level isolation").

### How it works:

- Every data entity has an `organizationId: number` column.
- The JWT token contains the authenticated user's `organizationId`.
- Every service method receives `organizationId` as a **required parameter**.
- Every TypeORM `find`, `findOne`, `save`, `create` includes `organizationId` in the `where` clause.
- Foreign key relationships cascade within the same organization only.

### Entity-level enforcement:

```typescript
// Every entity follows this pattern:
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;  // <-- Tenant discriminator

  // ... other columns ...

  @ManyToOne(() => Organization, (o) => o.products)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
```

### Unique constraints are scoped to organization:

```typescript
@Unique(['organizationId', 'sku'])       // Products: unique SKU per org
@Unique(['organizationId', 'productId', 'warehouseId'])  // Stock: unique combo per org
@Unique(['organizationId', 'orderNumber'])  // Orders: unique number per org
```

This means two different organizations can have products with the same SKU, order numbers can restart per tenant, etc.

---

## 4. Component Interaction Patterns (Frontend)

### Signal-Based State Management

Angular 22 signals replace traditional RxJS-based state management:

```
┌────────────────────────────────────────────────────────────┐
│                   Page Component                             │
│                                                              │
│  readonly data = signal<DataType | null>(null);              │
│  readonly loading = signal(true);                            │
│  readonly error = signal('');                                │
│                                                              │
│  Derived:                                                     │
│  readonly hasData = computed(() => this.data() !== null);    │
│  readonly isEmpty = computed(() => this.data()?.length === 0);│
│                                                              │
│  ngOnInit() { this.loadData(); }                             │
│  loadData() {                                                │
│    http.get(...).subscribe({                                 │
│      next: (res) => { this.data.set(res); this.loading.set(false); },
│      error: () => { this.error.set('Failed'); this.loading.set(false); }
│    });                                                       │
│  }                                                           │
└────────────────────────────────────────────────────────────┘
```

### Loading / Empty / Error Pattern

Every page and shared component implements a consistent pattern:

```html
@if (loading()) {
  <!-- Skeleton shimmer placeholder -->
} @else if (error()) {
  <!-- Error card with retry button -->
} @else if (data().length === 0) {
  <!-- Empty state with illustration -->
} @else {
  <!-- Actual content -->
}
```

### Shared Components (Input/Output signal pattern)

```typescript
// DataTable uses Angular 17+ signal inputs
@Component({ ... })
export class DataTableComponent {
  readonly columns = input<Column[]>([]);
  readonly rows = input<Row[]>([]);
  readonly loading = input(false);
  readonly error = input('');
  readonly rowClick = output<Row>();
  readonly retry = output<void>();
}
```

---

## 5. Lazy Loading Strategy

All pages are lazy-loaded via Angular Router `loadComponent`:

```typescript
const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.page') },
  { path: 'register', loadComponent: () => import('./pages/register/register.page') },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page') },
      { path: 'products', loadComponent: () => import('./pages/products/product-list.page') },
      { path: 'products/:id', loadComponent: () => import('./pages/products/product-detail.page') },
      { path: 'warehouses', loadComponent: () => import('./pages/warehouses/warehouse-list.page') },
      { path: 'suppliers', loadComponent: () => import('./pages/suppliers/supplier-list.page') },
      { path: 'orders', loadComponent: () => import('./pages/orders/order-list.page') },
      { path: 'orders/new', loadComponent: () => import('./pages/orders/order-create.page') },
      { path: 'orders/:id', loadComponent: () => import('./pages/orders/order-detail.page') },
      { path: 'transactions', loadComponent: () => import('./pages/transactions/transaction-list.page') },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page') },
    ]
  }
];
```

This results in 12 lazy-loaded pages, each only loading its JavaScript bundle when the user navigates to that route.

---

## 6. Why SQLite for Dev / PostgreSQL for Prod?

### SQLite in Development

- **Zero configuration** — no database server to install or manage.
- **File-based** — `data/inventory.db` is auto-created on first run.
- **Auto-save** — TypeORM's sqljs driver saves changes automatically.
- **Fast iteration** — `synchronize: true` means entity changes auto-migrate.
- **Portable** — the entire database is a single file, easy to reset by deleting it.

### PostgreSQL in Production

- **Concurrency** — handles multiple simultaneous writes safely.
- **Performance** — better query optimization for large datasets.
- **Integrity** — proper transaction isolation levels.
- **Scale** — connection pooling, replication, and backups.

### Migration Path

```typescript
// Change this in app.module.ts for production:
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',                       // was: 'sqljs'
    host: config.get('DB_HOST', 'localhost'),
    port: config.get('DB_PORT', 5432),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,                     // was: true — use migrations in prod
    migrations: ['dist/migrations/*.js'],
  }),
  inject: [ConfigService],
}),
```

The schema is already PostgreSQL-compatible — all types (`int`, `varchar`, `real`, `text`, `boolean`, `datetime`) map cleanly to PostgreSQL types.

---

## 7. Backend Module Architecture

Each NestJS module follows a consistent structure:

```
module/
├── dto/
│   └── index.ts              # Create*, Update*, Query* DTOs with class-validator decorators
├── *.controller.ts           # Route definitions, Swagger decorators, @UseGuards(JwtAuthGuard)
├── *.service.ts              # Business logic, TypeORM repository injections
└── *.module.ts               # NestJS module declaration with TypeOrmFeature imports
```

### Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule (global)
├── AuthModule
├── ProductsModule
├── WarehousesModule
├── StockModule
├── SuppliersModule
├── OrdersModule
├── TransactionsModule
├── SearchModule
└── SeedModule (auto-runs on init)
```

Modules are independent — they only depend on entity repositories, not on other modules' services. This keeps coupling low and makes the codebase easy to test and extend.

---

## 8. Security Architecture

### Authentication & Authorization

1. **Password hashing**: bcrypt with 10 salt rounds.
2. **JWT tokens**: Signed with configurable secret, 7-day expiration.
3. **Token payload**: `{ sub: userId, email, organizationId }`.
4. **Guard**: `JwtAuthGuard` extends Passport's `jwt` strategy, applied to all protected routes.
5. **Data scoping**: Every service method explicitly filters by `organizationId` — never trusts client IDs alone.

### Validation

- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unexpected fields.
- DTOs use `class-validator` decorators (`@IsString`, `@IsNumber`, `@IsOptional`, `@Min`, `@MaxLength`).
- Swagger integration auto-generates OpenAPI documentation.

---

## 9. Testing Strategy

- **Backend**: Jest-based unit tests for services (mock repositories). Currently 13 tests covering `AuthService` and `StockService`.
- **Frontend**: Jasmine/Karma spec for the App component.
- No end-to-end tests yet (planned).

Test files co-locate with source files (e.g., `auth.service.spec.ts` next to `auth.service.ts`), following NestJS conventions.
