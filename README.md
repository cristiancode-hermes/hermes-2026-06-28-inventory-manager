# Inventory Manager

> **Multi-tenant SaaS de gestión de inventarios** — controla stock, gestiona proveedores, órdenes de compra y alertas inteligentes.

Inventory Manager es un sistema completo de gestión de inventarios diseñado como SaaS multi-tenant. Construido con Angular 22 (señales, zoneless, Tailwind v4) en el frontend y NestJS (JWT, TypeORM, SQLite) en el backend, ofrece una experiencia moderna, rápida y responsiva para administrar productos, almacenes, stock, proveedores y órdenes de compra.

---

## ✨ Features

### Must Have (Especificación UX)

| Feature | Descripción |
|---|---|
| **Dashboard con KPIs** | Resumen visual de productos totales, almacenes, valor del inventario y alertas de stock bajo. |
| **Productos CRUD** | Gestión completa de productos con SKU, nombre, categoría, precio unitario y nivel de reorden. |
| **Almacenes CRUD** | Administración de múltiples almacenes con ubicación, capacidad y porcentaje de uso. |
| **Control de Stock** | Ajuste de stock por producto y almacén con registro automático de transacciones. |
| **Proveedores CRUD** | Gestión de proveedores con datos de contacto, activación/desactivación toggle. |
| **Órdenes de Compra** | Creación wizard multi-paso (3 pasos: proveedor → items → detalles), transición de estados (pending → sent → received → cancelled). |
| **Alertas de Stock Bajo** | Detección automática de productos con cantidad por debajo del mínimo configurado. |
| **Autenticación JWT Multi-tenant** | Registro + login con organización automática y aislamiento de datos por `organizationId`. |
| **Dark Mode** | Tema oscuro completo con persistencia en localStorage y toggle rápido. |

### Should Have

| Feature | Descripción |
|---|---|
| **Búsqueda Global (Ctrl+K)** | Modal de búsqueda tipo "command palette" que busca en productos, órdenes y proveedores simultáneamente. |
| **Historial de Transacciones** | Registro de auditoría con filtros por producto, tipo y rango de fechas. |
| **CSV Export-ready** | Datos preparados para exportación desde la tabla de datos genérica. |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Angular 22                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Auth     │  │  Pages    │  │  Shared            │  │
│  │  Service  │  │  (lazy)   │  │  Components        │  │
│  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │                 │              │
│  ┌────▼──────────────▼─────────────────▼───────────┐  │
│  │              ApiService (HttpClient)              │  │
│  └──────────────────────┬──────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │ HTTP (JSON) JWT Bearer Token
┌─────────────────────────┼────────────────────────────┐
│              ┌──────────▼──────────┐                  │
│              │   NestJS Backend     │                  │
│              │   localhost:3000     │                  │
│              └──────────┬──────────┘                  │
│                         │                             │
│  ┌──────────────────────▼──────────────────────────┐  │
│  │              TypeORM + SQLite                     │  │
│  │            (PostgreSQL-ready schema)              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  9 entities · 8 modules · 22 API endpoints             │
│  Swagger docs at /api/docs                             │
└────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Frontend (Angular 22)** — Signals-based state management, no external state library needed. All components use `signal()` for local state and `computed()` for derived values. Lazy-loaded routes via Router.

2. **API Layer (NestJS)** — JWT authentication via Passport.js with `organizationId` embedded in every token. All queries are scoped by `organizationId` ensuring tenant isolation.

3. **Database (TypeORM + SQLite)** — `synchronize: true` for development; schema is fully PostgreSQL-compatible for production (change `type` to `postgres` in `app.module.ts`).

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Angular (standalone, signals, zoneless) | 22.x |
| **UI Framework** | Tailwind CSS | 4.x |
| **Backend** | NestJS | Latest |
| **ORM** | TypeORM | Latest |
| **Auth** | Passport.js + JWT + bcryptjs | — |
| **Database (dev)** | SQLite (via sql.js) | — |
| **Database (prod)** | PostgreSQL (schema-ready) | — |
| **API Docs** | Swagger / OpenAPI | Auto |
| **Testing** | Jest (backend), Jasmine (frontend) | — |
| **Runtime** | Node.js | 22.x |
| **Package Manager** | npm | 10+ |
| **Language** | TypeScript | 5.x |

---

## 📋 Prerequisites

- **Node.js** ≥ 22.x
- **npm** ≥ 10.x
- A modern browser (Chrome, Firefox, Edge, Safari)

---

## 🚀 Local Setup

### 1. Clone & navigate

```bash
cd inventory-manager
```

### 2. Environment configuration

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` if needed (defaults work for local dev):

```
PORT=3000
DATABASE_URL=data/inventory.db
JWT_SECRET=your-super-secret-key-change-me
JWT_EXPIRES_IN=7d
```

### 3. Install dependencies

```bash
# Backend
cd apps/api && npm install && cd ../..

# Frontend
cd apps/web && npm install && cd ../..
```

### 4. Build

```bash
# Build backend
cd apps/api && npm run build && cd ../..

# Build frontend
cd apps/web && npm run build && cd ../..
```

### 5. Seed demo data

The backend auto-seeds on first launch (see `SeedService.onModuleInit()`). Simply start the server:

```bash
cd apps/api && npm run start:dev
```

### 6. Run

Open two terminals:

```bash
# Terminal 1 — Backend (port 3000)
cd apps/api && npm run start:dev

# Terminal 2 — Frontend (port 4200)
cd apps/web && npm run start
```

### 7. Access

| Service | URL |
|---|---|
| **Frontend** | http://localhost:4200 |
| **API** | http://localhost:3000/api |
| **Swagger Docs** | http://localhost:3000/api/docs |

---

## 🔑 Demo Credentials

| Email | Password |
|---|---|
| `admin@demo.com` | `admin123` |

Demo data includes: 1 organization, 1 admin user, 3 warehouses, 10 products, 5 suppliers, 3 purchase orders, and sample stock transactions.

---

## 🧪 Tests

```bash
# Backend tests (13 tests pass)
cd apps/api && npm test

# Frontend tests
cd apps/web && npm test
```

---

## 🧭 Project Structure

```
apps/
├── api/                          # NestJS backend
│   └── src/
│       ├── main.ts               # Bootstrap + Swagger + ValidationPipe
│       ├── app.module.ts          # Root module (TypeORM, Config, ServeStatic)
│       ├── common/                # Guards, strategies, filters
│       │   ├── jwt-auth.guard.ts
│       │   ├── jwt.strategy.ts
│       │   └── http-exception.filter.ts
│       ├── entities/              # 9 TypeORM entities
│       │   ├── organization.entity.ts
│       │   ├── user.entity.ts
│       │   ├── product.entity.ts
│       │   ├── warehouse.entity.ts
│       │   ├── stock-item.entity.ts
│       │   ├── supplier.entity.ts
│       │   ├── purchase-order.entity.ts
│       │   ├── purchase-order-item.entity.ts
│       │   └── inventory-transaction.entity.ts
│       └── modules/              # 8 feature modules
│           ├── auth/             # Register, Login, JWT
│           ├── products/         # CRUD + search + category filter
│           ├── warehouses/       # CRUD + capacity %
│           ├── stock/            # Stock mgmt, alerts, dashboard KPIs
│           ├── suppliers/        # CRUD + toggle active
│           ├── orders/           # CRUD + status transitions + auto-stock
│           ├── transactions/     # Audit trail with filters
│           ├── search/           # Global search
│           └── seed/             # Auto-seed on first launch
├── web/                          # Angular 22 frontend
│   └── src/app/
│       ├── core/                 # AuthService, ApiService
│       ├── models/               # TypeScript interfaces
│       ├── layout/               # MainLayout, Header, Sidebar, GlobalSearch, ThemeToggle
│       ├── pages/                # 12 lazy-loaded pages
│       └── shared/               # DataTable, KpiCard, Pagination, Modal, Badge...
├── docs/                         # Documentation
└── README.md                     # This file
```

---

## 🛣️ Roadmap

### Future Features (Could Have)

- **Real-time stock updates** via WebSockets
- **Barcode / QR scanning** for inventory
- **Advanced reporting** with charts (ngx-charts or Chart.js)
- **Role-based access control** (admin, manager, viewer)
- **Push notifications** for low stock alerts
- **Multi-language support** (i18n)
- **Mobile app** (Ionic/Capacitor)

### Won't Have (for now)

- Payment integration (this is an internal tool, not a storefront)
- Direct customer-facing e-commerce

---

## 🧑‍💻 Development

### Useful commands

```bash
# Backend — watch mode
cd apps/api && npm run start:dev

# Backend — debug mode
cd apps/api && npm run start:debug

# Frontend — watch mode
cd apps/web && npm run start

# Backend tests (watch)
cd apps/api && npm run test:watch

# Lint
cd apps/api && npm run lint
cd apps/web && npm run lint

# TypeORM CLI
cd apps/api && npx typeorm
```

### Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | API server port |
| `DATABASE_URL` | `data/inventory.db` | SQLite database file path |
| `JWT_SECRET` | `your-super-secret-key-change-me` | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token expiration duration |

---

## 📄 License

Internal tool — All rights reserved.
