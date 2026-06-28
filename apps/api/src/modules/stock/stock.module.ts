import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockItem } from '../../entities/stock-item.entity';
import { Product } from '../../entities/product.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockItem, Product, Warehouse, InventoryTransaction])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
