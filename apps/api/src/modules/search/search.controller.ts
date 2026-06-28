import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchDto } from './dto';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across products, suppliers, and orders' })
  search(@Req() req: any, @Query() dto: SearchDto) {
    return this.searchService.search(req.user.organizationId, dto.q);
  }
}
