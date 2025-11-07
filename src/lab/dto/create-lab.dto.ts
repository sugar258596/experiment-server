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

/**
 * 创建实验室DTO
 */
export class CreateLabDto {
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
  @IsInt()
  @Min(1, { message: '容量至少为1' })
  capacity: number;

  @ApiPropertyOptional({
    description: '实验室描述',
    example: '配备50台电脑，支持Java、Python等编程语言教学',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '描述信息不能超过1000个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '实验室图片URL列表',
    example: ['https://example.com/lab1.jpg', 'https://example.com/lab2.jpg'],
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({
    description: '实验室状态',
    enum: LabStatus,
    example: LabStatus.ACTIVE,
  })
  @IsOptional()
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
    description: '设备列表',
    example: ['投影仪', '电脑50台', '空调'],
  })
  @IsOptional()
  @IsArray()
  equipmentList?: string[];

  @ApiPropertyOptional({
    description: '实验室标签',
    example: ['编程', '基础教学', '多媒体'],
  })
  @IsOptional()
  @IsArray()
  tags?: string[];
}
