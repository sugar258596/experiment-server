import {
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabStatus } from '../../common/enums/status.enum';
import { Transform } from 'class-transformer';

/**
 * 创建实验室表单DTO (支持文件上传)
 * 用于接收 multipart/form-data 表单数据
 */
export class CreateLabFormDto {
  @ApiProperty({
    description: '实验室名称',
    example: '计算机基础实验室',
  })
  @IsString()
  @MaxLength(100, { message: '实验室名称不能超过100个字符' })
  name: string;

  @ApiProperty({
    description: '实验室位置',
    example: '实验楼A座301',
  })
  @IsString()
  @MaxLength(100, { message: '位置信息不能超过100个字符' })
  location: string;

  @ApiProperty({
    description: '实验室容量',
    example: 50,
    minimum: 1,
  })
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  @Min(1, { message: '容量至少为1' })
  capacity: number;

  @ApiPropertyOptional({
    description: '实验室描述',
    example: '配备50台电脑,支持Java、Python等编程语言教学',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '描述信息不能超过1000个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '实验室状态',
    enum: LabStatus,
    example: LabStatus.ACTIVE,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsEnum(LabStatus)
  status?: LabStatus;

  @ApiProperty({
    description: '所属院系',
    example: '计算机科学与技术学院',
  })
  @IsString()
  @MaxLength(100, { message: '院系名称不能超过100个字符' })
  department: string;

  @ApiPropertyOptional({
    description: '实验室标签(JSON字符串)',
    example: '["编程", "基础教学", "多媒体"]',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as number[]) : [value];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  tags?: string[] = [];

  @ApiPropertyOptional({
    description: '实验室图片文件(最多10张)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: Express.Multer.File[] = [];

  @ApiPropertyOptional({
    description: '关联的仪器ID数组(JSON字符串或数字数组)',
    example: '[1, 2, 3]',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | number[] }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as number[]) : [value];
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  @IsArray()
  instrumentIds?: number[] = [];
}
