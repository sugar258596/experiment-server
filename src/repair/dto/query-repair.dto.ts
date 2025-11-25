import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RepairStatus } from '../../common/enums/status.enum';
import { PaginationDto } from 'src/common/Dto';

/**
 * 查询维修记录DTO
 * 支持关键词搜索（仪器名称）、状态筛选和分页
 */
export class QueryRepairDto extends PaginationDto {
  @ApiProperty({
    description: '维修状态(0-待处理, 1-维修中, 2-已完成)',
    required: false,
    enum: RepairStatus,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(RepairStatus, { message: '无效的维修状态' })
  status?: RepairStatus;
}
