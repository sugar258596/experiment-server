import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../../common/enums/status.enum';
import { PaginationDto } from 'src/common/Dto';

/**
 * 查询我的仪器申请DTO
 * 支持关键词搜索、状态筛选和分页
 */
export class QueryMyApplicationDto extends PaginationDto {
  @ApiProperty({
    description: '申请状态(0-待审核, 1-已通过, 2-已拒绝)',
    required: false,
    enum: ApplicationStatus,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(ApplicationStatus, { message: '无效的申请状态' })
  status?: ApplicationStatus;
}
