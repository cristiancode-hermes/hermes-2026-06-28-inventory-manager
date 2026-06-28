import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { StockItem } from '../../entities/stock-item.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private orderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(StockItem)
    private stockItemRepository: Repository<StockItem>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async onModuleInit() {
    const orgCount = await this.orgRepository.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding demo data...');

    // 1. Create organization
    const org = this.orgRepository.create({ name: 'Demo Company' });
    const savedOrg = await this.orgRepository.save(org);

    // 2. Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = this.userRepository.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: hashedPassword,
      organizationId: savedOrg.id,
    });
    await this.userRepository.save(admin);

    // 3. Create 3 warehouses
    const warehouseData = [
      { name: 'Main Warehouse', location: '123 Industrial Blvd, City', capacity: 10000, organizationId: savedOrg.id },
      { name: 'East Distribution', location: '456 Commerce Ave, City', capacity: 5000, organizationId: savedOrg.id },
      { name: 'Cold Storage', location: '789 Freezer Rd, City', capacity: 2000, organizationId: savedOrg.id },
    ];
    const warehouses = await this.warehouseRepository.save(
      warehouseData.map((w) => this.warehouseRepository.create(w)),
    );

    // 4. Create 10 products
    const productData = [
      { sku: 'WDG-001', name: 'Widget Alpha', category: 'Electronics', unitPrice: 29.99, reorderLevel: 20, organizationId: savedOrg.id },
      { sku: 'WDG-002', name: 'Widget Beta', category: 'Electronics', unitPrice: 49.99, reorderLevel: 15, organizationId: savedOrg.id },
      { sku: 'BOL-001', name: 'Bolt M10', category: 'Hardware', unitPrice: 0.50, reorderLevel: 500, organizationId: savedOrg.id },
      { sku: 'NUT-001', name: 'Nut M10', category: 'Hardware', unitPrice: 0.30, reorderLevel: 500, organizationId: savedOrg.id },
      { sku: 'LUB-001', name: 'Lubricant Oil 5L', category: 'Chemicals', unitPrice: 45.00, reorderLevel: 10, organizationId: savedOrg.id },
      { sku: 'SEA-001', name: 'Rubber Seal Kit', category: 'Parts', unitPrice: 15.00, reorderLevel: 30, organizationId: savedOrg.id },
      { sku: 'FIL-001', name: 'Air Filter', category: 'Parts', unitPrice: 22.50, reorderLevel: 25, organizationId: savedOrg.id },
      { sku: 'BEL-001', name: 'Drive Belt', category: 'Parts', unitPrice: 18.00, reorderLevel: 40, organizationId: savedOrg.id },
      { sku: 'TOO-001', name: 'Tool Set Pro', category: 'Tools', unitPrice: 89.99, reorderLevel: 5, organizationId: savedOrg.id },
      { sku: 'PAC-001', name: 'Packaging Box', category: 'Supplies', unitPrice: 1.20, reorderLevel: 1000, organizationId: savedOrg.id },
    ];
    const products = await this.productRepository.save(
      productData.map((p) => this.productRepository.create({ ...p, description: `Description for ${p.name}`, isActive: true })),
    );

    // 5. Create 5 suppliers
    const supplierData = [
      { name: 'Acme Supplies', contactName: 'John Smith', email: 'john@acme.com', phone: '+1-555-0101', organizationId: savedOrg.id },
      { name: 'Global Parts Co', contactName: 'Jane Doe', email: 'jane@globalparts.com', phone: '+1-555-0102', organizationId: savedOrg.id },
      { name: 'Tech Components Ltd', contactName: 'Bob Wilson', email: 'bob@techcomp.com', phone: '+1-555-0103', organizationId: savedOrg.id },
      { name: 'Industrial Raw Inc', contactName: 'Alice Brown', email: 'alice@industrialraw.com', phone: '+1-555-0104', organizationId: savedOrg.id },
      { name: 'Packaging Plus', contactName: 'Charlie Davis', email: 'charlie@packplus.com', phone: '+1-555-0105', organizationId: savedOrg.id },
    ];
    const suppliers = await this.supplierRepository.save(
      supplierData.map((s) => this.supplierRepository.create({ ...s, address: `${s.name} Address`, isActive: true, notes: 'Preferred vendor' })),
    );

    // 6. Create stock items
    const stockItems: any[] = [];
    for (let i = 0; i < products.length; i++) {
      const warehouse = warehouses[i % 3];
      const qty = (i + 1) * 10;
      stockItems.push({
        organizationId: savedOrg.id,
        productId: products[i].id,
        warehouseId: warehouse.id,
        quantity: qty,
        minStock: productData[i].reorderLevel,
        maxStock: qty * 3,
      });
    }
    await this.stockItemRepository.save(
      stockItems,
    );

    // 7. Create 3 purchase orders with items
    const orderData = [
      {
        orderNumber: 'PO-00001',
        supplierId: suppliers[0].id,
        status: 'received',
        totalAmount: 599.50,
        notes: 'Initial stock order',
        orderedAt: new Date('2024-12-01'),
        receivedAt: new Date('2024-12-10'),
        items: [
          { productId: products[0].id, quantityOrdered: 50, unitPrice: 25.99, lineTotal: 1299.50 },
          { productId: products[1].id, quantityOrdered: 30, unitPrice: 45.00, lineTotal: 1350.00 },
        ],
      },
      {
        orderNumber: 'PO-00002',
        supplierId: suppliers[1].id,
        status: 'sent',
        totalAmount: 450.00,
        notes: 'Restock order',
        orderedAt: new Date('2025-01-05'),
        items: [
          { productId: products[2].id, quantityOrdered: 500, unitPrice: 0.45, lineTotal: 225.00 },
          { productId: products[3].id, quantityOrdered: 500, unitPrice: 0.25, lineTotal: 125.00 },
        ],
      },
      {
        orderNumber: 'PO-00003',
        supplierId: suppliers[2].id,
        status: 'pending',
        totalAmount: 899.90,
        notes: 'Special order',
        expectedDate: '2025-02-01',
        items: [
          { productId: products[4].id, quantityOrdered: 20, unitPrice: 42.00, lineTotal: 840.00 },
          { productId: products[5].id, quantityOrdered: 50, unitPrice: 14.00, lineTotal: 700.00 },
          { productId: products[6].id, quantityOrdered: 30, unitPrice: 20.00, lineTotal: 600.00 },
        ],
      },
    ];

    for (const orderDataItem of orderData) {
      const { items, ...orderFields } = orderDataItem;
      const order = this.orderRepository.create({
        ...orderFields,
        organizationId: savedOrg.id,
      });
      const savedOrder = await this.orderRepository.save(order);

      await this.orderItemRepository.save(
        items.map((item) =>
          this.orderItemRepository.create({
            organizationId: savedOrg.id,
            orderId: savedOrder.id,
            ...item,
          }),
        ),
      );
    }

    // 8. Create some inventory transactions
    const txData = [
      { productId: products[0].id, warehouseId: warehouses[0].id, type: 'in', quantity: 100, balance: 100, reference: 'Initial stock', notes: 'Initial setup' },
      { productId: products[1].id, warehouseId: warehouses[0].id, type: 'in', quantity: 50, balance: 50, reference: 'Initial stock', notes: 'Initial setup' },
      { productId: products[2].id, warehouseId: warehouses[1].id, type: 'out', quantity: 20, balance: 30, reference: 'Work order WO-001', notes: 'Production use' },
      { productId: products[0].id, warehouseId: warehouses[0].id, type: 'adjust', quantity: 95, balance: 95, reference: 'Inventory count', notes: 'Adjusted after physical count' },
    ];
    await this.transactionRepository.save(
      txData.map((t) =>
        this.transactionRepository.create({
          organizationId: savedOrg.id,
          ...t,
        }),
      ),
    );

    this.logger.log('Demo data seeded successfully!');
    this.logger.log('Login with admin@demo.com / admin123');
  }
}
