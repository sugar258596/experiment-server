import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstrumentStatus } from '../../common/enums/status.enum';

/**
 * 创建仪器DTO
 */
export class CreateInstrumentDto {
  @ApiProperty({
    description: '仪器名称',
    example: '示波器',
  })
  @IsString()
  @MaxLength(100, { message: '仪器名称不能超过100个字符' })
  name: string;

  @ApiProperty({
    description: '仪器型号',
    example: 'DSO-X 2012A',
  })
  @IsString()
  @MaxLength(100, { message: '仪器型号不能超过100个字符' })
  model: string;

  @ApiPropertyOptional({
    description: '仪器序列号',
    example: 'SN123456789',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '序列号不能超过100个字符' })
  serialNumber?: string;

  @ApiPropertyOptional({
    description: '仪器描述',
    example: '数字存储示波器，200MHz带宽',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '描述不能超过1000个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '仪器状态',
    enum: InstrumentStatus,
    example: InstrumentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;

  @ApiPropertyOptional({
    description: '仪器规格参数',
    example: '200MHz带宽，2GSa/s采样率',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '规格参数不能超过500个字符' })
  specifications?: string;

  @ApiPropertyOptional({
    description: '仪器二维码',
    example: 'QR123456',
  })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({
    description: '所属实验室ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '实验室ID必须为数字' })
  labId?: number;
}
