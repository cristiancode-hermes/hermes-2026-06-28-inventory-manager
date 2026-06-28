export interface StockEntry {
  id: string;
  productId: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustPayload {
  productId: string;
  warehouseId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  warehouseId: string;
  warehouseName: string;
}

export interface DashboardData {
  totalProducts: number;
  totalWarehouses: number;
  totalSuppliers: number;
  totalOrders: number;
  lowStockAlerts: StockAlert[];
  recentOrders: Order[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Order } from './order';
