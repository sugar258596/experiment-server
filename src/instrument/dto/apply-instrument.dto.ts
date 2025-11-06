import { IsString, IsUUID, IsDate, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyInstrumentDto {
  @IsUUID()
  instrumentId: string;

  @IsString()
  @MinLength(1)
  purpose: string;

  @IsString()
  @MinLength(50, { message: '详细说明至少需要50个字符' })
  description: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;
}
