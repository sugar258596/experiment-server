import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建新闻公告DTO
 */
export class CreateNewsDto {
  @ApiProperty({
    description: '新闻标题',
    example: '实验室开放时间调整通知',
  })
  @IsString()
  @MaxLength(200, { message: '标题不能超过200个字符' })
  title: string;

  @ApiProperty({
    description: '新闻内容',
    example: '根据学校安排,实验室开放时间调整为...',
  })
  @IsString()
  @MaxLength(5000, { message: '内容不能超过5000个字符' })
  content: string;

  @ApiPropertyOptional({
    description: '封面图片URL',
    example: 'https://example.com/news-cover.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: '封面图片URL格式不正确' })
  coverImage?: string;

  @ApiPropertyOptional({
    description: '新闻图片URL列表',
    example: ['https://example.com/news1.jpg', 'https://example.com/news2.jpg'],
  })
  @IsOptional()
  @IsArray()
  images?: string[] = [];

  @ApiPropertyOptional({
    description: '新闻标签',
    example: ['通知', '实验室', '时间调整'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[] = [];
}
