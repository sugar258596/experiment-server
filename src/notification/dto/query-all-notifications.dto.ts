import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  MaxLength,
  Min as MinValidator,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

/**
 * 查询所有通知DTO（管理员专用）
 * 支持关键字搜索、用户筛选和分页
 */
export class QueryAllNotificationsDto {
  @ApiPropertyOptional({
    description: '关键字（搜索通知标题和内容）',
    example: '预约',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '关键字不能超过50个字符' })
  keyword?: string;

  @ApiPropertyOptional({
    description: '用户ID（不传或传0查询所有用户，传具体用户ID查询指定用户）',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  @Min(0, { message: '用户ID必须为非负整数' })
  userId?: number;

  @ApiPropertyOptional({
    description: '是否已读(true=已读,false=未读)',
    required: false,
    type: 'boolean',
  })
  @IsOptional()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({
    description: '通知类型（不传查询所有类型）',
    example: 0,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  type?: number;

  @ApiPropertyOptional({
    description: '页码（从1开始）',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @MinValidator(1, { message: '页码必须大于0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @MinValidator(1, { message: '每页数量必须大于0' })
  pageSize?: number = 10;
}
