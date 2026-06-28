import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockItem } from '../../entities/stock-item.entity';
import { Product } from '../../entities/product.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';

describe('StockService', () => {
  let service: StockService;
  let stockRepo: any;
  let productRepo: any;
  let warehouseRepo: any;
  let txnRepo: any;

  beforeEach(async () => {
    stockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    productRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };
    warehouseRepo = {
      findOne: jest.fn(),
      count: jest.fn(),
    };
    txnRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(StockItem), useValue: stockRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Warehouse), useValue: warehouseRepo },
        { provide: getRepositoryToken(InventoryTransaction), useValue: txnRepo },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  describe('adjustStock', () => {
    it('should increase quantity for type "in"', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1, name: 'Test Product' });
      warehouseRepo.findOne.mockResolvedValue({ id: 1, name: 'Main' });
      stockRepo.findOne.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 10,
        minStock: 5,
      });
      stockRepo.save.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 25,
      });
      txnRepo.create.mockReturnValue({});
      txnRepo.save.mockResolvedValue({});

      const result = await service.adjustStock(1, {
        productId: 1,
        warehouseId: 1,
        type: 'in',
        quantity: 15,
        reference: 'Manual entry',
      });

      expect(result.quantity).toBe(25);
      expect(txnRepo.create).toHaveBeenCalled();
    });

    it('should decrease quantity for type "out"', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1 });
      warehouseRepo.findOne.mockResolvedValue({ id: 1 });
      stockRepo.findOne.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 50,
        minStock: 10,
      });
      stockRepo.save.mockResolvedValue({
        id: 1,
        quantity: 30,
      });
      txnRepo.create.mockReturnValue({});
      txnRepo.save.mockResolvedValue({});

      const result = await service.adjustStock(1, {
        productId: 1,
        warehouseId: 1,
        type: 'out',
        quantity: 20,
      });

      expect(result.quantity).toBe(30);
    });

    it('should reject "out" when insufficient stock', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1 });
      warehouseRepo.findOne.mockResolvedValue({ id: 1 });
      stockRepo.findOne.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 5,
      });

      await expect(
        service.adjustStock(1, {
          productId: 1,
          warehouseId: 1,
          type: 'out',
          quantity: 20,
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should set exact quantity for type "adjust"', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1 });
      warehouseRepo.findOne.mockResolvedValue({ id: 1 });
      stockRepo.findOne.mockResolvedValue({
        id: 1,
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 50,
      });
      stockRepo.save.mockResolvedValue({
        id: 1,
        quantity: 100,
      });
      txnRepo.create.mockReturnValue({});
      txnRepo.save.mockResolvedValue({});

      const result = await service.adjustStock(1, {
        productId: 1,
        warehouseId: 1,
        type: 'adjust',
        quantity: 100,
      });

      expect(result.quantity).toBe(100);
    });

    it('should throw on invalid transaction type', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1 });
      warehouseRepo.findOne.mockResolvedValue({ id: 1 });
      stockRepo.findOne.mockResolvedValue({
        id: 1,
        quantity: 10,
      });

      await expect(
        service.adjustStock(1, {
          productId: 1,
          warehouseId: 1,
          type: 'invalid' as any,
          quantity: 5,
        }),
      ).rejects.toThrow('Invalid transaction type');
    });

    it('should create stock item if it does not exist', async () => {
      productRepo.findOne.mockResolvedValue({ id: 1, name: 'New Product' });
      warehouseRepo.findOne.mockResolvedValue({ id: 1, name: 'Main' });
      stockRepo.findOne.mockResolvedValue(null);
      stockRepo.create.mockReturnValue({
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 0,
        minStock: 0,
      });
      stockRepo.save.mockResolvedValue({
        id: 2,
        quantity: 30,
      });
      txnRepo.create.mockReturnValue({});
      txnRepo.save.mockResolvedValue({});

      const result = await service.adjustStock(1, {
        productId: 1,
        warehouseId: 1,
        type: 'in',
        quantity: 30,
      });

      expect(stockRepo.create).toHaveBeenCalledWith({
        organizationId: 1,
        productId: 1,
        warehouseId: 1,
        quantity: 0,
        minStock: 0,
      });
      expect(result.quantity).toBe(30);
    });
  });

  describe('getStockAlerts', () => {
    it('should return items where quantity < minStock', async () => {
      const mockQB = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, quantity: 3, minStock: 10 },
          { id: 2, quantity: 0, minStock: 5 },
        ]),
      };
      stockRepo.createQueryBuilder.mockReturnValue(mockQB);

      const result = await service.getStockAlerts(1);
      expect(result).toHaveLength(2);
      expect(mockQB.andWhere).toHaveBeenCalledWith(
        'si.quantity < si.minStock',
      );
    });
  });
});
