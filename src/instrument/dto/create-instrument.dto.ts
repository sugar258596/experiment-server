import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstrumentStatus } from '../../common/enums/status.enum';
import { Transform } from 'class-transformer';

/**
 * 创建仪器DTO (支持文件上传)
 * 用于接收 multipart/form-data 表单数据
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
    example: '数字存储示波器,200MHz带宽',
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
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsEnum(InstrumentStatus)
  status?: InstrumentStatus;

  @ApiPropertyOptional({
    description: '仪器规格参数',
    example: '200MHz带宽,2GSa/s采样率',
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
  @Transform(({ value }: { value: string | number }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsNumber({}, { message: '实验室ID必须为数字' })
  labId?: number;

  @ApiPropertyOptional({
    description: '仪器图片文件(最多10张)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: Express.Multer.File[] = [];
}
