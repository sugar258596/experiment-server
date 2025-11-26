import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 查询我的通知DTO
 * 支持按类型和已读状态筛选
 * 默认只查询未读通知
 */
export class QueryMyNotificationsDto {
  @ApiPropertyOptional({
    description: '通知类型（不传查询所有类型）',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  type?: number;

  @ApiPropertyOptional({
    description: '是否已读(true=已读,false=未读，默认false查询未读)',
    required: false,
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead: boolean = false;
}
