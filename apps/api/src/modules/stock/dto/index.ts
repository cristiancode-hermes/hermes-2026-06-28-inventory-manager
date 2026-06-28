import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  warehouseId: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'in', enum: ['in', 'out', 'adjust'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'Manual adjustment' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Restocked after audit' })
  @IsOptional()
  @IsString()
  notes?: string;
}
