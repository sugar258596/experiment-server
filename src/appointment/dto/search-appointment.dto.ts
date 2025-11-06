import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
} from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class SearchAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  labId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
