import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建评价DTO
 */
export class CreateEvaluationDto {
  @ApiProperty({
    description: '实验室ID',
    example: 'lab-001',
  })
  @IsUUID('4', { message: '实验室ID格式不正确' })
  labId: string;

  @ApiProperty({
    description: '总体评分（1-5分）',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: '评分至少为1分' })
  @Max(5, { message: '评分最多为5分' })
  overallRating: number;

  @ApiProperty({
    description: '设备评分（1-5分）',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: '评分至少为1分' })
  @Max(5, { message: '评分最多为5分' })
  equipmentRating: number;

  @ApiProperty({
    description: '环境评分（1-5分）',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: '评分至少为1分' })
  @Max(5, { message: '评分最多为5分' })
  environmentRating: number;

  @ApiProperty({
    description: '服务评分（1-5分）',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: '评分至少为1分' })
  @Max(5, { message: '评分最多为5分' })
  serviceRating: number;

  @ApiPropertyOptional({
    description: '评价备注',
    example: '实验室设备齐全，环境整洁，老师服务态度很好',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '评价备注不能超过200个字符' })
  comment?: string;
}
