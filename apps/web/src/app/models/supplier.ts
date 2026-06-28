export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
