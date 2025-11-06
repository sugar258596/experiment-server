import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { InstrumentStatus } from '../entities/instrument.entity';

export class CreateInstrumentDto {
  @IsString()
  name: string;

  @IsString()
  model: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(InstrumentStatus)
  @IsOptional()
  status?: InstrumentStatus;

  @IsString()
  @IsOptional()
  specifications?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsUUID()
  @IsOptional()
  labId?: string;
}
