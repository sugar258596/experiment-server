import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '../../common/enums/status.enum';
import { PaginationDto } from 'src/common/Dto';

/**
 * 查询仪器申请DTO
 * 支持关键词搜索、仪器ID筛选、申请人ID筛选、状态筛选和分页
 */
export class QueryApplicationDto extends PaginationDto {
  @ApiProperty({
    description: '仪器ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '仪器ID必须是整数' })
  instrumentId?: number;

  @ApiProperty({
    description: '申请人ID',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '申请人ID必须是整数' })
  applicantId?: number;

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
