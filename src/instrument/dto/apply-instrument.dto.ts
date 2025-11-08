import {
  IsString,
  IsDate,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 仪器使用申请DTO
 */
export class ApplyInstrumentDto {
  @ApiPropertyOptional({
    description: '使用目的',
    example: '信号测量实验',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '使用目的不能超过200个字符' })
  purpose?: string;

  @ApiProperty({
    description: '详细说明',
    example:
      '需要使用示波器测量正弦波的幅度和频率,并分析波形的失真情况。实验预计耗时2小时。',
    minLength: 50,
  })
  @IsString()
  @MinLength(50, { message: '详细说明至少需要50个字符' })
  @MaxLength(1000, { message: '详细说明不能超过1000个字符' })
  description: string;

  @ApiProperty({
    description: '开始使用时间',
    example: '2024-01-15T09:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({
    description: '结束使用时间',
    example: '2024-01-15T11:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  endTime: Date;
}
