import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { StockItem } from '../../entities/stock-item.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private orderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(StockItem)
    private stockItemRepository: Repository<StockItem>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async create(organizationId: number, dto: CreateOrderDto): Promise<PurchaseOrder> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: dto.supplierId, organizationId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Validate products exist and belong to org
    for (const item of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId, organizationId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
    }

    // Generate order number
    const count = await this.orderRepository.count({
      where: { organizationId },
    });
    const orderNumber = `PO-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitPrice,
      0,
    );

    const order = this.orderRepository.create({
      organizationId,
      orderNumber,
      supplierId: dto.supplierId,
      status: 'pending',
      totalAmount,
      expectedDate: dto.expectedDate,
      notes: dto.notes,
      orderedAt: new Date(),
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = dto.items.map((item) =>
      this.orderItemRepository.create({
        organizationId,
        orderId: savedOrder.id,
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitPrice: item.unitPrice,
        lineTotal: item.quantityOrdered * item.unitPrice,
      }),
    );
    await this.orderItemRepository.save(orderItems);

    return this.findOne(organizationId, savedOrder.id);
  }

  async findAll(organizationId: number, query: QueryOrderDto) {
    const { status, page = 1, limit = 10 } = query;
    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    const [items, total] = await this.orderRepository.findAndCount({
      where,
      relations: { supplier: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async findOne(organizationId: number, id: number): Promise<PurchaseOrder> {
    const order = await this.orderRepository.findOne({
      where: { id, organizationId },
      relations: {
        supplier: true,
        items: { product: true },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(
    organizationId: number,
    id: number,
    dto: UpdateOrderStatusDto,
  ): Promise<PurchaseOrder> {
    const order = await this.findOne(organizationId, id);
    const validTransitions = {
      pending: ['sent', 'cancelled'],
      sent: ['received', 'cancelled'],
      received: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    // If received, increment stock
    if (dto.status === 'received') {
      await this.processReceivedOrder(organizationId, order);
      order.receivedAt = new Date();
    }

    if (dto.status === 'sent') {
      order.orderedAt = new Date();
    }

    order.status = dto.status;
    return this.orderRepository.save(order);
  }

  private async processReceivedOrder(
    organizationId: number,
    order: PurchaseOrder,
  ): Promise<void> {
    const items = await this.orderItemRepository.find({
      where: { orderId: order.id },
      relations: { product: true },
    });

    for (const item of items) {
      // Find or create stock item (default to first warehouse for now)
      const warehouseId = 1; // Default warehouse for auto-stocking
      let stockItem = await this.stockItemRepository.findOne({
        where: {
          organizationId,
          productId: item.productId,
          warehouseId,
        },
      });

      if (!stockItem) {
        stockItem = this.stockItemRepository.create({
          organizationId,
          productId: item.productId,
          warehouseId,
          quantity: 0,
          minStock: 0,
        });
      }

      stockItem.quantity += item.quantityOrdered;
      await this.stockItemRepository.save(stockItem);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        organizationId,
        productId: item.productId,
        warehouseId,
        type: 'in',
        quantity: item.quantityOrdered,
        balance: stockItem.quantity,
        reference: `Order #${order.orderNumber}`,
        notes: `Received from purchase order ${order.orderNumber}`,
      });
      await this.transactionRepository.save(transaction);
    }
  }

  async cancel(organizationId: number, id: number): Promise<PurchaseOrder> {
    return this.updateStatus(organizationId, id, { status: 'cancelled' });
  }
}
