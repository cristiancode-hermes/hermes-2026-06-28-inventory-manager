import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItem } from '../../entities/stock-item.entity';
import { Product } from '../../entities/product.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { AdjustStockDto } from './dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private stockItemRepository: Repository<StockItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async getStockByProduct(organizationId: number, productId?: number) {
    const where: any = { organizationId };
    if (productId) {
      where.productId = productId;
    }

    return this.stockItemRepository.find({
      where,
      relations: { product: true, warehouse: true },
      order: { product: { name: 'ASC' } },
    });
  }

  async adjustStock(organizationId: number, dto: AdjustStockDto): Promise<StockItem> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, organizationId },
    });
    if (!product) {
      throw new NotFoundException('Product not found in this organization');
    }

    const warehouse = await this.warehouseRepository.findOne({
      where: { id: dto.warehouseId, organizationId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found in this organization');
    }

    let stockItem = await this.stockItemRepository.findOne({
      where: {
        organizationId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
      },
    });

    if (!stockItem) {
      stockItem = this.stockItemRepository.create({
        organizationId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity: 0,
        minStock: 0,
      });
    }

    const oldQuantity = stockItem.quantity;
    let newQuantity: number;

    switch (dto.type) {
      case 'in':
        newQuantity = oldQuantity + dto.quantity;
        break;
      case 'out':
        if (oldQuantity < dto.quantity) {
          throw new BadRequestException('Insufficient stock');
        }
        newQuantity = oldQuantity - dto.quantity;
        break;
      case 'adjust':
        newQuantity = dto.quantity;
        break;
      default:
        throw new BadRequestException('Invalid transaction type');
    }

    stockItem.quantity = newQuantity;
    const saved = await this.stockItemRepository.save(stockItem);

    // Create inventory transaction record
    const transaction = this.transactionRepository.create({
      organizationId,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      type: dto.type,
      quantity: dto.quantity,
      balance: newQuantity,
      reference: dto.reference,
      notes: dto.notes,
    });
    await this.transactionRepository.save(transaction);

    return saved;
  }

  async getStockAlerts(organizationId: number) {
    return this.stockItemRepository
      .createQueryBuilder('si')
      .innerJoinAndSelect('si.product', 'product')
      .innerJoinAndSelect('si.warehouse', 'warehouse')
      .where('si.organizationId = :orgId', { orgId: organizationId })
      .andWhere('si.quantity < si.minStock')
      .orderBy('(si.minStock - si.quantity)', 'DESC')
      .getMany();
  }

  async getDashboardKpis(organizationId: number) {
    const totalProducts = await this.productRepository.count({
      where: { organizationId, isActive: true },
    });

    const totalStockItems = await this.stockItemRepository
      .createQueryBuilder('si')
      .where('si.organizationId = :orgId', { orgId: organizationId })
      .select('COALESCE(SUM(si.quantity), 0)', 'total')
      .getRawOne();

    const totalValue = await this.stockItemRepository
      .createQueryBuilder('si')
      .innerJoin('si.product', 'p')
      .where('si.organizationId = :orgId', { orgId: organizationId })
      .select('COALESCE(SUM(si.quantity * p.unitPrice), 0)', 'totalValue')
      .getRawOne();

    const lowStockCount = await this.stockItemRepository
      .createQueryBuilder('si')
      .where('si.organizationId = :orgId', { orgId: organizationId })
      .andWhere('si.quantity < si.minStock')
      .getCount();

    const totalWarehouses = await this.warehouseRepository.count({
      where: { organizationId, isActive: true },
    });

    return {
      totalProducts,
      totalStockItems: Number(totalStockItems?.total) || 0,
      totalValue: Number(totalValue?.totalValue) || 0,
      lowStockCount,
      totalWarehouses,
    };
  }
}
