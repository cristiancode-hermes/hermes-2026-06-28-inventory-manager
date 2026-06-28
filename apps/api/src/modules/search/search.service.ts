import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private orderRepository: Repository<PurchaseOrder>,
  ) {}

  async search(organizationId: number, query: string) {
    const searchTerm = `%${query}%`;

    const [products, suppliers, orders] = await Promise.all([
      this.productRepository.find({
        where: [
          { organizationId, name: Like(searchTerm) },
          { organizationId, sku: Like(searchTerm) },
          { organizationId, category: Like(searchTerm) },
        ],
        take: 10,
      }),
      this.supplierRepository.find({
        where: [
          { organizationId, name: Like(searchTerm) },
          { organizationId, contactName: Like(searchTerm) },
          { organizationId, email: Like(searchTerm) },
        ],
        take: 10,
      }),
      this.orderRepository.find({
        where: { organizationId, orderNumber: Like(searchTerm) },
        relations: { supplier: true },
        take: 10,
      }),
    ]);

    return { products, suppliers, orders };
  }
}
