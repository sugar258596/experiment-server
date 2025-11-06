import { IsString, IsEnum, IsUUID, MinLength } from 'class-validator';
import { FaultType, UrgencyLevel } from '../entities/instrument-repair.entity';

export class ReportInstrumentDto {
  @IsUUID()
  instrumentId: string;

  @IsEnum(FaultType)
  faultType: FaultType;

  @IsString()
  @MinLength(20, { message: '故障描述至少需要20个字符' })
  description: string;

  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;
}
