import { ApiPropertyOptional } from '@nestjs/swagger';
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
 * 更新轮播图 DTO (支持文件上传)
 * 用于接收 multipart/form-data 表单数据
 * 所有字段都是可选的
 */
export class UpdateBannerDto {
  @ApiPropertyOptional({
    description: '轮播图标题',
    example: '欢迎使用实验室预约系统',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '标题不能超过200个字符' })
  title?: string;

  @ApiPropertyOptional({ description: '轮播图类型ID', example: 1 })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  typeId?: number;

  @ApiPropertyOptional({
    description:
      '轮播图图片（自动检测模式）：1. 仅上传文件 - 替换所有旧图片；2. 上传文件 + 传入images(旧图URL字符串/数组) - 混合模式，保留指定的旧图片并追加新图片；3. 仅传入images - 保持/调整模式；4. 都不传 - 保持原样',
    oneOf: [
      {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
        description: '上传新图片文件(最多10张)',
      },
      {
        type: 'string',
        description: '单个图片URL字符串',
        example: 'http://localhost:3000/static/uploads/banners/1234567890.jpg',
      },
      {
        type: 'array',
        items: {
          type: 'string',
        },
        description: '多个图片URL字符串数组',
        example: [
          'http://localhost:3000/static/uploads/banners/1234567890.jpg',
          'http://localhost:3000/static/uploads/banners/1234567891.jpg',
        ],
      },
    ],
  })
  @IsOptional()
  images?: string | string[] | Express.Multer.File[] = [];

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
