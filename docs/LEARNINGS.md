# Learnings & Retrospective

> Real lessons learned while building Inventory Manager — what worked, what didn't, and what we'd do differently. Written for engineers who will maintain or extend this project.

---

## What Worked Well

### 1. Signal-Based State Management (No NgRx)

Angular 22's signals (`signal()`, `computed()`) eliminated the need for NgRx or any external state library. Every component manages its own state with a clean, minimal pattern:

```typescript
readonly data = signal<DataType | null>(null);
readonly loading = signal(true);
readonly error = signal('');
```

This is dramatically simpler than actions, reducers, effects, and selectors. For a project of this size (12 pages, no complex cross-component shared state), signals are more than sufficient. The signal + service + HttpClient pattern is the sweet spot.

**Lesson:** Don't reach for NgRx by default. Signals + services handle 90% of state management needs.

### 2. TypeORM + SQLite for Rapid Prototyping

Starting with `synchronize: true` and SQLite was a massive time saver. Zero database setup — just `npm install` and `npm run start:dev`. Schema changes are instant. The seed service auto-populates demo data on first launch, so every developer sees the same starting state.

The PostgreSQL-ready schema design meant we never painted ourselves into a corner. The switch to PostgreSQL requires changing only the TypeORM config.

**Lesson:** SQLite in dev + PostgreSQL-ready schema is the ideal combo for early-stage SaaS development.

### 3. Standalone Components with Lazy Loading

Angular standalone components simplified the architecture considerably — no NgModules, no circular dependency worries, no shared module bloat. Each page is a standalone component loaded lazily via `loadComponent()`. The shared components (DataTable, KpiCard, Badge) are also standalone and imported as needed.

**Lesson:** Standalone components + lazy loading is the default for Angular 22+ projects. There's no reason to use NgModules for new development.

### 4. Multi-Tenant with organizationId Column

The `organizationId` column on every entity is simple, transparent, and works perfectly with both SQLite and PostgreSQL. The JWT token carries the organization context, so the guard can easily extract and pass it to services. Every repository query includes `where: { organizationId }`.

This approach is far simpler than schema-per-tenant or database-per-tenant, and for a project targeting SMBs (hundreds of tenants, not millions), it's perfectly adequate.

**Lesson:** Row-level tenant isolation via `organizationId` column is the right choice for most B2B SaaS applications.

### 5. Wizard Pattern for Complex Forms

The 3-step purchase order wizard is a significantly better UX than a single large form. Users can focus on one decision at a time (supplier → items → details). Validation is incremental. The visual stepper gives clear progress feedback.

The backend receives a single `POST` request — the wizard is purely a frontend UX pattern, keeping the API simple.

**Lesson:** Multi-step wizards improve conversion and reduce errors on complex data entry.

### 6. Consistent Loading/Empty/Error States

Every data-displaying component follows the exact same pattern: loading skeleton → error with retry → empty state → data. The `DataTableComponent` makes this reusable across all list pages (products, warehouses, suppliers, orders, transactions).

This consistency means users never see a blank screen or unhandled error.

**Lesson:** Standardizing the loading/empty/error pattern across all components pays off in UX consistency and developer velocity.

---

## What I'd Do Differently

### 1. Better Test Coverage

Only the backend has tests (13 tests covering AuthService and StockService). The frontend has a single smoke test. For a production system, I'd add:

- **Frontend component tests** for every page (loading, empty, error states)
- **E2E tests** (Playwright) for critical user flows: login → create product → create order → receive order → verify stock
- **API integration tests** that hit the actual database

**Why we didn't:** Tight timeline. The existing tests validate the most critical business logic (auth + stock adjustments).

### 2. Warehouse Selection During Order Receiving

When a purchase order transitions to "received", the stock is incremented in `warehouseId = 1` (hardcoded). This is a known simplification. A real implementation should:

- Allow the user to select a target warehouse per item (or per order)
- Support partial receives (receive 30 of 50 items)
- Show expected stock vs. received stock

**Why we didn't:** The UX specs didn't specify warehouse selection during receiving. This is a clear next iteration.

### 3. Debounced Search with Actual API Integration

The global search component has a working UI but placeholder search logic (mock 300ms timeout, empty results). The backend search endpoint (`/api/search`) is fully implemented and tested. The frontend just needs to connect them.

**Why we didn't:** The frontend search integration wasn't wired up in the initial build. The controller, service, and DTO exist — it's a straightforward `http.get()` call to wire up.

### 4. Proper Error Handling in HTTP Interceptor

The current `AuthService.logout()` catches errors from `getMe()` and clears the token. However, there's no centralized HTTP error handling. A proper interceptor should:

- Show toast notifications for 4xx/5xx errors
- Auto-redirect to login on 401
- Log errors to a monitoring service

**Why we didn't:** The `http-exception.filter.ts` on the backend provides consistent error format. Frontend error handling is per-component for now.

### 5. Pagination Component Enhancement

The `PaginationComponent` exists but isn't connected to the `DataTableComponent`. Pages handle pagination state locally. A more polished approach would have the DataTable emit page changes and handle pagination display natively.

**Why we didn't:** The pagination component was extracted late in development. The current approach works but isn't as DRY as it could be.

---

## Applied Lessons from Last Project (Content Whisperer)

The previous project, Content Whisperer, taught us several lessons that directly shaped Inventory Manager:

### ✅ Lesson Applied: Start with Standalone Components

Content Whisperer used NgModules. Adding new features required registering components in the correct module. Inventory Manager uses standalone components exclusively — no module overhead.

### ✅ Lesson Applied: Signals Over RxJS Subjects

Content Whisperer used `BehaviorSubject` + `async` pipe for state management. The boilerplate was significant. Inventory Manager uses `signal()` + `computed()` which is cleaner, more performant, and requires less code.

### ✅ Lesson Applied: Consistent API Error Format

Content Whisperer had inconsistent error responses across endpoints. Inventory Manager uses NestJS `ValidationPipe` with `whitelist: true` and a global `HttpExceptionFilter` that ensures every error has `message`, `error`, and `statusCode`.

### ✅ Lesson Applied: Seed Data on First Launch

Content Whisperer required developers to run a separate seed script. Inventory Manager auto-seeds on `onModuleInit()` if the database is empty. This eliminates a setup step and ensures consistency.

### ✅ Lesson Applied: Lazy Load Everything

Content Whisperer eagerly loaded most modules. Inventory Manager lazy-loads all 12 pages. Initial bundle size is smaller, and pages load on demand.

### ❌ Lesson Not Yet Applied: E2E Tests

Content Whisperer had no E2E tests, and neither does Inventory Manager. This is the biggest gap. Playwright tests should be added before production deployment.

### ❌ Lesson Not Yet Applied: CI/CD Pipeline

Content Whisperer had no automated CI/CD. Inventory Manager also lacks one. A GitHub Actions workflow (or similar) should be added: lint → test → build → deploy.

---

## Technical Debt

| Item | Severity | Impact | Plan |
|---|---|---|---|
| Hardcoded warehouse ID in order receiving | Medium | All received stock goes to warehouse #1 | Add warehouse selection to receiving flow |
| Placeholder search in GlobalSearchComponent | Low | Ctrl+K shows modal but doesn't query API | Wire up `http.get('/api/search?q=...')` |
| No frontend pagination integration | Low | Pages handle pagination independently | Connect PaginationComponent to DataTableComponent |
| No frontend unit tests | High | Regression risk, no safety net for refactoring | Add Jest tests for critical pages (dashboard, order-create) |
| No E2E tests | High | Manual testing only | Add Playwright test suite |
| No CI/CD pipeline | Medium | Manual build and deploy process | Add GitHub Actions workflow |
| JWT_SECRET default in code | High | Default secret in `.env.example` is insecure | Must be changed in production |
| `any` types in some TypeORM query builders | Low | Type safety gaps | Refactor to use typed queries |
| No user role/permission model | Medium | All users are admins | Add Role entity and RBAC |

---

## Environment Constraints

### GITHUB_TOKEN

The project does not currently integrate with GitHub for CI/CD. A `GITHUB_TOKEN` with `repo` scope would be needed for:

- Automated test runs via GitHub Actions
- Deploy previews
- Version tagging and release automation

When setting up CI, create a fine-grained token with minimum required permissions.

### NEON_API_KEY

The schema is PostgreSQL-ready, and Neon (serverless PostgreSQL) is the target production database. A `NEON_API_KEY` would be needed for:

- Provisioning a Neon project via API
- Running migrations against a Neon database
- Setting up connection pooling and branching

The current database configuration uses SQLite. To switch to Neon PostgreSQL:

1. Set environment variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
2. Change TypeORM config to `type: 'postgres'`
3. Set `synchronize: false` and use TypeORM migrations
4. Configure `ssl: { rejectUnauthorized: true }` for Neon's TLS requirement

### Other Constraints

- **Node.js 22+** — The project uses modern JavaScript features (optional chaining, nullish coalescing, top-level await). Node 22 provides the best performance and compatibility.
- **npm 10+** — Workspaces are npm-native. Yarn or pnpm would also work but are untested.
- **sql.js (SQLite via WASM)** — This driver is single-threaded. For any concurrent usage (even two simultaneous API calls), PostgreSQL is required.
- **No Docker** — The project has no Dockerfile or docker-compose.yml. Adding one would simplify production deployment.

---

## Final Thoughts

Inventory Manager is a solid foundation for a multi-tenant inventory management SaaS. The architecture choices are pragmatic: signals over stores, SQLite over PostgreSQL in dev, standalone components over modules. The codebase is clean, the patterns are consistent, and the test suite (while small) validates the most critical business logic.

**Three things to prioritize before production:**
1. **Wire up the global search** — the API endpoint is ready, the frontend needs connecting
2. **Add warehouse selection** to order receiving (remove hardcoded `warehouseId = 1`)
3. **Write E2E tests** for the core user journey

The project responds well to `ng build` (passes), `nest build --tsc` (passes), and `jest` (13/13 tests pass). It's ready for the next phase of development.
