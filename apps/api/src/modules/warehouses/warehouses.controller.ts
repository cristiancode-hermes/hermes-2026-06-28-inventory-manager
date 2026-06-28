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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a warehouse' })
  create(@Req() req: any, @Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all warehouses with capacity percentage' })
  findAll(@Req() req: any) {
    return this.warehousesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.warehousesService.findOne(req.user.organizationId, +id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a warehouse' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(req.user.organizationId, +id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a warehouse' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.warehousesService.remove(req.user.organizationId, +id);
  }
}
