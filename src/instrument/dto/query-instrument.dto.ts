import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { InstrumentStatus } from '../../common/enums/status.enum';
import { PaginationDto } from 'src/common/Dto';

/**
 * 仪器查询DTO
 * 支持关键词搜索、实验室ID筛选、状态筛选和分页
 */
export class QueryInstrumentDto extends PaginationDto {
  @ApiProperty({
    description: '实验室ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '实验室ID必须是整数' })
  labId?: number;

  @ApiProperty({
    description: '仪器状态(0-正常, 1-停用, 2-维护中, 3-故障, 4-借出)',
    required: false,
    enum: InstrumentStatus,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(InstrumentStatus, { message: '无效的仪器状态' })
  status?: InstrumentStatus;
}
