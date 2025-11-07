import {
  IsString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FaultType, UrgencyLevel } from '../../common/enums/status.enum';

/**
 * 仪器故障报告DTO
 */
export class ReportInstrumentDto {
  @ApiProperty({
    description: '仪器ID',
    example: 'instrument-001',
  })
  @IsUUID('4', { message: '仪器ID格式不正确' })
  instrumentId: string;

  @ApiProperty({
    description: '故障类型',
    enum: FaultType,
    example: FaultType.HARDWARE,
  })
  @IsEnum(FaultType)
  faultType: FaultType;

  @ApiProperty({
    description: '故障描述',
    example: '示波器开机后屏幕无显示，电源指示灯亮，风扇转动正常',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(20, { message: '故障描述至少需要20个字符' })
  @MaxLength(1000, { message: '故障描述不能超过1000个字符' })
  description: string;

  @ApiProperty({
    description: '紧急程度',
    enum: UrgencyLevel,
    example: UrgencyLevel.HIGH,
  })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;
}
