import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto';

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Get stock by product (with warehouse details)' })
  getStock(@Req() req: any, @Query('productId') productId?: string) {
    return this.stockService.getStockByProduct(
      req.user.organizationId,
      productId ? +productId : undefined,
    );
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock (creates transaction record)' })
  adjust(@Req() req: any, @Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(req.user.organizationId, dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get products where quantity < minStock' })
  getAlerts(@Req() req: any) {
    return this.stockService.getStockAlerts(req.user.organizationId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard KPIs' })
  getDashboard(@Req() req: any) {
    return this.stockService.getDashboardKpis(req.user.organizationId);
  }
}
