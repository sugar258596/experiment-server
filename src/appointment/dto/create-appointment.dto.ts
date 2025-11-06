import {
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { TimeSlot } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  labId: string;

  @IsDateString()
  appointmentDate: string;

  @IsEnum(TimeSlot)
  timeSlot: TimeSlot;

  @IsString()
  purpose: string;

  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  participantCount: number;
}
