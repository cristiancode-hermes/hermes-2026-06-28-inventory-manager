import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { QueryTransactionDto } from './dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions (paginated, filter by product/type/date range)' })
  findAll(@Req() req: any, @Query() query: QueryTransactionDto) {
    return this.transactionsService.findAll(req.user.organizationId, query);
  }
}
