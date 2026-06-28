import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Supplier } from './supplier.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

@Entity('purchase_orders')
@Unique(['organizationId', 'orderNumber'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'varchar', length: 100 })
  orderNumber: string;

  @Column({ type: 'int' })
  supplierId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: string;

  @Column({ type: 'real', default: 0 })
  totalAmount: number;

  @Column({ type: 'date', nullable: true })
  expectedDate: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', nullable: true })
  orderedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  receivedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.purchaseOrders)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @OneToMany(() => PurchaseOrderItem, (item) => item.order, { cascade: true })
  items: PurchaseOrderItem[];
}
