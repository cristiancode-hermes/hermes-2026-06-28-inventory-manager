import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { StockItem } from '../../entities/stock-item.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Warehouse,
      Product,
      Supplier,
      PurchaseOrder,
      PurchaseOrderItem,
      StockItem,
      InventoryTransaction,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
