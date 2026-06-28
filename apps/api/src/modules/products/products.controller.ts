import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productsService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products with pagination, search, and category filter' })
  findAll(@Req() req: any, @Query() query: QueryProductDto) {
    return this.productsService.findAll(req.user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.productsService.findOne(req.user.organizationId, +id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(req.user.organizationId, +id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productsService.remove(req.user.organizationId, +id);
  }
}
