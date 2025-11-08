import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 创建新闻公告表单DTO (支持文件上传)
 * 用于接收 multipart/form-data 表单数据
 */
export class CreateNewsFormDto {
  @ApiProperty({
    description: '新闻标题',
    example: '实验室开放时间调整通知',
    required: true,
  })
  @IsString()
  @MaxLength(200, { message: '标题不能超过200个字符' })
  title: string;

  @ApiProperty({
    description: '新闻内容',
    example: '根据学校安排,实验室开放时间调整为...',
    required: true,
  })
  @IsString()
  @MaxLength(5000, { message: '内容不能超过5000个字符' })
  content: string;

  @ApiPropertyOptional({
    description: '新闻标签(JSON字符串)',
    example: '["通知", "实验室", "时间调整"]',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  tags?: string[] = [];

  @ApiPropertyOptional({
    description: '封面图片文件',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  coverImage?: Express.Multer.File;

  @ApiPropertyOptional({
    description: '新闻图片文件(最多10张)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: Express.Multer.File[] = [];
}
