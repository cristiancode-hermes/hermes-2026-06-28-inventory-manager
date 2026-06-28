import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';
import { StockItem } from './stock-item.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { InventoryTransaction } from './inventory-transaction.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Product, (product) => product.organization)
  products: Product[];

  @OneToMany(() => Warehouse, (warehouse) => warehouse.organization)
  warehouses: Warehouse[];

  @OneToMany(() => StockItem, (stockItem) => stockItem.organization)
  stockItems: StockItem[];

  @OneToMany(() => Supplier, (supplier) => supplier.organization)
  suppliers: Supplier[];

  @OneToMany(() => PurchaseOrder, (order) => order.organization)
  purchaseOrders: PurchaseOrder[];

  @OneToMany(() => InventoryTransaction, (tx) => tx.organization)
  inventoryTransactions: InventoryTransaction[];
}
