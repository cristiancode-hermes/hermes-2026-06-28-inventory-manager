export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: number;
  reorderPoint: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
