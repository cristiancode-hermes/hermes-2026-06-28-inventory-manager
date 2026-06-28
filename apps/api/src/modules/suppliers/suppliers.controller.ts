import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier' })
  create(@Req() req: any, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  findAll(@Req() req: any) {
    return this.suppliersService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.findOne(req.user.organizationId, +id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(req.user.organizationId, +id, dto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle supplier active/inactive' })
  toggleActive(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.toggleActive(req.user.organizationId, +id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.remove(req.user.organizationId, +id);
  }
}
