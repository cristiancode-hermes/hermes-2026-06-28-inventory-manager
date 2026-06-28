import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

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
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/product-list.page').then(m => m.ProductListPage)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./pages/products/product-detail.page').then(m => m.ProductDetailPage)
      },
      {
        path: 'warehouses',
        loadComponent: () => import('./pages/warehouses/warehouse-list.page').then(m => m.WarehouseListPage)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./pages/suppliers/supplier-list.page').then(m => m.SupplierListPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/order-list.page').then(m => m.OrderListPage)
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./pages/orders/order-create.page').then(m => m.OrderCreatePage)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/orders/order-detail.page').then(m => m.OrderDetailPage)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/transactions/transaction-list.page').then(m => m.TransactionListPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
