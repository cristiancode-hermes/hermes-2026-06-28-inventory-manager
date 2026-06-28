import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse.entity';
import { StockItem } from '../../entities/stock-item.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(StockItem)
    private stockItemRepository: Repository<StockItem>,
  ) {}

  async create(organizationId: number, dto: CreateWarehouseDto): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      ...dto,
      organizationId,
    });
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(organizationId: number) {
    const warehouses = await this.warehouseRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });

    // Calculate capacity percentage for each warehouse
    const result = await Promise.all(
      warehouses.map(async (w) => {
        const totalStock = await this.stockItemRepository
          .createQueryBuilder('si')
          .where('si.warehouseId = :warehouseId', { warehouseId: w.id })
          .select('COALESCE(SUM(si.quantity), 0)', 'total')
          .getRawOne();

        const usedCapacity = Number(totalStock?.total) || 0;
        const capacityPercentage = w.capacity
          ? Math.round((usedCapacity / w.capacity) * 100)
          : null;

        return { ...w, capacityPercentage };
      }),
    );

    return result;
  }

  async findOne(organizationId: number, id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, organizationId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async update(organizationId: number, id: number, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findOne(organizationId, id);
    Object.assign(warehouse, dto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(organizationId: number, id: number): Promise<void> {
    const warehouse = await this.findOne(organizationId, id);
    await this.warehouseRepository.remove(warehouse);
  }
}
