import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseStatus } from '../../common/enums/status.enum';

/**
 * 创建轮播图 DTO (支持文件上传)
 * 用于接收 multipart/form-data 表单数据
 */
export class CreateBannerDto {
  @ApiProperty({ description: '轮播图标题', example: '欢迎使用实验室预约系统' })
  @IsString()
  @MaxLength(200, { message: '标题不能超过200个字符' })
  title: string;

  @ApiProperty({ description: '轮播图类型ID', example: 1 })
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  typeId: number;

  @ApiPropertyOptional({
    description: '轮播图图片文件(最多10张)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: Express.Multer.File[] = [];

  @ApiPropertyOptional({
    description: '链接地址',
    example: 'https://example.com/news/123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '链接地址不能超过500个字符' })
  link?: string;

  @ApiPropertyOptional({
    description: '描述信息',
    example: '这是一条轮播图的描述',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '描述信息不能超过1000个字符' })
  description?: string;

  @ApiPropertyOptional({ description: '排序值', default: 0 })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({
    description: '状态：0-启用，1-禁用',
    enum: BaseStatus,
    default: BaseStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsEnum(BaseStatus)
  status?: BaseStatus;
}
