import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from '../../entities/warehouse.entity';
import { StockItem } from '../../entities/stock-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, StockItem])],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
