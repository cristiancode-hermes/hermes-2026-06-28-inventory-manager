import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { QueryTransactionDto } from './dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
  ) {}

  async findAll(organizationId: number, query: QueryTransactionDto) {
    const {
      productId,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;
    const where: any = { organizationId };

    if (productId) {
      where.productId = productId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const [items, total] = await this.transactionRepository.findAndCount({
      where,
      relations: { product: true, warehouse: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit };
  }
}
