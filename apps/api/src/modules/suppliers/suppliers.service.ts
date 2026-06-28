import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(organizationId: number, dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      ...dto,
      organizationId,
    });
    return this.supplierRepository.save(supplier);
  }

  async findAll(organizationId: number) {
    return this.supplierRepository.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
  }

  async findOne(organizationId: number, id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id, organizationId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async update(organizationId: number, id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(organizationId, id);
    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  async toggleActive(organizationId: number, id: number): Promise<Supplier> {
    const supplier = await this.findOne(organizationId, id);
    supplier.isActive = !supplier.isActive;
    return this.supplierRepository.save(supplier);
  }

  async remove(organizationId: number, id: number): Promise<void> {
    const supplier = await this.findOne(organizationId, id);
    await this.supplierRepository.remove(supplier);
  }
}
