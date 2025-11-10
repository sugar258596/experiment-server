import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
} from 'class-validator';
import { PaginationDto } from 'src/common/Dto';
import { AppointmentStatus } from 'src/common/enums/status.enum';

export class SearchAppointmentDto extends PaginationDto {
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
}
