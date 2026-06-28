import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: any;

  const createMockProduct = () => ({
    id: 1,
    organizationId: 1,
    sku: 'SKU-001',
    name: 'Widget Alpha',
    description: 'A high-quality widget',
    category: 'Electronics',
    unitPrice: 29.99,
    reorderLevel: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    productRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('should create and return a product', async () => {
      const dto = {
        sku: 'SKU-001',
        name: 'Widget Alpha',
        unitPrice: 29.99,
      };
      const expected = { id: 1, ...dto, organizationId: 1 };
      productRepo.create.mockReturnValue(expected);
      productRepo.save.mockResolvedValue(expected);

      const result = await service.create(1, dto as any);

      expect(productRepo.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 1,
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockItems = [createMockProduct()];
      productRepo.findAndCount.mockResolvedValue([mockItems, 1]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(productRepo.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        items: mockItems,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should apply search filter by name', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, { search: 'widget', page: 1, limit: 10 });

      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object), // Like('%widget%')
          }),
        }),
      );
    });

    it('should apply category filter', async () => {
      productRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(1, { category: 'Electronics', page: 1, limit: 10 });

      expect(productRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Electronics',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = createMockProduct();
      productRepo.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1, 1);

      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, organizationId: 1 },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return product', async () => {
      const existing = createMockProduct();
      productRepo.findOne.mockResolvedValue(existing);
      productRepo.save.mockResolvedValue({ ...existing, name: 'Updated Widget' });

      const result = await service.update(1, 1, { name: 'Updated Widget' });

      expect(productRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Widget' }),
      );
      expect(result.name).toBe('Updated Widget');
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, 999, { name: 'Ghost' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const existing = createMockProduct();
      productRepo.findOne.mockResolvedValue(existing);
      productRepo.remove.mockResolvedValue(existing);

      await service.remove(1, 1);

      expect(productRepo.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
