# Frontend Architecture — Angular 22

> Complete guide to the Angular 22 frontend: signal-based state management, component tree, lazy loading, dark mode, and Tailwind v4 design system.

---

## Architecture Overview

The frontend is a **standalone, zoneless Angular 22** application. It uses no external state management library — all state is managed via Angular signals (`signal()`, `computed()`, `effect()`). The app follows a feature-based folder structure with shared components.

```
apps/web/src/app/
├── core/                   # Singleton services
│   ├── auth.service.ts     # Authentication state (signals)
│   └── api.service.ts      # API base URL + headers
├── models/                 # TypeScript interfaces
│   ├── index.ts            # Re-exports all models
│   ├── product.ts
│   ├── warehouse.ts
│   ├── supplier.ts
│   ├── order.ts
│   ├── transaction.ts
│   ├── stock.ts
│   └── auth.ts
├── layout/                 # Layout components
│   ├── main-layout/        # Shell: sidebar + header + router-outlet
│   ├── header/             # Search bar, theme toggle, user menu
│   ├── sidebar/            # Navigation with active states
│   ├── global-search/      # Ctrl+K command palette
│   └── theme-toggle/       # Dark/light mode switch
├── pages/                  # 12 lazy-loaded page components
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── products/
│   │   ├── product-list.page.ts
│   │   └── product-detail.page.ts
│   ├── warehouses/
│   ├── suppliers/
│   ├── orders/
│   │   ├── order-list.page.ts
│   │   ├── order-create.page.ts    # 3-step wizard
│   │   └── order-detail.page.ts
│   ├── transactions/
│   └── settings/
├── shared/                 # Reusable components
│   ├── data-table/         # Generic table with loading/empty/error states
│   ├── kpi-card/           # Dashboard metric card
│   ├── pagination/         # Page navigation
│   ├── modal/              # Overlay dialog
│   ├── badge/              # Status badge
│   └── confirm-dialog/     # Confirmation prompt
├── app.ts                  # Root component
├── app.routes.ts           # Lazy-loaded route definitions
├── app.config.ts           # App providers
├── app.html                # Root template
├── app.css                 # Global styles
├── auth.guard.ts           # Route guard
└── auth.interceptor.ts     # HTTP interceptor
```

---

## Signal Architecture

Angular signals replace RxJS BehaviorSubjects and NgRx for all component state. Every component manages its own state using signals.

### Pattern: Signal Trio

Every data-fetching page follows this pattern:

```typescript
readonly data = signal<DataType | null>(null);
readonly loading = signal(true);
readonly error = signal('');

ngOnInit(): void {
  this.loadData();
}

private loadData(): void {
  this.loading.set(true);
  this.http.get<DataType>(`${this.api.baseUrl}/resource`).subscribe({
    next: (res) => {
      this.data.set(res);
      this.loading.set(false);
    },
    error: (err) => {
      this.loading.set(false);
      this.error.set(err.message || 'Failed to load');
    }
  });
}
```

### Computed Signals for Derived State

```typescript
// Derived value: total quantity of items in order
get totalQuantity(): number {
  return this.orderItems().reduce((sum, item) => sum + (item.quantity || 0), 0);
}

// Read-only signal exposure
readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
readonly currentUser = computed(() => this.userSignal());
```

### AuthService Signal State

```typescript
// core/auth.service.ts
private readonly tokenSignal = signal<string | null>(localStorage.getItem('token'));
private readonly userSignal = signal<User | null>(null);
readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
readonly currentUser = computed(() => this.userSignal());
```

The `tokenSignal` is persisted to `localStorage` on login/register and cleared on logout. The `getMe()` call on app init populates `userSignal`.

---

## Component Tree

```
App (root)
├── RouterOutlet
│   ├── LoginPage (lazy)
│   ├── RegisterPage (lazy)
│   └── MainLayoutComponent (authenticated shell)
│       ├── SidebarComponent
│       │   ├── Navigation links (Dashboard, Products, Warehouses, Suppliers, Orders, Transactions, Settings)
│       │   └── Active route highlighting via RouterLinkActive
│       ├── HeaderComponent
│       │   ├── GlobalSearchComponent (Ctrl+K modal)
│       │   ├── ThemeToggleComponent
│       │   └── User menu dropdown
│       └── RouterOutlet (child routes)
│           ├── DashboardPage
│           │   ├── KpiCardComponent (×4)
│           │   ├── BadgeComponent
│           │   └── Low Stock Alerts / Recent Orders panels
│           ├── ProductListPage
│           │   ├── DataTableComponent
│           │   └── PaginationComponent
│           ├── ProductDetailPage
│           │   └── Product form / stock info
│           ├── WarehouseListPage
│           │   └── DataTableComponent
│           ├── SupplierListPage
│           │   └── DataTableComponent
│           ├── OrderListPage
│           │   └── DataTableComponent
│           ├── OrderCreatePage (3-step wizard)
│           ├── OrderDetailPage
│           │   └── Status badge, item table, status actions
│           ├── TransactionListPage
│           │   ├── DataTableComponent
│           │   └── PaginationComponent
│           └── SettingsPage
```

---

## Loading / Empty / Error Patterns

Every data display component handles three states consistently using Angular's `@if` control flow syntax.

### DataTableComponent (shared)

```html
@if (loading()) {
  <!-- Skeleton loading state -->
  <div class="p-6 space-y-3">
    @for (i of [1,2,3,4,5]; track i) {
      <div class="h-6 skeleton w-full"></div>
    }
  </div>
} @else if (error()) {
  <!-- Error state with retry button -->
  <div class="p-12 text-center">
    <svg class="w-12 h-12 mx-auto text-danger-400 mb-3">...</svg>
    <p class="text-sm text-secondary-500 mb-3">{{ error() }}</p>
    <button (click)="retry.emit()" class="...">Retry</button>
  </div>
} @else if (rows().length === 0) {
  <!-- Empty state -->
  <div class="p-12 text-center">
    <svg class="w-12 h-12 mx-auto text-secondary-300 mb-3">...</svg>
    <p class="text-sm text-secondary-500">{{ emptyMessage() }}</p>
  </div>
} @else {
  <!-- Data table -->
  <table>...</table>
}
```

### Skeleton Animation

Defined in `styles.css` using CSS keyframes:

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, ...);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

---

## Lazy Loading Strategy

All pages are lazy-loaded via the Angular Router using the `loadComponent` syntax:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'products', loadComponent: () => import('./pages/products/product-list.page').then(m => m.ProductListPage) },
      { path: 'products/:id', loadComponent: () => import('./pages/products/product-detail.page').then(m => m.ProductDetailPage) },
      { path: 'warehouses', loadComponent: () => import('./pages/warehouses/warehouse-list.page').then(m => m.WarehouseListPage) },
      { path: 'suppliers', loadComponent: () => import('./pages/suppliers/supplier-list.page').then(m => m.SupplierListPage) },
      { path: 'orders', loadComponent: () => import('./pages/orders/order-list.page').then(m => m.OrderListPage) },
      { path: 'orders/new', loadComponent: () => import('./pages/orders/order-create.page').then(m => m.OrderCreatePage) },
      { path: 'orders/:id', loadComponent: () => import('./pages/orders/order-detail.page').then(m => m.OrderDetailPage) },
      { path: 'transactions', loadComponent: () => import('./pages/transactions/transaction-list.page').then(m => m.TransactionListPage) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  }
];
```

**12 lazy-loaded page components** in total. Each page is a standalone component. The `MainLayoutComponent` is eagerly loaded (it's small and always needed for authenticated routes).

---

## Dark Mode Implementation

### Theme Toggle (`theme-toggle.component.ts`)

Uses a `signal<boolean>` for dark mode state, persisted in `localStorage`:

```typescript
private readonly darkSignal = signal<boolean>(localStorage.getItem('theme') === 'dark');

toggleTheme(): void {
  this.darkSignal.update(v => !v);
  this.syncTheme();
}

private syncTheme(): void {
  if (this.darkSignal()) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}
```

### CSS Strategy

Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *))` enables dark variants based on the `.dark` class on `<html>`. CSS custom properties override for dark mode:

```css
:root {
  --color-bg-page: #FAFAFA;
}

.dark {
  --color-bg-page: #0A0A0A;
}
```

Every component uses Tailwind's `dark:` prefix variant: `bg-white dark:bg-gray-900`, `text-neutral-900 dark:text-neutral-100`, etc.

### Persistence

Theme choice survives page reloads via `localStorage`. No system preference detection (`prefers-color-scheme`) is implemented yet — that's a future enhancement.

---

## Ctrl+K Global Search Implementation

The `GlobalSearchComponent` is a command-palette-style modal triggered by `Ctrl+K` (or `Cmd+K` on macOS).

### Keyboard Listener

```typescript
// Constructor
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    this.open();
  }
  if (e.key === 'Escape' && this.isOpen) {
    this.close();
  }
});
```

### Opening

The search can be opened via:
- **Keyboard shortcut:** `Ctrl+K` / `Cmd+K`
- **Header button:** Clicking the search bar in the header dispatches a `CustomEvent('open-global-search')` that the `GlobalSearchComponent` listens for
- **Programmatic:** Any component can dispatch the event

### Search Behavior

- The search input is auto-focused when the modal opens
- Debounced HTTP call to `GET /api/search?q=...` (placeholder in current implementation uses a mock timeout)
- Results are grouped by category (Products, Orders, Suppliers, Warehouses) with type labels
- Clicking a result navigates to the appropriate detail page
- `ESC` or clicking the overlay closes the modal

### Route Mapping

```typescript
private readonly routeMap: Record<string, string> = {
  product: '/products',
  order: '/orders',
  warehouse: '/warehouses',
  supplier: '/suppliers'
};
```

---

## Wizard Stepper Pattern

The `OrderCreatePage` implements a 3-step wizard for purchase order creation.

### State Management

```typescript
readonly currentStep = signal(0);           // 0, 1, or 2
readonly selectedSupplierId = signal('');
readonly orderItems = signal<OrderItem[]>([]);
readonly expectedDate = signal('');
readonly notes = signal('');
readonly submitting = signal(false);
readonly error = signal('');
```

### Step Flow

| Step | Index | Action | Validation |
|---|---|---|---|
| **Select Supplier** | 0 | Radio buttons from `/api/suppliers` | Must select one |
| **Add Items** | 1 | Product selector + quantity inputs | At least 1 item required |
| **Order Details** | 2 | Expected date, notes, summary | Date required |

### Visual Stepper

```html
<div class="flex items-center gap-0">
  @for (step of steps; track step.index) {
    <div class="flex items-center gap-2">
      <div [class.bg-primary-500]="currentStep() >= step.index"
           [class.bg-secondary-200]="currentStep() < step.index">
        @if (currentStep() > step.index) {
          <!-- Checkmark icon -->
        } @else {
          {{ step.index + 1 }}
        }
      </div>
      <span>{{ step.label }}</span>
    </div>
    @if (step.index < steps.length - 1) {
      <div [class.bg-primary-500]="currentStep() > step.index"
           [class.bg-secondary-200]="currentStep() <= step.index"></div>
    }
  }
</div>
```

### Navigation

- **Next button:** Validates current step, increments `currentStep`
- **Previous button:** Decrements `currentStep` (disabled on step 0)
- **Submit button:** Validates + calls `POST /api/orders`

---

## Tailwind v4 Design Tokens

Custom design tokens are defined in `styles.css` using Tailwind v4's `@theme` directive.

### Color Palette

| Token | Usage |
|---|---|
| `primary-500` (#3B82F6) | Primary actions, links, active nav items |
| `secondary-500` (#64748B) | Secondary text, muted elements |
| `neutral-900` (#171717) | Primary text (light mode) |
| `neutral-100` (#F5F5F5) | Primary text (dark mode) |
| `success-500` (#22C55E) | Positive states, received orders |
| `warning-500` (#F59E0B) | Warning states, pending orders |
| `danger-500` (#EF4444) | Error states, cancelled orders, destructive actions |

### Typography

| Token | Value |
|---|---|
| `--font-sans` | 'Inter', system-ui, -apple-system, sans-serif |
| `--font-mono` | 'JetBrains Mono', monospace |

### Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | 0 1px 2px 0 rgb(0 0 0 / 0.05) |
| `--shadow` | 0 1px 3px 0 rgb(0 0 0 / 0.1) |
| `--shadow-md` | 0 4px 6px -1px rgb(0 0 0 / 0.1) |
| `--shadow-lg` | 0 10px 15px -3px rgb(0 0 0 / 0.1) |
| `--shadow-xl` | 0 20px 25px -5px rgb(0 0 0 / 0.1) |

### Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | 4px |
| `--radius` | 6px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |

### CSS Custom Properties for UI Backgrounds

```css
:root {
  --color-bg-page: #FAFAFA;
  --color-bg-card: #FFFFFF;
  --color-bg-input: #FFFFFF;
  --color-border: #E5E5E5;
  --color-border-input: #D4D4D4;
}

.dark {
  --color-bg-page: #0A0A0A;
  --color-bg-card: #1A1A1A;
  --color-bg-input: #262626;
  --color-border: #404040;
  --color-border-input: #525252;
}
```

---

## HTTP Client & API Integration

### ApiService

Provides the base URL and constructs headers:

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = 'http://localhost:3000/api';

  get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }
}
```

### Auth Interceptor

An HTTP interceptor (`auth.interceptor.ts`) automatically attaches the Bearer token to every outgoing request using the `HttpInterceptor` interface.

### Auth Guard

The `auth.guard.ts` route guard checks `AuthService.isAuthenticated()` and redirects to `/login` if not authenticated.

---

## Responsive Design

The layout adapts to mobile, tablet, and desktop:

| Breakpoint | Layout Behavior |
|---|---|
| **Mobile (< 768px)** | Sidebar hidden (hamburger toggle), single-column layouts |
| **Tablet (768px - 1024px)** | Sidebar collapsed, multi-column where appropriate |
| **Desktop (> 1024px)** | Full sidebar visible, 2-4 column grid layouts |

The sidebar toggles via a `CustomEvent('toggle-sidebar')` dispatched between Header and Sidebar components.

---

## Performance Considerations

- **Zoneless Angular 22** — No zone.js overhead; change detection is signal-driven and minimal
- **Lazy loading** — Each page is a separate chunk loaded on demand
- **Skeleton loading** — Perceived performance improved by immediate skeleton display
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables animations
- **Optimized scrollbars** — Custom thin scrollbar styling
