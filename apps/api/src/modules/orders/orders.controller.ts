import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrderDto } from './dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase order (multi-item with auto total)' })
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders (paginated, filter by status)' })
  findAll(@Req() req: any, @Query() query: QueryOrderDto) {
    return this.ordersService.findAll(req.user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with items' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.organizationId, +id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (received -> auto-increment stock)' })
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(req.user.organizationId, +id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.cancel(req.user.organizationId, +id);
  }
}
