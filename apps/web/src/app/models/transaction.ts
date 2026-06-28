export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
