import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(organizationId: number, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create({
      ...dto,
      organizationId,
    });
    return this.productRepository.save(product);
  }

  async findAll(organizationId: number, query: QueryProductDto) {
    const { search, category, page = 1, limit = 10 } = query;
    const where: any = { organizationId };

    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (category) {
      where.category = category;
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async findOne(organizationId: number, id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, organizationId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(organizationId: number, id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(organizationId, id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async remove(organizationId: number, id: number): Promise<void> {
    const product = await this.findOne(organizationId, id);
    await this.productRepository.remove(product);
  }
}
