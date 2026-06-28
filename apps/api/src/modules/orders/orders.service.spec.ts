import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { StockItem } from '../../entities/stock-item.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

const createMockOrder = () => ({
  id: 1,
  organizationId: 1,
  orderNumber: 'PO-00001',
  supplierId: 1,
  status: 'pending',
  totalAmount: 519.80,
  expectedDate: '2025-02-01',
  notes: '',
  orderedAt: null,
  receivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  supplier: { id: 1, name: 'Acme Corp' },
  items: [],
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let orderItemRepo: any;
  let productRepo: any;
  let supplierRepo: any;
  let stockItemRepo: any;
  let txnRepo: any;

  beforeEach(async () => {
    orderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
    };
    orderItemRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    productRepo = {
      findOne: jest.fn(),
    };
    supplierRepo = {
      findOne: jest.fn(),
    };
    stockItemRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    txnRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(PurchaseOrder), useValue: orderRepo },
        { provide: getRepositoryToken(PurchaseOrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Supplier), useValue: supplierRepo },
        { provide: getRepositoryToken(StockItem), useValue: stockItemRepo },
        { provide: getRepositoryToken(InventoryTransaction), useValue: txnRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    const mockCreateDto = {
      supplierId: 1,
      expectedDate: '2025-02-01',
      items: [
        { productId: 1, quantityOrdered: 10, unitPrice: 25.99 },
        { productId: 2, quantityOrdered: 5, unitPrice: 51.99 },
      ],
    };

    it('should create order with calculated totals', async () => {
      supplierRepo.findOne.mockResolvedValue({ id: 1, name: 'Acme Corp' });
      productRepo.findOne
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });
      orderRepo.count.mockResolvedValue(0);
      orderRepo.create.mockReturnValue(createMockOrder());
      orderRepo.save.mockResolvedValue(createMockOrder());
      orderItemRepo.create.mockImplementation((dto) => dto);
      orderItemRepo.save.mockResolvedValue([]);
      orderRepo.findOne.mockResolvedValue(createMockOrder());

      const result = await service.create(1, mockCreateDto as any);

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 1,
          orderNumber: 'PO-00001',
          supplierId: 1,
          status: 'pending',
          totalAmount: expect.closeTo(519.85, 2), // 10*25.99 + 5*51.99
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if supplier not found', async () => {
      supplierRepo.findOne.mockResolvedValue(null);

      await expect(service.create(1, mockCreateDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if a product not found', async () => {
      supplierRepo.findOne.mockResolvedValue({ id: 1 });
      productRepo.findOne.mockResolvedValueOnce({ id: 1 }); // First product found
      productRepo.findOne.mockResolvedValueOnce(null); // Second product missing

      await expect(service.create(1, mockCreateDto as any)).rejects.toThrow(
        'Product 2 not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders with supplier relation', async () => {
      const mockOrders = [createMockOrder()];
      orderRepo.findAndCount.mockResolvedValue([mockOrders, 1]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(orderRepo.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: { supplier: true },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      orderRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, { status: 'pending', page: 1, limit: 10 });

      expect(orderRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 1, status: 'pending' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order with relations', async () => {
      const mockOrder = createMockOrder();
      orderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne(1, 1);

      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, organizationId: 1 },
        relations: { supplier: true, items: { product: true } },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw if not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    const mockPendingOrder = () => ({
      ...createMockOrder(),
      status: 'pending',
    });

    it('should transition from pending to sent', async () => {
      const order = mockPendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: 'sent', orderedAt: expect.any(Date) });

      const result = await service.updateStatus(1, 1, { status: 'sent' });

      expect(result.status).toBe('sent');
    });

    it('should transition from pending to cancelled', async () => {
      const order = mockPendingOrder();
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: 'cancelled' });

      const result = await service.updateStatus(1, 1, { status: 'cancelled' });

      expect(result.status).toBe('cancelled');
    });

    it('should reject invalid transition (received directly from pending)', async () => {
      const order = mockPendingOrder();
      orderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.updateStatus(1, 1, { status: 'received' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process received order and increment stock', async () => {
      const order = { ...mockPendingOrder(), status: 'sent' };
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: 'received' });

      orderItemRepo.find.mockResolvedValue([
        { id: 1, productId: 1, quantityOrdered: 10 },
      ]);
      stockItemRepo.findOne.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 20,
      });
      stockItemRepo.save.mockResolvedValue({ quantity: 30 });
      txnRepo.create.mockReturnValue({});
      txnRepo.save.mockResolvedValue({});

      const result = await service.updateStatus(1, 1, { status: 'received' });

      expect(result.status).toBe('received');
      expect(stockItemRepo.save).toHaveBeenCalled();
      expect(stockItemRepo.save.mock.calls[0][0].quantity).toBe(30); // 20 + 10
    });

    it('should reject cancelled -> sent transition', async () => {
      const order = { ...mockPendingOrder(), status: 'cancelled' };
      orderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.updateStatus(1, 1, { status: 'sent' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject received -> anything transition', async () => {
      const order = { ...mockPendingOrder(), status: 'received' };
      orderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.updateStatus(1, 1, { status: 'cancelled' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const order = createMockOrder();
      orderRepo.findOne.mockResolvedValue(order);
      orderRepo.save.mockResolvedValue({ ...order, status: 'cancelled' });

      const result = await service.cancel(1, 1);

      expect(result.status).toBe('cancelled');
    });
  });
});
