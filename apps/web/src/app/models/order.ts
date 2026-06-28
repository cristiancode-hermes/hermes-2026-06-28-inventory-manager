export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
}

export interface Order {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
  expectedDate: string;
  notes: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderPayload {
  supplierId: string;
  expectedDate: string;
  notes: string;
  items: { productId: string; quantityOrdered: number }[];
}
